/**
 * @file therapeuticDietFood.controller.js
 * @description Controller for managing CRUD operations for Therapeutic Diet Food items.
 * This controller handles the business logic for creating, retrieving, updating, and deleting
 * food items associated with specific therapeutic diets in the MongoDB database.
 * It uses the TherapeuticDietFood model for database interactions.
 * @version 1.0.0
 * @requires ../models/therapeuticDietFood.model.js - The Mongoose model for TherapeuticDietFood.
 * @requires ../utils/errorHandler.js - Utility for handling errors (assuming this exists or will be created).
 * @date 2025-05-22
 * @author Cascade
 */

import TherapeuticDietFood from "../models/therapeuticDietFood.model.js";
// import { errorHandler } from '../utils/errorHandler.js'; // Assuming a utility for consistent error responses

// Helper function to normalize food names (consistent with model's lowercase: true for normalized_food_name)
const normalizeFoodName = (name) => name.trim().toLowerCase();

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * @function createTherapeuticDietFood
 * @description Creates a new therapeutic diet food entry.
 * @async
 * @param {object} req - The Express request object.
 * @param {object} req.body - The body of the request, expected to contain diet_code, food_name, allowed, and optionally note and source_file.
 * @param {string} req.body.diet_code - The code for the therapeutic diet (e.g., "SCD", "GAPS").
 * @param {string} req.body.food_name - The name of the food item.
 * @param {boolean} req.body.allowed - Whether the food is allowed on the diet.
 * @param {string} [req.body.note] - Optional notes about the food item.
 * @param {string} [req.body.source_file] - Optional source file where this information originated.
 * @param {object} res - The Express response object.
 * @returns {Promise<void>} Sends a JSON response with the created food item or an error message.
 * @throws {Error} If there's an issue with database operation or input validation (implicitly via Mongoose).
 */
export const createTherapeuticDietFood = async (req, res) => {
  console.log("[therapeuticDietFood.controller.js] 🚀 Attempting to create therapeutic diet food:", req.body);
  try {
    const { diet_code, food_name, allowed, note, source_file } = req.body;

    if (!diet_code || !food_name || typeof allowed !== 'boolean') {
      console.warn("[therapeuticDietFood.controller.js] ⚠️ Validation Error: Missing required fields.");
      return res.status(400).json({ 
        success: false, 
        message: "Validation Error: diet_code, food_name, and allowed (as boolean) are required."
      });
    }

    const normalized_food_name = normalizeFoodName(food_name);

    const newFood = new TherapeuticDietFood({
      diet_code,
      food_name,
      normalized_food_name,
      allowed,
      note,
      source_file,
    });

    const savedFood = await newFood.save();
    console.log("[therapeuticDietFood.controller.js] ✅ Therapeutic diet food created successfully:", savedFood._id);
    res.status(201).json({
      success: true,
      message: "Therapeutic diet food created successfully.",
      data: savedFood,
    });
  } catch (error) {
    console.error("[therapeuticDietFood.controller.js] ❌ Error creating therapeutic diet food:", error);
    if (error.code === 11000) { // Duplicate key error
      return res.status(409).json({
        success: false,
        message: `Conflict: A food item with the name '${req.body.food_name}' already exists for the diet '${req.body.diet_code}'.`,
        error: error.message,
      });
    }
    // Generic error for other cases, consider using an errorHandler utility
    res.status(500).json({ 
      success: false, 
      message: "Error creating therapeutic diet food.", 
      error: error.message 
    });
  }
};

/**
 * @function getAllTherapeuticDietFoods
 * @description Retrieves all therapeutic diet food entries, with optional filtering.
 * @async
 * @param {object} req - The Express request object.
 * @param {object} req.query - The query parameters for filtering.
 * @param {string} [req.query.diet_code] - Filter by diet code.
 * @param {string} [req.query.allowed] - Filter by allowed status ('true' or 'false').
 * @param {string} [req.query.food_name] - Filter by food name (case-insensitive partial match).
 * @param {object} res - The Express response object.
 * @returns {Promise<void>} Sends a JSON response with the list of food items or an error message.
 */
export const getAllTherapeuticDietFoods = async (req, res) => {
  console.log("[therapeuticDietFood.controller.js] 🚀 Fetching all therapeutic diet foods with query:", req.query);
  try {
    const query = {};
    
    // Only add diet_code to query if it's provided and not requesting all foods
    if (req.query.diet_code && !req.query.include_all) {
      query.diet_code = req.query.diet_code;
    }
    
    if (req.query.allowed) {
      query.allowed = req.query.allowed === 'true'; // Convert string 'true'/'false' to boolean
    }
    
    if (req.query.food_name) {
      const rawTerm = req.query.food_name.trim();
      const normalizedTerm = normalizeFoodName(rawTerm);

      if (normalizedTerm.length < 3) {
        // For very short terms, use a prefix-anchored regex that can leverage the existing index
        // on normalized_food_name. Avoid case-insensitive matching to keep it index-friendly.
        query.$or = [
          { food_name: { $regex: escapeRegex(rawTerm), $options: 'i' } },
          { normalized_food_name: { $regex: `^${escapeRegex(normalizedTerm)}` } }
        ];
      } else {
        // Case-insensitive partial match on either food_name or normalized_food_name
        query.$or = [
          { food_name: { $regex: escapeRegex(rawTerm), $options: 'i' } },
          { normalized_food_name: { $regex: escapeRegex(normalizedTerm), $options: 'i' } }
        ];
      }
    }

    // If include_all is true and no other filters are set, return all foods
    const foods = await TherapeuticDietFood.find(query)
      .select('food_name normalized_food_name diet_code allowed note source_file createdAt updatedAt')
      .sort({ normalized_food_name: 1 })
      .lean();
    
    console.log(`[therapeuticDietFood.controller.js] ✅ Found ${foods.length} therapeutic diet foods.`);
    res.status(200).json({
      success: true,
      message: "Therapeutic diet foods retrieved successfully.",
      count: foods.length,
      data: foods,
    });
  } catch (error) {
    console.error("[therapeuticDietFood.controller.js] ❌ Error fetching therapeutic diet foods:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching therapeutic diet foods.", 
      error: error.message 
    });
  }
};

/**
 * @function getTherapeuticDietFoodById
 * @description Retrieves a specific therapeutic diet food entry by its ID.
 * @async
 * @param {object} req - The Express request object.
 * @param {object} req.params - The URL parameters.
 * @param {string} req.params.id - The ID of the food item to retrieve.
 * @param {object} res - The Express response object.
 * @returns {Promise<void>} Sends a JSON response with the food item or an error message if not found.
 */
export const getTherapeuticDietFoodById = async (req, res) => {
  console.log(`[therapeuticDietFood.controller.js] 🚀 Fetching therapeutic diet food by ID: ${req.params.id}`);
  try {
    const food = await TherapeuticDietFood.findById(req.params.id);
    if (!food) {
      console.warn(`[therapeuticDietFood.controller.js] ⚠️ Therapeutic diet food not found with ID: ${req.params.id}`);
      return res.status(404).json({ 
        success: false, 
        message: "Therapeutic diet food not found." 
      });
    }
    console.log(`[therapeuticDietFood.controller.js] ✅ Therapeutic diet food found: ${food._id}`);
    res.status(200).json({
      success: true,
      message: "Therapeutic diet food retrieved successfully.",
      data: food,
    });
  } catch (error) {
    console.error(`[therapeuticDietFood.controller.js] ❌ Error fetching therapeutic diet food by ID ${req.params.id}:`, error);
    if (error.kind === 'ObjectId') {
        return res.status(400).json({ success: false, message: 'Invalid ID format.' });
    }
    res.status(500).json({ 
      success: false, 
      message: "Error fetching therapeutic diet food.", 
      error: error.message 
    });
  }
};

/**
 * @function updateTherapeuticDietFood
 * @description Updates an existing therapeutic diet food entry by its ID.
 * @async
 * @param {object} req - The Express request object.
 * @param {object} req.params - The URL parameters.
 * @param {string} req.params.id - The ID of the food item to update.
 * @param {object} req.body - The body of the request, containing fields to update (e.g., food_name, allowed, note).
 * @param {object} res - The Express response object.
 * @returns {Promise<void>} Sends a JSON response with the updated food item or an error message.
 */
export const updateTherapeuticDietFood = async (req, res) => {
  console.log(`[therapeuticDietFood.controller.js] 🚀 Attempting to update therapeutic diet food ID: ${req.params.id} with data:`, req.body);
  try {
    const { food_name, ...updateData } = req.body;

    if (food_name) {
      updateData.food_name = food_name;
      updateData.normalized_food_name = normalizeFoodName(food_name);
    }
    // Ensure 'allowed' is boolean if provided
    if (req.body.hasOwnProperty('allowed') && typeof req.body.allowed !== 'boolean') {
        console.warn("[therapeuticDietFood.controller.js] ⚠️ Validation Error: 'allowed' field must be a boolean.");
        return res.status(400).json({ 
            success: false, 
            message: "Validation Error: 'allowed' field must be a boolean."
        });
    }

    const updatedFood = await TherapeuticDietFood.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true } // Return the updated document and run schema validators
    );

    if (!updatedFood) {
      console.warn(`[therapeuticDietFood.controller.js] ⚠️ Therapeutic diet food not found for update with ID: ${req.params.id}`);
      return res.status(404).json({ 
        success: false, 
        message: "Therapeutic diet food not found." 
      });
    }
    console.log(`[therapeuticDietFood.controller.js] ✅ Therapeutic diet food updated successfully: ${updatedFood._id}`);
    res.status(200).json({
      success: true,
      message: "Therapeutic diet food updated successfully.",
      data: updatedFood,
    });
  } catch (error) {
    console.error(`[therapeuticDietFood.controller.js] ❌ Error updating therapeutic diet food ID ${req.params.id}:`, error);
    if (error.kind === 'ObjectId') {
        return res.status(400).json({ success: false, message: 'Invalid ID format.' });
    }
    if (error.code === 11000) { // Duplicate key error on update
      return res.status(409).json({
        success: false,
        message: `Conflict: Update would result in a duplicate food item for the diet.`,
        error: error.message,
      });
    }
    res.status(500).json({ 
      success: false, 
      message: "Error updating therapeutic diet food.", 
      error: error.message 
    });
  }
};

/**
 * @function deleteTherapeuticDietFood
 * @description Deletes a therapeutic diet food entry by its ID.
 * @async
 * @param {object} req - The Express request object.
 * @param {object} req.params - The URL parameters.
 * @param {string} req.params.id - The ID of the food item to delete.
 * @param {object} res - The Express response object.
 * @returns {Promise<void>} Sends a JSON response confirming deletion or an error message.
 */
export const deleteTherapeuticDietFood = async (req, res) => {
  console.log(`[therapeuticDietFood.controller.js] 🚀 Attempting to delete therapeutic diet food ID: ${req.params.id}`);
  try {
    const deletedFood = await TherapeuticDietFood.findByIdAndDelete(req.params.id);

    if (!deletedFood) {
      console.warn(`[therapeuticDietFood.controller.js] ⚠️ Therapeutic diet food not found for deletion with ID: ${req.params.id}`);
      return res.status(404).json({ 
        success: false, 
        message: "Therapeutic diet food not found." 
      });
    }
    console.log(`[therapeuticDietFood.controller.js] ✅ Therapeutic diet food deleted successfully: ${req.params.id}`);
    res.status(200).json({ // Or 204 with no content, but 200 with message is often more informative
      success: true,
      message: "Therapeutic diet food deleted successfully.",
      data: { id: deletedFood._id } // Optionally return the id of the deleted item
    });
  } catch (error) {
    console.error(`[therapeuticDietFood.controller.js] ❌ Error deleting therapeutic diet food ID ${req.params.id}:`, error);
    if (error.kind === 'ObjectId') {
        return res.status(400).json({ success: false, message: 'Invalid ID format.' });
    }
    res.status(500).json({ 
      success: false, 
      message: "Error deleting therapeutic diet food.", 
      error: error.message 
    });
  }
};
