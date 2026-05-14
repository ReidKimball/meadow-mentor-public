/**
 * @file ipBlocking.middleware.js
 * @description Middleware and helpers for blocking IP addresses that repeatedly
 * send malicious input. Works together with Phase 1 validation logic.
 */

import IpBlacklist from "../models/ipBlacklist.model.js";
import {
  deleteFirebaseUser,
  deleteFirestoreCustomerData,
} from "../services/firebase.service.js";
import { deleteStripeCustomersByEmail } from "../services/stripe.service.js";

/**
 * Check if the incoming request IP is blacklisted.
 * If so, immediately return 403 and do not proceed further in the pipeline.
 *
 * @function checkIpBlacklist
 * @param {import("express").Request} req - Express request object.
 * @param {import("express").Response} res - Express response object.
 * @param {import("express").NextFunction} next - Express next function.
 * @returns {Promise<void>}
 */
export const checkIpBlacklist = async (req, res, next) => {
  const ipAddress = req.ip || req.connection?.remoteAddress || "unknown";

  try {
    const blacklisted = await IpBlacklist.findOne({
      ipAddress,
      $or: [{ permanent: true }, { expiresAt: { $gt: new Date() } }],
    });

    if (blacklisted) {
      console.warn(
        `🚫 (ipBlocking.middleware) Blocked request from blacklisted IP: ${ipAddress}`
      );

      // For blocked signup attempts, also attempt cleanup of any Firebase
      // artifacts that may have been created prior to backend validation.
      const isSignupRequest =
        req.method === "POST" && req.path === "/api/users";
      const uidFromBody = req.body?.firebaseUID;
      const emailFromBody = req.body?.email;

      if (isSignupRequest && uidFromBody) {
        (async () => {
          // Wait 2 seconds for Firebase/Stripe extension to finish creating
          // Stripe customer and Firestore doc before cleanup
          await new Promise((resolve) => setTimeout(resolve, 2000));

          try {
            await deleteFirestoreCustomerData(uidFromBody);
          } catch (cleanupError) {
            console.error(
              "❌ (ipBlocking.middleware) Error deleting Firestore customer data during IP block cleanup:",
              cleanupError
            );
          }

          try {
            await deleteFirebaseUser(uidFromBody);
          } catch (cleanupError) {
            console.error(
              "❌ (ipBlocking.middleware) Error deleting Firebase user during IP block cleanup:",
              cleanupError
            );
          }

          if (emailFromBody) {
            try {
              await deleteStripeCustomersByEmail(emailFromBody);
            } catch (cleanupError) {
              console.error(
                "❌ (ipBlocking.middleware) Error deleting Stripe customers during IP block cleanup:",
                cleanupError
              );
            }
          }
        })();
      }

      return res.status(403).json({
        error:
          "Access denied. Your IP has been blocked due to suspicious activity.",
      });
    }

    return next();
  } catch (error) {
    console.error(
      "❌ (ipBlocking.middleware) Error checking IP blacklist:",
      error
    );
    // Fail open on errors: do not block legitimate traffic due to DB issues.
    return next();
  }
};

/**
 * Record a malicious attempt and potentially promote the IP to a permanent block.
 *
 * This is called from the validation middleware when malicious patterns are
 * detected in user input.
 *
 * @function recordMaliciousAttempt
 * @param {string} ipAddress - IP address of the client.
 * @param {string[]} detectedPatterns - List of detected malicious patterns.
 * @returns {Promise<void>}
 */
export const recordMaliciousAttempt = async (ipAddress, detectedPatterns) => {
  try {
    let blacklistEntry = await IpBlacklist.findOne({ ipAddress });

    if (blacklistEntry) {
      blacklistEntry.attempts += 1;
      blacklistEntry.detectedPatterns = [
        ...new Set([
          ...(blacklistEntry.detectedPatterns || []),
          ...(detectedPatterns || []),
        ]),
      ];

      if (blacklistEntry.attempts >= 3) {
        blacklistEntry.permanent = true;
        blacklistEntry.reason = "REPEATED_ATTACKS";
        console.error(
          `🚨 (ipBlocking.middleware) IP ${ipAddress} permanently blocked after ${blacklistEntry.attempts} attempts`
        );
      } else {
        blacklistEntry.expiresAt = new Date(
          Date.now() + 24 * 60 * 60 * 1000
        );
        console.warn(
          `⚠️ (ipBlocking.middleware) IP ${ipAddress} attempt ${blacklistEntry.attempts}/3`
        );
      }

      await blacklistEntry.save();
    } else {
      blacklistEntry = new IpBlacklist({
        ipAddress,
        reason: "MALICIOUS_INPUT",
        attempts: 1,
        detectedPatterns,
      });

      await blacklistEntry.save();
      console.warn(
        `⚠️ (ipBlocking.middleware) IP ${ipAddress} added to blacklist (1st attempt)`
      );
    }
  } catch (error) {
    console.error(
      "❌ (ipBlocking.middleware) Error recording malicious attempt:",
      error
    );
    // Do not rethrow: logging failure should not break the main flow.
  }
};
