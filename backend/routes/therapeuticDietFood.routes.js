/**
 * @file therapeuticDietFood.routes.js
 * @description Defines the API routes for managing therapeutic diet food items.
 * This file uses Express Router to direct HTTP requests to the appropriate controller functions
 * for CRUD operations on the 'therapeutic-diet-foods' collection.
 * @version 1.0.0
 * @requires express - Express framework for building the router.
 * @requires ../controllers/therapeuticDietFood.controller.js - Controller functions for handling the business logic.
 * @requires ../middleware/authMiddleware.js - Authentication middleware for verifying Firebase token.
 * @requires ../middleware/verifyAdmin.js - Authorization middleware for verifying admin role.
 * @date 2025-05-22
 * @author Cascade
 */

import express from 'express'; // Express framework
import {
  createTherapeuticDietFood,
  getAllTherapeuticDietFoods,
  getTherapeuticDietFoodById,
  updateTherapeuticDietFood,
  deleteTherapeuticDietFood,
} from '../controllers/therapeuticDietFood.controller.js'; // Controller methods

// Import authentication and authorization middleware
import { verifyFirebaseToken } from '../middleware/authMiddleware.js'; 
import { verifyAdmin } from '../middleware/verifyAdmin.js';

const router = express.Router(); // Initialize Express router

//console.log('[therapeuticDietFood.routes.js] 🌐 therapeuticDietFood routes initialized for admin access');

// --- Therapeutic Diet Food Routes (Admin Only) --- 

/**
 * @route   POST /api/therapeutic-diet-foods
 * @description Create a new therapeutic diet food entry.
 * @access  Admin
 * @body    {string} diet_code - Code of the diet (e.g., "SCD").
 * @body    {string} food_name - Name of the food.
 * @body    {boolean} allowed - Is the food allowed on this diet?
 * @body    {string} [note] - Optional notes.
 * @body    {string} [source_file] - Optional source file.
 * @returns {object} 201 - The created therapeutic diet food item.
 * @returns {object} 400 - Validation error or bad request.
 * @returns {object} 409 - Conflict if item already exists.
 * @returns {object} 500 - Internal server error.
 */
router.post(
  '/', 
  createTherapeuticDietFood
);

/**
 * @route   GET /api/therapeutic-diet-foods
 * @description Get all therapeutic diet food entries, with optional filtering.
 * @access  Admin
 * @query   {string} [diet_code] - Filter by diet code.
 * @query   {string} [allowed] - Filter by allowed status ('true' or 'false').
 * @query   {string} [food_name] - Filter by food name (case-insensitive partial match).
 * @returns {object} 200 - An array of therapeutic diet food items.
 * @returns {object} 500 - Internal server error.
 */
router.get(
  '/', 
  getAllTherapeuticDietFoods
);

/**
 * @route   GET /api/therapeutic-diet-foods/:id
 * @description Get a specific therapeutic diet food entry by its ID.
 * @access  Admin
 * @param   {string} req.params.id - The MongoDB ID of the therapeutic diet food item.
 * @returns {object} 200 - The therapeutic diet food item.
 * @returns {object} 400 - Invalid ID format.
 * @returns {object} 404 - Therapeutic diet food item not found.
 * @returns {object} 500 - Internal server error.
 */
router.get(
  '/:id',
  getTherapeuticDietFoodById
);

/**
 * @route   PUT /api/therapeutic-diet-foods/:id
 * @description Update an existing therapeutic diet food entry by its ID.
 * @access  Admin
 * @param   {string} req.params.id - The MongoDB ID of the therapeutic diet food item to update.
 * @body    {string} [food_name] - New name of the food.
 * @body    {boolean} [allowed] - New allowed status.
 * @body    {string} [note] - New notes.
 * @body    {string} [source_file] - New source file.
 * @returns {object} 200 - The updated therapeutic diet food item.
 * @returns {object} 400 - Validation error or invalid ID format.
 * @returns {object} 404 - Therapeutic diet food item not found.
 * @returns {object} 409 - Conflict if update causes a duplicate.
 * @returns {object} 500 - Internal server error.
 */
router.put(
  '/:id',
  updateTherapeuticDietFood
);

/**
 * @route   DELETE /api/therapeutic-diet-foods/:id
 * @description Delete a therapeutic diet food entry by its ID.
 * @access  Admin
 * @param   {string} req.params.id - The MongoDB ID of the therapeutic diet food item to delete.
 * @returns {object} 200 - Success message and ID of deleted item.
 * @returns {object} 400 - Invalid ID format.
 * @returns {object} 404 - Therapeutic diet food item not found.
 * @returns {object} 500 - Internal server error.
 */
router.delete(
  '/:id',
  deleteTherapeuticDietFood
);

// Apply verifyFirebaseToken first, then verifyAdmin to all routes in this router
router.use(verifyFirebaseToken, verifyAdmin);

export default router;
