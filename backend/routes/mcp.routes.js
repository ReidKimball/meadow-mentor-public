// MCP Routes
// This file will define the routes for the MCP API.

import express from 'express';
import { listDietsController } from '../controllers/mcp.controller.js'; 
import { validateListDiets } from '../middleware/mcp.validator.js'; 
import { listDietsLimiter, searchFoodsLimiter, getFoodByIdLimiter } from '../middleware/mcpRateLimit.js'; 

// Import for food search
import { searchFoodsController } from '../controllers/mcp.controller.js';
import { validateSearchFoods } from '../middleware/mcp.validator.js';

// Import for get food by ID
import { getFoodByIdController } from '../controllers/mcp.controller.js'; 
import { validateGetFoodById } from '../middleware/mcp.validator.js'; 

const router = express.Router();

/**
 * @route   GET /diets
 * @description Get a list of supported therapeutic diets.
 * @access  Public
 * @response 200 - An array of diet objects.
 * @response 400 - Invalid request parameters (if validation fails in future).
 * @response 500 - Internal server error.
 */
router.get(
  '/diets',
  listDietsLimiter, // Apply rate limiter for listing diets
  validateListDiets, // Apply validation middleware
  listDietsController // Apply controller logic
);

/**
 * @route   GET /foods/search
 * @description Search for food items based on query parameters (e.g., name, diet compatibility).
 * @access  Public
 * @query   q - Search query string (e.g., "chicken breast")
 * @query   diet - Diet code to filter by (e.g., "SCD")
 * @query   limit - Maximum number of results to return (defaults to mcpConfig.defaultSearchLimit)
 * @query   offset - Number of results to skip (for pagination)
 * @response 200 - An array of food objects matching the search criteria.
 * @response 400 - Invalid request parameters.
 * @response 500 - Internal server error.
 */
router.get(
  '/foods/search',
  searchFoodsLimiter, // Apply rate limiter for food search
  validateSearchFoods, // Apply validation middleware for food search
  searchFoodsController // Apply controller logic for food search
);

/**
 * @route   GET /foods/:id
 * @description Get a specific food item by its ID.
 * @access  Public
 * @param   id - The MongoDB ObjectId of the food item.
 * @response 200 - The food item object.
 * @response 400 - Invalid ID format.
 * @response 404 - Food item not found.
 * @response 500 - Internal server error.
 */
router.get(
  '/foods/:id',
  getFoodByIdLimiter,    // Apply rate limiter for getting food by ID
  validateGetFoodById,   // Apply validation middleware for the ID
  getFoodByIdController  // Apply controller logic for getting food by ID
);

// Future routes for food details, etc., will be added here.

// Catch-all for 404 Not Found errors within the MCP router
// This handles any /mcp/v1/ routes that haven't been matched above.
// Note: The global 404 handler in index.js might also catch this if not handled here,
// but having it here makes MCP routes more self-contained for 404s specific to its base path.
router.use((req, res, next) => {
  // Check if the request path starts with the MCP base path and no route was matched
  // This is a bit redundant if index.js already has a robust 404 handler for /mcp/
  // but can be useful if MCP routes are isolated.
  // For now, we rely on the global error handler in index.js to catch these
  // and this specific middleware might not be strictly necessary if the global one is effective.
  // However, if we want a specific MCP 404 message:
  const err = new Error('MCP Endpoint Not Found');
  err.statusCode = 404;
  err.errorCode = 'MCP_ENDPOINT_NOT_FOUND';
  err.publicMessage = `The requested MCP API endpoint (${req.originalUrl}) does not exist.`;
  next(err); // Pass to the global error handler which uses mcpConfig.createErrorResponse
});

export default router;