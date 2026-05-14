// MCP Rate Limiting Middleware
// This file configures rate limiting for the MCP API endpoints using express-rate-limit.
// By default, express-rate-limit uses an in-memory store.

import rateLimit from 'express-rate-limit';
import mcpConfig from '../config/mcp.config.js';

/**
 * @function createRateLimiter
 * @description A factory function to create a rate limiter instance with common configurations.
 * @param {number} maxRequests - The maximum number of requests allowed per windowMs.
 * @param {string} [messageCode='RATE_LIMIT_EXCEEDED'] - The error code for the response.
 * @param {string} [messageText='Too many requests, please try again later.'] - The error message text.
 * @returns {Function} An express-rate-limit middleware instance.
 */
const createRateLimiter = (maxRequests, messageCode = 'RATE_LIMIT_EXCEEDED', messageText = 'Too many requests, please try again later.') => {
  return rateLimit({
    windowMs: mcpConfig.rateLimits.windowMs, // Time window (e.g., 1 minute)
    max: maxRequests, // Max requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers (draft-6)
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    keyGenerator: (req) => {
      // Use IP address as the key for rate limiting.
      // Consider more sophisticated key generation if behind a proxy or for user-specific limits.
      return req.ip;
    },
    handler: (req, res, /*next, options*/) => {
      // Log the rate limit event if needed
      console.warn(`[mcpRateLimit.js] Rate limit exceeded for ${req.ip} on ${req.originalUrl}. Max: ${maxRequests} per ${mcpConfig.rateLimits.windowMs}ms`);
      res.status(429).json(mcpConfig.createErrorResponse(
        messageCode,
        messageText,
        null, // No specific details array for rate limit errors by default
        req.requestId
      ));
    },
  });
};

/**
 * @constant {Function} listDietsLimiter
 * @description Rate limiter for the GET /diets endpoint.
 *              Configured using `mcpConfig.rateLimits.listDiets`.
 */
export const listDietsLimiter = createRateLimiter(
  mcpConfig.rateLimits.listDiets,
  'LIST_DIETS_RATE_LIMIT_EXCEEDED',
  'Too many requests to list diets. Please try again later.'
);

/**
 * @constant {Function} searchFoodsLimiter
 * @description Rate limiter for the GET /foods/search endpoint.
 *              Configured using `mcpConfig.rateLimits.searchFoods`.
 */
export const searchFoodsLimiter = createRateLimiter(
  mcpConfig.rateLimits.searchFoods,
  'SEARCH_FOODS_RATE_LIMIT_EXCEEDED',
  'Too many requests to search for foods. Please try again later.'
);

/**
 * @constant {Function} getFoodByIdLimiter
 * @description Rate limiter for the GET /foods/:id endpoint.
 *              Configured using `mcpConfig.rateLimits.foodDetails` (assuming this covers single item lookups).
 */
export const getFoodByIdLimiter = createRateLimiter(
  mcpConfig.rateLimits.foodDetails, // Using foodDetails limit as it seems appropriate
  'GET_FOOD_BY_ID_RATE_LIMIT_EXCEEDED',
  'Too many requests for food details. Please try again later.'
);

/**
 * @constant {Function} foodDetailsLimiter
 * @description Rate limiter for the GET /foods/:foodId endpoint.
 *              Configured using `mcpConfig.rateLimits.foodDetails`.
 *              Note: This endpoint is not yet fully implemented.
 */
export const foodDetailsLimiter = createRateLimiter(
  mcpConfig.rateLimits.foodDetails,
  'FOOD_DETAILS_RATE_LIMIT_EXCEEDED',
  'Too many requests for food details. Please try again later.'
);

/**
 * @constant {Function} generalMcpLimiter
 * @description A general rate limiter for MCP endpoints that don't have a specific limiter.
 *              Configured using `mcpConfig.rateLimits.general`.
 */
export const generalMcpLimiter = createRateLimiter(
  mcpConfig.rateLimits.general,
  'GENERAL_MCP_RATE_LIMIT_EXCEEDED',
  'Too many general MCP requests. Please try again later.'
);

// If you had a global limiter for all MCP routes, it might look like this:
// export const globalMcpLimiter = createRateLimiter(mcpConfig.rateLimits.general);
