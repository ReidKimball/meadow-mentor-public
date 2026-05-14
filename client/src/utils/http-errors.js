// client/src/utils/http-errors.js

/**
 * @class HttpError
 * @extends Error
 * @description Custom error class for handling HTTP errors from API calls.
 */
export class HttpError extends Error {
  /**
   * @param {string} message - The error message.
   * @param {number} status - The HTTP status code from the response.
   * @param {object} body - The JSON response body from the server.
   */
  constructor(message, status, body) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.body = body;
  }
}
