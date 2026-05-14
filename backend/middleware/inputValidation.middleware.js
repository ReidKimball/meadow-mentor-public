/**
 * @file inputValidation.middleware.js
 * @description Request validation and normalization middleware for user-related
 * operations (e.g., registration, profile updates).
 *
 * - Detects and REJECTS malicious input (URLs, HTML, scripts, etc.).
 * - Records malicious attempts for IP blocking.
 * - Normalizes benign input (names, emails) after validation.
 */

import {
  userRegistrationSchema,
  userUpdateSchema,
} from "../validators/user.validator.js";
import {
  sanitizeName,
  sanitizeEmail,
  detectMaliciousPatterns,
} from "../utils/sanitization.utils.js";
import { recordMaliciousAttempt } from "./ipBlocking.middleware.js";
import {
  deleteFirebaseUser,
  deleteFirestoreCustomerData,
} from "../services/firebase.service.js";
import { deleteStripeCustomersByEmail } from "../services/stripe.service.js";

/**
 * Factory that creates a validation middleware for a given schema.
 *
 * @function createValidator
 * @param {Record<string, any>} schema - Schema definition from user.validator.js.
 * @returns {import("express").RequestHandler} Express middleware.
 */
export const createValidator = (schema) => {
  return async (req, res, next) => {
    const errors = {};
    const data = req.body || {};
    const ipAddress = req.ip || req.connection?.remoteAddress || "unknown";

    let hasMaliciousInput = false;
    const allDetectedPatterns = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];

      if (rules.required && (value === undefined || value === null || value === "")) {
        errors[field] = [`${field} is required`];
        continue;
      }

      if (!rules.required && (value === undefined || value === null || value === "")) {
        continue;
      }

      if (rules.type && typeof value !== rules.type) {
        errors[field] = [`${field} must be of type ${rules.type}`];
        continue;
      }

      if (rules.minLength && typeof value === "string" && value.length < rules.minLength) {
        errors[field] = errors[field] || [];
        errors[field].push(
          `${field} must be at least ${rules.minLength} characters`
        );
      }
      if (rules.maxLength && typeof value === "string" && value.length > rules.maxLength) {
        errors[field] = errors[field] || [];
        errors[field].push(
          `${field} must not exceed ${rules.maxLength} characters`
        );
      }

      // Detect malicious patterns in name fields BEFORE custom validation.
      if (
        typeof value === "string" &&
        (field === "firstName" || field === "lastName")
      ) {
        const patterns = detectMaliciousPatterns(value);
        if (patterns.length > 0) {
          hasMaliciousInput = true;
          allDetectedPatterns.push(...patterns);
          console.warn(
            `🚨 (inputValidation.middleware) Malicious patterns detected in ${field}:`,
            patterns
          );
        }
      }

      if (rules.validator) {
        const validationErrors = rules.validator(value);
        if (validationErrors.length > 0) {
          errors[field] = validationErrors;
        }
      }
    }

    // If malicious input was detected, record attempt, trigger cleanup, and reject.
    if (hasMaliciousInput) {
      console.error(
        `🚨 (inputValidation.middleware) REJECTING malicious input from IP ${ipAddress}`
      );

      // Fire-and-forget logging of malicious attempt.
      recordMaliciousAttempt(ipAddress, allDetectedPatterns).catch((err) => {
        console.error(
          "❌ (inputValidation.middleware) Error recording malicious attempt:",
          err
        );
      });

      // For the signup flow (POST /api/users), also clean up any Firebase
      // artifacts that may have been created prior to validation, such as the
      // Firebase Auth user and Firestore customer mapping created by
      // Firebase/Stripe extensions.
      const isSignupRequest =
        req.method === "POST" && req.path === "/api/users";

      if (isSignupRequest) {
        const uidFromBody = data.firebaseUID;
        const uidFromAuth = req.user?.uid;
        const uid = uidFromBody || uidFromAuth;
        const email = data.email;

        if (uid) {
          (async () => {
            // Wait 2 seconds for Firebase/Stripe extension to finish creating
            // Stripe customer and Firestore doc before cleanup
            await new Promise((resolve) => setTimeout(resolve, 2000));

            try {
              await deleteFirestoreCustomerData(uid);
            } catch (cleanupError) {
              console.error(
                "❌ (inputValidation.middleware) Error deleting Firestore customer data during malicious signup cleanup:",
                cleanupError
              );
            }

            try {
              await deleteFirebaseUser(uid);
            } catch (cleanupError) {
              console.error(
                "❌ (inputValidation.middleware) Error deleting Firebase user during malicious signup cleanup:",
                cleanupError
              );
            }

            if (email) {
              try {
                await deleteStripeCustomersByEmail(email);
              } catch (cleanupError) {
                console.error(
                  "❌ (inputValidation.middleware) Error deleting Stripe customers during malicious signup cleanup:",
                  cleanupError
                );
              }
            }
          })();
        }
      }

      return res.status(400).json({
        error: "Unable to process your request. Please check your information and try again.",
      });
    }

    if (Object.keys(errors).length > 0) {
      console.warn(
        "⚠️ (inputValidation.middleware) Validation failed:",
        errors
      );
      return res.status(400).json({
        error: "Validation failed",
        details: errors,
      });
    }

    return next();
  };
};

/**
 * Middleware that validates user registration requests.
 */
export const validateUserRegistration = createValidator(userRegistrationSchema);

/**
 * Middleware that validates user update requests.
 */
export const validateUserUpdate = createValidator(userUpdateSchema);

/**
 * Normalize user input (names, email) for benign data.
 * Should run AFTER validation.
 *
 * @function normalizeUserInput
 * @param {import("express").Request} req - Express request.
 * @param {import("express").Response} res - Express response.
 * @param {import("express").NextFunction} next - Next middleware.
 * @returns {void}
 */
export const normalizeUserInput = (req, res, next) => {
  const data = req.body || {};

  if (data.firstName) {
    data.firstName = sanitizeName(data.firstName);
  }

  if (data.lastName) {
    data.lastName = sanitizeName(data.lastName);
  }

  if (data.email) {
    data.email = sanitizeEmail(data.email);
  }

  console.log("✅ (inputValidation.middleware) Input normalized");
  return next();
};
