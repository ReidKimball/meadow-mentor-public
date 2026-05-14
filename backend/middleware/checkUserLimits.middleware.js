/*
THIS IS THE FILE TO USE FOR USER LIMITS
*/

import User from "../models/user.model.js"; // Import the User model

// API RATE LIMITING MIDDLEWARE
export const checkUserLimits = async (req, res, next) => {
  const firebaseUID = req.user?.uid; // Populated by verifyFirebaseToken

  // Determine the API service key from the request.
  const apiServiceKey = req.body.apiService;

  if (!apiServiceKey) {
    console.warn(
      "[checkUserLimits MW] API service key not found in request body."
    );
    return res.status(400).json({ error: "API service type not specified." });
  }

  console.log(
    `[checkUserLimits MW] Checking limits for user: ${firebaseUID}, service: ${apiServiceKey}`
  );

  if (!firebaseUID) {
    console.error(
      "[checkUserLimits MW] req.user.uid not found. verifyFirebaseToken might have failed."
    );
    return res
      .status(401)
      .json({ error: "User not authenticated (middleware issue)." });
  }

  try {
    let user = await User.findOne({ firebaseUID });
    if (!user) {
      console.error(
        `[checkUserLimits MW] User not found in DB for UID: ${firebaseUID}`
      );
      return res.status(404).json({ error: "User profile not found." });
    }

    // Check if limits need reset (per-service reset tracking)
    const now = new Date();
    const isPremium = user.paymentStatus?.status === "active" && (user.paymentStatus?.plan === "premium" || user.paymentStatus?.plan === "early adopter");
    
    // --- Check the specific service limit ---
    const serviceLimitInfo = user.apiUsage?.limits?.[apiServiceKey];

    if (!serviceLimitInfo) {
      console.error(
        `[checkUserLimits MW] API service key "${apiServiceKey}" not found in user limits structure for ${firebaseUID}.`
      );
      return res
        .status(400)
        .json({
          error: `Service '${apiServiceKey}' limit configuration missing for user.`,
        });
    }

    // Check if this specific service needs reset
    const lastReset = serviceLimitInfo.lastReset
      ? new Date(serviceLimitInfo.lastReset)
      : new Date(0);
    const resetPeriod = serviceLimitInfo.resetPeriod || 'daily';
    
    let shouldReset = false;
    if (resetPeriod === 'monthly') {
      // Monthly reset: Check if 30 days have passed
      const daysSinceReset = (now - lastReset) / (1000 * 60 * 60 * 24);
      shouldReset = daysSinceReset >= 30;
      console.log(
        `[checkUserLimits MW] Service ${apiServiceKey} uses monthly reset. Days since reset: ${daysSinceReset.toFixed(2)}`
      );
    } else {
      // Daily reset: Check if 24 hours have passed
      const hoursSinceReset = (now - lastReset) / (1000 * 60 * 60);
      shouldReset = hoursSinceReset >= 24;
      console.log(
        `[checkUserLimits MW] Service ${apiServiceKey} uses daily reset. Hours since reset: ${hoursSinceReset.toFixed(2)}`
      );
    }

    // Apply reset if needed
    if (shouldReset) {
      console.log(
        `[checkUserLimits MW] Resetting ${apiServiceKey} limits for user ${firebaseUID} - ${resetPeriod} period passed.`
      );
      
      const updateFields = {};
      updateFields[`apiUsage.limits.${apiServiceKey}.remaining`] = isPremium
        ? serviceLimitInfo.premium
        : serviceLimitInfo.daily;
      updateFields[`apiUsage.limits.${apiServiceKey}.lastReset`] = now;

      user = await User.findByIdAndUpdate(
        user._id,
        { $set: updateFields },
        { new: true }
      );
      
      if (!user) {
        console.error(
          `[checkUserLimits MW] Failed to update ${apiServiceKey} limits after reset for UID: ${firebaseUID}`
        );
        return res.status(500).json({ error: "Failed to reset user limits." });
      }
      console.log(
        `[checkUserLimits MW] ${apiServiceKey} limits reset successfully for ${firebaseUID}.`
      );
    }

    // Re-fetch service limit info after potential reset
    const currentServiceLimitInfo = user.apiUsage?.limits?.[apiServiceKey];

    if (currentServiceLimitInfo.remaining > 0) {
      // Decrement count atomically
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { $inc: { [`apiUsage.limits.${apiServiceKey}.remaining`]: -1 } },
        { new: true }
      );

      if (!updatedUser) {
        console.error(
          `[checkUserLimits MW] Failed to decrement usage limit for ${apiServiceKey}, user ${firebaseUID}`
        );
        return res
          .status(500)
          .json({ error: "Failed to update usage limits." });
      }

      // Attach updated limits to request for potential use in the controller/response
      req.apiLimits = {
        remaining: updatedUser.apiUsage.limits[apiServiceKey].remaining,
        lastReset: updatedUser.apiUsage.lastReset,
      };
      console.log(
        `[checkUserLimits MW] Limit checked for ${apiServiceKey}. Remaining: ${req.apiLimits.remaining}`
      );
      next(); // Proceed to the actual route handler
    } else {
      // Limit reached
      console.log(
        `[checkUserLimits MW] API limit reached for ${apiServiceKey}, user ${firebaseUID}. Remaining: 0`
      );
      req.apiLimits = { remaining: 0, lastReset: user.apiUsage.lastReset }; // Attach current state
      res.status(429).json({
        // 429 Too Many Requests
        message: `API limit reached for ${apiServiceKey}. Please try again later or upgrade your plan.`,
        error: `API limit reached for ${apiServiceKey}`,
        remainingRequests: 0,
        resetTime: user.apiUsage.lastReset,
      });
    }
  } catch (dbError) {
    console.error(
      `[checkUserLimits MW] Database error for user ${firebaseUID}:`,
      dbError
    );
    res.status(500).json({ error: "Server error checking usage limits." });
  }
};
