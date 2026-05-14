/**
 * @file socketAuthMiddleware.js
 * @description Middleware for authenticating Socket.IO connections using Firebase Admin.
 */

import admin from 'firebase-admin';

/**
 * Verifies the Firebase ID token received from a Socket.IO connection.
 * This acts as a middleware for socket events.
 * @param {object} socket - The Socket.IO socket object.
 * @param {function} next - The callback to proceed to the next middleware or event handler.
 */
export const verifyFirebaseTokenSocket = async (socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    console.error('Socket Auth Error: No token provided.');
    return next(new Error('Authentication error: No token provided.'));
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    socket.user = decodedToken; // Attach user info to the socket object
    console.log(`Socket authenticated for user: ${decodedToken.uid}`);
    next();
  } catch (error) {
    console.error('Socket Auth Error: Invalid token.', error);
    next(new Error('Authentication error: Invalid token.'));
  }
};
