// MCP Controller
// This file will contain the controller functions for handling MCP API requests.

import mcpConfig from '../config/mcp.config.js';
import * as mcpService from '../services/mcpService.js'; // To be uncommented later
import ApplicationError from '../utils/ApplicationError.js'; // Import ApplicationError

/**
 * @async
 * @function listDietsController
 * @description Controller for the GET /diets endpoint.
 *              Retrieves and returns a list of supported therapeutic diets.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
export const listDietsController = async (req, res, next) => {
  console.log('[mcp.controller.js] listDietsController invoked.');
  try {
    // Call the service function to get the list of diets
    const diets = await mcpService.getAvailableDiets();

    // Use the success response helper from mcpConfig
    // req.requestId might be set by an earlier middleware (e.g., request logger or trace id generator)
    // If not, mcpConfig.createSuccessResponse will generate one.
    res.status(200).json(mcpConfig.createSuccessResponse(diets, req.requestId));

  } catch (error) {
    console.error('[mcp.controller.js] Error in listDietsController:', error);
    // Pass error to the centralized error handler (to be implemented later)
    // The error handler should use mcpConfig.createErrorResponse
    next(error);
  }
};

/**
 * @async
 * @function searchFoodsController
 * @description Controller for the GET /foods/search endpoint.
 *              Retrieves and returns a list of food items based on search criteria.
 *              The validated query parameters (q, diet, limit, offset) are available in req.query.
 * @param {object} req - Express request object, with req.query containing validated search parameters.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
export const searchFoodsController = async (req, res, next) => {
  console.log('[mcp.controller.js] searchFoodsController invoked with query:', req.query);
  try {
    // q from req.query is already an array of strings if provided, or undefined otherwise, due to validator.
    // diet, limit, offset are also validated and have defaults.
    const { diet, limit, offset } = req.query;
    const foodNameQueries = req.query.q || []; // If q is undefined, use an empty array.

    // Pass foodNameQueries (which is an array) as the 'q' parameter to the service.
    // The service (mcpService.searchFoodItems) will be updated to expect 'q' as an array.
    const searchResults = await mcpService.searchFoodItems({ q: foodNameQueries, diet, limit, offset });

    // Use the success response helper from mcpConfig
    res.status(200).json(mcpConfig.createSuccessResponse(searchResults, req.requestId));

  } catch (error) {
    console.error('[mcp.controller.js] Error in searchFoodsController:', error);
    // Pass error to the centralized error handler
    next(error);
  }
};

/**
 * @async
 * @function getFoodByIdController
 * @description Controller for the GET /foods/:id endpoint.
 *              Retrieves and returns a specific food item by its ID.
 * @param {object} req - Express request object, with req.params.id containing the validated food ID.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
export const getFoodByIdController = async (req, res, next) => {
  console.log('[mcp.controller.js] getFoodByIdController invoked with ID:', req.params.id);
  try {
    const { id } = req.params; // Destructure validated food ID

    const foodItem = await mcpService.getFoodItemById(id);

    if (!foodItem) {
      // If foodItem is null, it means it wasn't found by the service.
      // Create an ApplicationError and pass it to the global error handler.
      const notFoundError = new ApplicationError(
        `Food item with ID ${id} not found.`, // Internal message
        404, // HTTP status code
        'RESOURCE_NOT_FOUND', // Custom error code
        `The food item with the specified ID (${id}) was not found.`, // Public message
        { id: id } // Additional details
      );
      return next(notFoundError);
    }

    // Use the success response helper from mcpConfig
    res.status(200).json(mcpConfig.createSuccessResponse(foodItem, req.requestId));

  } catch (error) {
    console.error('[mcp.controller.js] Error in getFoodByIdController:', error);
    // Pass any other errors (e.g., from the service layer if it's not a 'not found' case)
    // to the centralized error handler.
    next(error);
  }
};

// Future controllers for other MCP endpoints (e.g., food search, food details) will be added here.