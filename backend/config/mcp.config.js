// MCP Configuration
// This file will hold MCP-specific configurations, like rate limits and response formats.

import crypto from 'crypto';

const mcpConfig = {
  // Rate Limiting Configuration (requests per minute)
  // These are default values; specific routes might override or use multipliers.
  rateLimits: {
    general: parseInt(process.env.MCP_RATE_LIMIT_GENERAL || '60', 10), // 60 requests per minute
    searchFoods: parseInt(process.env.MCP_RATE_LIMIT_SEARCH_FOODS || '60', 10), // 60 requests per minute
    foodDetails: parseInt(process.env.MCP_RATE_LIMIT_FOOD_DETAILS || '120', 10), // 120 requests per minute
    listDiets: parseInt(process.env.MCP_RATE_LIMIT_LIST_DIETS || '30', 10), // 30 requests per minute
    windowMs: 60 * 1000, // 1 minute in milliseconds
  },

  // Standard Success Response Structure
  // Helper function to create a success response
  createSuccessResponse: (data, requestId) => ({
    success: true,
    data: data || {},
    meta: {
      requestId: requestId || crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    },
  }),

  // Standard Error Response Structure
  // Helper function to create an error response
  createErrorResponse: (errorCode, message, details, requestId) => ({
    success: false,
    error: {
      code: errorCode || 'INTERNAL_SERVER_ERROR',
      message: message || 'An unexpected error occurred.',
      details: details || {},
    },
    meta: {
      requestId: requestId || crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    },
  }),

  // API Version
  apiVersion: process.env.MCP_API_VERSION || 'v1',

  // Environment Variables (examples, to be set in .env or cloud config)
  // process.env.MCP_REDIS_URL: 'redis://localhost:6379' (for rate limiting)
  // process.env.MCP_LOG_LEVEL: 'info' (for logging)
  // process.env.MCP_ENABLE_CACHE: 'true' (for response caching)

  // Default limit for search results
  defaultSearchLimit: parseInt(process.env.MCP_DEFAULT_SEARCH_LIMIT || '10', 10),
};

export default mcpConfig;