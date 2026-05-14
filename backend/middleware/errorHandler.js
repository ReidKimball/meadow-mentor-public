// Global Error Handling Middleware
// This middleware is responsible for catching all errors that occur in the application
// and sending a standardized JSON response to the client.

import mcpConfig from '../config/mcp.config.js';

/**
 * @function errorHandler
 * @description Express error handling middleware.
 *              This function should be the last middleware added to the Express app.
 * @param {Error} err - The error object.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {Function} next - The Express next middleware function (unused in the final error handler but required by Express).
 * @returns {void} Sends a JSON error response.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Log the error internally (e.g., to console, or a logging service like Sentry)
  // Basic logging for now, can be expanded.
  console.error(`[errorHandler.js] An error occurred for requestId: ${req.requestId || 'N/A'}`);
  console.error(`[errorHandler.js] Error Message: ${err.message}`);
  console.error(`[errorHandler.js] Error Stack: ${err.stack}`);
  if (err.details) {
    console.error(`[errorHandler.js] Error Details:`, err.details);
  }

  // Determine status code
  // If the error object has a statusCode property, use it; otherwise, default to 500.
  const statusCode = err.statusCode || 500;

  // Determine error code and message for the response
  // If the error object has a custom errorCode and message, use them.
  // Otherwise, for a 500 error, use a generic server error message.
  const errorCode = err.errorCode || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'UNKNOWN_ERROR');
  const message = err.publicMessage || err.message || (statusCode === 500 ? 'An unexpected internal server error occurred.' : 'An unknown error occurred.');
  const errorDetails = err.errorDetails || (err.details ? { originalError: err.details } : {}); // Avoid exposing too much internal detail

  // Use mcpConfig to create a standardized error response
  const errorResponse = mcpConfig.createErrorResponse(
    errorCode,
    message,
    errorDetails,
    req.requestId
  );

  res.status(statusCode).json(errorResponse);
};

export default errorHandler;
