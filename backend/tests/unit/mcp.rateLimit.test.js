// Unit tests for MCP Rate Limiting Middleware

import request from 'supertest'; // For making HTTP requests to a test Express app
import express from 'express';
import { jest } from '@jest/globals'; // For mocking mcpConfig

// Import the limiters to be tested
import {
  listDietsLimiter,
  searchFoodsLimiter,
  foodDetailsLimiter,
  generalMcpLimiter,
} from '../../middleware/mcpRateLimit.js';

// Mock mcpConfig before importing mcpRateLimit
// We need to control the rate limit values for testing.
const mockMcpConfig = {
  rateLimits: {
    listDiets: 2,     // Allow 2 requests for listDiets for testing
    searchFoods: 3,   // Allow 3 requests for searchFoods
    foodDetails: 1,   // Allow 1 request for foodDetails
    general: 4,       // Allow 4 requests for general
    windowMs: 1000 * 5, // 5 seconds window for easier testing (shorter than production)
  },
  createErrorResponse: jest.fn((errorCode, message, details, requestId) => ({
    success: false,
    error: {
      code: errorCode,
      message: message,
      details: details || null,
    },
    meta: {
      requestId: requestId || 'test-req-id',
      timestamp: new Date().toISOString(),
    },
  })),
};
jest.unstable_mockModule('../../config/mcp.config.js', () => ({
  default: mockMcpConfig,
  __esModule: true, // if it's an ES module
}));

// Helper function to create a test Express app with a given limiter and endpoint
const createAppWithLimiter = (limiter, route = '/test') => {
  const app = express();
  // Add a mock requestId middleware for mcpConfig.createErrorResponse
  app.use((req, res, next) => {
    req.requestId = 'test-req-id-rate-limit';
    next();
  });
  app.get(route, limiter, (req, res) => res.status(200).send('OK'));
  return app;
};

describe('MCP Rate Limiting Middleware', () => {
  beforeEach(() => {
    // Reset the mock function calls before each test
    mockMcpConfig.createErrorResponse.mockClear();
    // It's important to clear any in-memory state of the rate limiters if possible.
    // express-rate-limit's MemoryStore doesn't have a public clear method accessible here easily.
    // Tests are structured to use different limiters or will rely on windowMs expiring for independent counts.
    // For more robust testing of state, a mockable store or a store with a clear method would be better.
  });

  // Test suite for a generic limiter configuration
  const testLimiter = async (limiterFactory, limit, errorCode, routePath = '/limit_test') => {
    const app = createAppWithLimiter(limiterFactory(), routePath);
    const agent = request.agent(app);

    // Make requests up to the limit - should succeed
    for (let i = 0; i < limit; i++) {
      const response = await agent.get(routePath);
      expect(response.statusCode).toBe(200);
      expect(response.text).toBe('OK');
      expect(response.headers['ratelimit-limit']).toBe(String(limit));
      expect(parseInt(response.headers['ratelimit-remaining'])).toBe(limit - (i + 1));
      expect(response.headers['ratelimit-reset']).toBeDefined();
    }

    // Make one more request - should be rate limited
    const limitedResponse = await agent.get(routePath);
    expect(limitedResponse.statusCode).toBe(429);
    expect(mockMcpConfig.createErrorResponse).toHaveBeenCalledWith(
      errorCode,
      expect.any(String), // The exact message text
      null,
      'test-req-id-rate-limit'
    );
    expect(limitedResponse.body).toEqual(mockMcpConfig.createErrorResponse.mock.results[0].value);
    expect(limitedResponse.headers['ratelimit-limit']).toBe(String(limit));
    expect(limitedResponse.headers['ratelimit-remaining']).toBe('0');
    // Retry-After header might be present, good to check if available
    // expect(limitedResponse.headers['retry-after']).toBeDefined();

    // Wait for the window to expire (windowMs is 5s in mockMcpConfig)
    // Add a small buffer to ensure the window has passed.
    await new Promise(resolve => setTimeout(resolve, mockMcpConfig.rateLimits.windowMs + 500));

    // Make another request - should succeed again as the window has reset
    const responseAfterReset = await agent.get(routePath);
    expect(responseAfterReset.statusCode).toBe(200);
    expect(responseAfterReset.text).toBe('OK');
    expect(parseInt(responseAfterReset.headers['ratelimit-remaining'])).toBe(limit - 1);
  };

  it('listDietsLimiter should enforce its specific limit', async () => {
    await testLimiter(() => listDietsLimiter, mockMcpConfig.rateLimits.listDiets, 'LIST_DIETS_RATE_LIMIT_EXCEEDED', '/diets');
  }, mockMcpConfig.rateLimits.windowMs * 2); // Increase Jest timeout for this test

  it('searchFoodsLimiter should enforce its specific limit', async () => {
    await testLimiter(() => searchFoodsLimiter, mockMcpConfig.rateLimits.searchFoods, 'SEARCH_FOODS_RATE_LIMIT_EXCEEDED', '/search');
  }, mockMcpConfig.rateLimits.windowMs * 2);

  it('foodDetailsLimiter should enforce its specific limit', async () => {
    await testLimiter(() => foodDetailsLimiter, mockMcpConfig.rateLimits.foodDetails, 'FOOD_DETAILS_RATE_LIMIT_EXCEEDED', '/details');
  }, mockMcpConfig.rateLimits.windowMs * 2);

  it('generalMcpLimiter should enforce its specific limit', async () => {
    await testLimiter(() => generalMcpLimiter, mockMcpConfig.rateLimits.general, 'GENERAL_MCP_RATE_LIMIT_EXCEEDED', '/general');
  }, mockMcpConfig.rateLimits.windowMs * 2);
});