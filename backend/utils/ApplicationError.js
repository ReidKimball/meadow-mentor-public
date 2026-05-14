// backend/utils/ApplicationError.js

/**
 * @file ApplicationError.js
 * @description Defines a base custom error class for the application.
 * @module utils/ApplicationError
 * @version 1.0.0
 * @date 2025-05-30
 * @author Cascade
 */

/**
 * @class ApplicationError
 * @extends Error
 * @description Base class for custom application errors.
 *              Allows for consistent error handling by providing standard properties
 *              like statusCode, errorCode, publicMessage, and errorDetails.
 *              These properties can be used by a centralized error handler middleware.
 */
class ApplicationError extends Error {
  /**
   * Creates an instance of ApplicationError.
   * @param {string} message - The internal error message (primarily for logging).
   * @param {number} [statusCode=500] - The HTTP status code associated with this error.
   * @param {string} [errorCode='INTERNAL_SERVER_ERROR'] - A specific error code string for this type of error.
   * @param {string} [publicMessage=null] - A user-friendly message. If null, the internal message might be used or a generic one.
   * @param {object} [errorDetails=null] - Additional details about the error (e.g., validation failures).
   */
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_SERVER_ERROR', publicMessage = null, errorDetails = null) {
    super(message); // Call the parent Error class constructor

    this.name = this.constructor.name; // Set the error name to the class name
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.publicMessage = publicMessage || message; // Default public message to internal message if not provided
    this.errorDetails = errorDetails;

    // Capturing the stack trace, excluding the constructor call from it.
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApplicationError;
