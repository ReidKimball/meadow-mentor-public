/**
 * @file authMiddleware.js
 * @description Middleware for handling Firebase authentication.
 * @version 1.0.0
 * @date 2025-05-22
 * @author Cascade
 */

import admin from 'firebase-admin'; // For Firebase Admin SDK operations

/**
 * @function verifyFirebaseToken
 * @description Express middleware to verify Firebase ID tokens.
 * It extracts the Bearer token from the `Authorization` header,
 * verifies it using the Firebase Admin SDK, and attaches the decoded
 * user information (`uid`, `email`, etc.) to the `req.user` object.
 * Requests without a valid token are rejected with a 401 Unauthorized status.
 * 
 * @param {import('express').Request} req - The Express request object. Expects an `Authorization: Bearer <ID_TOKEN>` header.
 * @param {import('express').Response} res - The Express response object. Used to send 401 Unauthorized responses.
 * @param {import('express').NextFunction} next - The callback function to pass control to the next middleware.
 * @returns {void} - Calls `next()` if token is valid, or sends a response directly if not.
 * @async
 * @throws {object} 401 Unauthorized - If the Authorization header is missing/invalid, or the token is missing/invalid/expired.
 */
export const verifyFirebaseToken = async (req, res, next) => {

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn(
      "(authMiddleware.js - verifyFirebaseToken) ⚠️ Auth header missing or invalid format"
    );
    return res
      .status(401)
      .json({ message: "Unauthorized: Missing or invalid Authorization header." });
  }

  const idToken = authHeader.split("Bearer ")[1];

  if (!idToken) {
    console.warn("(authMiddleware.js - verifyFirebaseToken) ⚠️ Bearer token missing");
    return res.status(401).json({ message: "Unauthorized: Missing token." });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; // Attach decoded token to request object

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error(
      "(authMiddleware.js - verifyFirebaseToken) ❌ Error verifying Firebase ID token:",
      error.code,
      error.message
    );
    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({ message: "Unauthorized: Token expired." });
    }
    // Handle other Firebase auth errors (e.g., 'auth/invalid-id-token')
    return res.status(401).json({ message: "Unauthorized: Invalid token." });
  }
};
