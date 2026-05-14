// backend/middleware/rateLimiter.js
/*
DO NOT USE THIS RATE LIMITER IN PRODUCTION!
a generic, IP-based rate limiter. It's great for preventing abuse from 
a single IP address but isn't designed to handle your application's specific, 
per-user limits for different services.
*/
import User from "../models/user.model.js";

export const checkUserLimits = async (req, res, next) => {
  // Assuming an auth middleware has already verified the token and attached firebaseUID
  const firebaseUID =
    req.user?.firebaseUID || req.headers.authorization?.split("Bearer ")[1]; // Get UID reliably

  // The specific API service being called MUST be sent by the client
  // Ensure consistent naming across frontend and backend (e.g., 'recipeGeneration', 'mealConvert')
  const apiService = req.body.apiService || req.header("X-API-Service"); // Check body first, then header as fallback

  if (!firebaseUID) {
    console.warn("rateLimiter: No Firebase UID found in request.");
    return res
      .status(401)
      .json({ error: "Unauthorized - Authentication required" });
  }

  if (!apiService) {
    console.error(
      `rateLimiter: API Service identifier missing for user ${firebaseUID}, path ${req.path}`
    );
    return res.status(400).json({
      error:
        "API service identifier (apiService in body or X-API-Service header) is required.",
    });
  }

  try {
    let user = await User.findOne({ firebaseUID });

    if (!user) {
      console.warn(`rateLimiter: User not found for UID ${firebaseUID}`);
      return res.status(404).json({ error: "User not found" });
    }

    // Ensure apiUsage and limits structure exists
    if (
      !user.apiUsage ||
      !user.apiUsage.limits ||
      !user.apiUsage.limits[apiService]
    ) {
      console.error(
        `rateLimiter: Invalid or non-existent API service limit configuration for service "${apiService}" for user ${firebaseUID}. User config:`,
        user.apiUsage
      );
      // Decide how to handle: Maybe allow if structure is missing, or deny? Denying is safer.
      // You might need a migration script to ensure all users have the correct structure.
      return res.status(500).json({
        error: `Internal configuration error: Limit structure missing for service "${apiService}". Please contact support.`,
      });
    }

    // Check if it's time to reset limits
    const now = new Date();
    const lastReset = user.apiUsage.lastReset
      ? new Date(user.apiUsage.lastReset)
      : new Date(0); // Handle case where lastReset might be null/undefined initially
    const minutesSinceReset =
      (now.getTime() - lastReset.getTime()) / (1000 * 60);

    const isPremium = user.paymentStatus?.status === "active";
    let needsUpdate = false;
    const updateOps = {};

    if (minutesSinceReset >= 1440) {
      // Reset after 24 hours (1440 minutes)
      console.log(
        `rateLimiter: Resetting API limits for user ${firebaseUID} (Premium: ${isPremium})`
      );
      needsUpdate = true;
      updateOps["apiUsage.lastReset"] = now;

      Object.keys(user.apiUsage.limits).forEach((service) => {
        const serviceLimit = user.apiUsage.limits[service];
        // Check if daily/premium values exist before assigning
        const dailyLimit =
          typeof serviceLimit.daily === "number" ? serviceLimit.daily : 0;
        const premiumLimit =
          typeof serviceLimit.premium === "number" ? serviceLimit.premium : 0;
        updateOps[`apiUsage.limits.${service}.remaining`] = isPremium
          ? premiumLimit
          : dailyLimit;
      });

      // Apply the reset updates immediately to the user object for the current check
      user.apiUsage.lastReset = now;
      Object.keys(updateOps).forEach((key) => {
        if (key.startsWith("apiUsage.limits.")) {
          const parts = key.split(".");
          user.apiUsage.limits[parts[2]].remaining = updateOps[key];
        }
      });
      console.log(
        `rateLimiter: User ${firebaseUID} limits reset. Current state for ${apiService}: ${user.apiUsage.limits[apiService].remaining}`
      );
    }

    // Check current limit AFTER potential reset
    if (user.apiUsage.limits[apiService].remaining > 0) {
      console.log(
        `rateLimiter: User ${firebaseUID} has ${user.apiUsage.limits[apiService].remaining} uses remaining for ${apiService}. Allowing request.`
      );
      // Decrement the count
      const decrementKey = `apiUsage.limits.${apiService}.remaining`;
      if (!needsUpdate) {
        // If only decrementing, perform a separate update
        await User.updateOne(
          { _id: user._id },
          { $inc: { [decrementKey]: -1 } }
        );
      } else {
        // If already updating for reset, add the decrement to the update operations
        updateOps.$inc = { [decrementKey]: -1 };
      }

      // If reset occurred, perform the combined update
      if (needsUpdate) {
        await User.updateOne({ _id: user._id }, updateOps);
      }

      // Attach user object (potentially updated) to request for controllers
      req.user = await User.findOne({ firebaseUID }); // Re-fetch latest state after update

      next(); // Proceed to the next middleware/route handler
    } else {
      console.warn(
        `rateLimiter: API limit reached for user ${firebaseUID}, service ${apiService}`
      );
      const resetTime = new Date(lastReset.getTime() + 24 * 60 * 60 * 1000); // Calculate next reset time
      res.status(429).json({
        error: `API limit reached for ${apiService}.`,
        remainingRequests: 0,
        resetTime: resetTime.toISOString(), // Send ISO string for consistency
      });
    }
  } catch (error) {
    console.error(
      `rateLimiter: Error checking limits for user ${firebaseUID}, service ${apiService}:`,
      error
    );
    res
      .status(500)
      .json({ error: "Internal server error during rate limit check" });
  }
};
