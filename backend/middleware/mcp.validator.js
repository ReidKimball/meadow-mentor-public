// MCP Validator
// This file will contain request validation logic for MCP API endpoints.

// import { body, query, param, validationResult } from 'express-validator'; // To be used as needed
// import mcpConfig from '../config/mcp.config.js'; // To be used as needed

import { query, param, validationResult } from 'express-validator';
import mcpConfig from '../config/mcp.config.js';
import ApplicationError from '../utils/ApplicationError.js';

/**
 * @function validateListDiets
 * @description Validation middleware for the GET /diets endpoint.
 * Currently, this endpoint does not accept any specific query parameters that need validation.
 * This function serves as a placeholder and can be expanded if parameters are added.
 * It ensures the request proceeds to the next middleware/controller.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
export const validateListDiets = (req, res, next) => {
    // No specific validation needed for GET /diets at this time as it takes no parameters.
    // If query parameters for filtering, pagination, etc., are added in the future,
    // validation rules (e.g., using express-validator) would go here.
    // For example:
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //   return res.status(400).json(mcpConfig.createErrorResponse('VALIDATION_ERROR', 'Invalid request parameters', errors.array()));
    // }
    console.log('[mcp.validator.js] validateListDiets called - no validation rules currently.');
    next(); // Proceed to the next middleware or controller
  };

// Future validators for other MCP endpoints (e.g., food search, food details) will be added here.

// A helper array of known diet codes. In a more dynamic system, this might come from the database or config.
// For now, mirroring the hardcoded list for consistency.
const VALID_DIET_CODES = [
  "SCD", "GAPS", "PALEO AIP", "GLUTEN FREE", "DAIRY FREE", "NUT FREE", "MEDITERRANEAN", "KETO"
];

/**
 * @constant {Array<Function>} validateSearchFoods
 * @description Validation middleware chain for the GET /foods/search endpoint.
 *              Uses express-validator to validate query parameters: 'q', 'diet', 'limit', 'offset'.
 *              - 'q': Optional. Search query string.
 *              - 'diet': Optional. Diet code to filter by. Must be one of VALID_DIET_CODES (case-insensitive).
 *              - 'limit': Optional. Integer, min 1. Defaults to mcpConfig.defaultSearchLimit.
 *              - 'offset': Optional. Integer, min 0. Defaults to 0.
 *              If validation fails, sends a 400 response using mcpConfig.createErrorResponse
 *              via the ApplicationError class passed to the global error handler.
 */
export const validateSearchFoods = [
  query('q')
    .optional() // 'q' can be absent
    .custom((value, { req }) => {
      // If q is not provided (undefined from .optional()), pass validation.
      if (value === undefined) return true;

      const items = Array.isArray(value) ? value : [value]; // Normalize to array

      // Limit the number of q parameters (TASK-BE-MCP-ENHSEARCH-003)
      if (items.length > 20) {
        throw new Error('Cannot process more than 20 search queries (q) at a time.');
      }

      const validatedItems = [];
      for (const item of items) {
        if (typeof item !== 'string') {
          throw new Error('Search query (q) values must be strings.');
        }
        const trimmedItem = item.trim();
        // Validate length: not empty and not exceeding max length (TASK-BE-MCP-ENHSEARCH-001 & 002)
        if (trimmedItem.length === 0 || trimmedItem.length > 100) {
          throw new Error('Each search query (q) must be between 1 and 100 characters after trimming.');
        }
        validatedItems.push(trimmedItem);
      }
      
      // Update req.query.q to be the array of validated, trimmed strings.
      // This ensures the controller consistently receives an array (TASK-BE-MCP-ENHSEARCH-002 requirement for controller).
      req.query.q = validatedItems;
      return true;
    }),

  query('diet')
    .optional()
    .isString().withMessage('Diet code (diet) must be a string.')
    .trim()
    .toUpperCase()
    .custom((value) => {
      if (!VALID_DIET_CODES.includes(value)) {
        throw new Error(`Invalid diet code. Must be one of: ${VALID_DIET_CODES.join(', ')}`);
      }
      return true;
    }),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be an integer between 1 and 100.') // Max 100 as a sensible upper bound for now
    .toInt()
    .default(mcpConfig.defaultSearchLimit),

  query('offset')
    .optional()
    .isInt({ min: 0 }).withMessage('Offset must be a non-negative integer.')
    .toInt()
    .default(0),

  // Middleware function to handle the result of the validations
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn('[mcp.validator.js] Validation errors in validateSearchFoods:', errors.array());
      // Create a structured details object for the error
      const errorDetails = errors.array().map(err => ({
        field: err.param || err.path, // err.param for older express-validator, err.path for newer
        message: err.msg,
        value: err.value,
        location: err.location,
      }));

      const validationError = new ApplicationError(
        'Validation failed for food search parameters.', // Internal message
        400, // HTTP status code
        'INVALID_PARAMETERS', // Custom error code
        'One or more query parameters are invalid. Please check the details and try again.', // Public message
        { validationErrors: errorDetails } // Detailed validation errors
      );
      return next(validationError); // Pass to global error handler
    }

    // Explicitly ensure offset has a default value if not provided or cleared by validation
    if (typeof req.query.offset === 'undefined') {
      req.query.offset = 0;
    }
    // Ensure limit also has its default if it somehow became undefined (though .default() should handle this)
    if (typeof req.query.limit === 'undefined') {
      req.query.limit = mcpConfig.defaultSearchLimit;
    }

    console.log('[mcp.validator.js] validateSearchFoods passed. Validated query:', req.query);
    next();
  }
];

/**
 * @constant {Array<Function>} validateGetFoodById
 * @description Validation middleware chain for the GET /foods/:id endpoint.
 *              Uses express-validator to validate the 'id' path parameter.
 *              - 'id': Required. Must be a valid MongoDB ObjectId.
 *              If validation fails, sends a 400 response using mcpConfig.createErrorResponse
 *              via the ApplicationError class passed to the global error handler.
 */
export const validateGetFoodById = [
  param('id')
    .isMongoId().withMessage('Food ID must be a valid MongoDB ObjectId.'),

  // Middleware function to handle the result of the validations
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn('[mcp.validator.js] Validation errors in validateGetFoodById:', errors.array());
      const errorDetails = errors.array().map(err => ({
        field: err.param || err.path, // err.param for older express-validator, err.path for newer
        message: err.msg,
        value: err.value,
        location: err.location,
      }));

      const validationError = new ApplicationError(
        'Validation failed for Get Food By ID parameters.', // Internal message
        400, // HTTP status code
        'INVALID_PARAMETERS', // Custom error code
        'The provided Food ID is invalid. Please check the ID and try again.', // Public message
        { validationErrors: errorDetails } // Detailed validation errors
      );
      return next(validationError); // Pass to global error handler
    }
    console.log('[mcp.validator.js] validateGetFoodById passed. Validated params:', req.params);
    next();
  }
];