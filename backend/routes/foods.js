/**
 * 
 * might be used when logging meals?
 * 
 * @file foods.js
 * @description Manages API endpoints related to food items. This includes fetching food names by therapeutic diet
 *              and checking the compliance of a list of ingredients against a specified therapeutic diet.
 * @version 1.0.0
 * @date 2025-05-21
 * @author Cascade AI
 * @requires express - Express framework for routing.
 * @requires ../models/therapeuticDietFood.model.js - Mongoose model for therapeutic diet food items.
 * @requires ../utils/stringUtils.js - Utility functions for string normalization and comparison.
 * @requires ../utils/complianceUtils.js - Utility function for checking ingredient compliance.
 */

import express from "express"; // Import Express framework for creating router
import TherapeuticDietFood from "../models/therapeuticDietFood.model.js"; // Import Mongoose model for TherapeuticDietFood
import { normalizeString, findMostSimilarTerm } from "../utils/stringUtils.js"; // Import string utility functions
import { checkIngredientCompliance } from "../utils/complianceUtils.js";

/**
 * Express router to mount food-related functions on.
 * @type {object}
 * @const
 * @namespace foodsRouter
 */
const router = express.Router();

/**
 * @route GET /by-diet/:diet_code
 * @description Fetches a list of unique, sorted food objects (including name and compliance status) available for a specified therapeutic diet.
 *              This is typically used to populate autocomplete fields in the frontend.
 * @access Public
 * @param {object} req - Express request object.
 * @param {object} req.params - URL parameters.
 * @param {string} req.params.diet_code - The code of the therapeutic diet (e.g., "SCD", "GAPS") for which to fetch food names.
 * @returns {object} 200 - Success. An array of food objects with `food_name` and `allowed` status.
 * @example GET /api/foods/by-diet/SCD
 * // Response 200:
 * // [
 * //   { "food_name": "Almonds", "allowed": true },
 * //   { "food_name": "Avocado", "allowed": true },
 * //   { "food_name": "Banana (ripe)", "allowed": true }
 * // ]
 * @returns {object} 400 - Bad Request. If `diet_code` parameter is missing.
 * // Response 400:
 * // {
 * //   "message": "Missing diet_code parameter."
 * // }
 * @returns {object} 500 - Internal Server Error. If there's an error during the database query.
 * // Response 500:
 * // {
 * //   "message": "Failed to fetch food names.",
 * //   "error": "<error_message>"
 * // }
 * @async
 */
router.get("/by-diet/:diet_code", async (req, res) => {
  const { diet_code } = req.params;
  // Optional: Authentication check if needed

  if (!diet_code) {
    return res.status(400).json({ message: "Missing diet_code parameter." });
  }

  try {
    console.log(`[foods.js] Fetching food names for diet: ${diet_code}`);
    // Find all foods for the diet, selecting only the necessary fields.
    // This provides both the name for the search and the 'allowed' status.
    const foods = await TherapeuticDietFood.find(
      { diet_code: diet_code },
      { food_name: 1, allowed: 1, _id: 0 } // Select food_name, allowed status, and exclude _id
    ).sort({ food_name: 1 }); // Sort alphabetically by food name

    console.log(
      `[foods.js] Found ${foods.length} food items for diet ${diet_code}.`
    );
    res.status(200).json(foods); // Return as an array of objects
  } catch (error) {
    console.error(
      `[foods.js] Error fetching food names for diet ${diet_code}:`,
      error
    );
    res.status(500).json({
      message: "Failed to fetch food names.",
      error: error.message,
    });
  }
});
// --- END NEW ROUTE ---

/**
 * @route POST /check-compliance
 * @description Checks a list of ingredients against a specified therapeutic diet to determine their compliance status
 *              (allowed, not allowed, or not found). It returns detailed results for each ingredient and an overall score.
 * @access Public (Note: Authentication is commented out in the original code but can be enabled if needed.)
 * @param {object} req - Express request object.
 * @param {object} req.body - The request body.
 * @param {string[]} req.body.ingredients - An array of ingredient names (strings) to check. These should ideally be names
 *                                        obtained from the `/by-diet/:diet_code` endpoint for best accuracy, but the system
 *                                        attempts to handle variations.
 * @param {string} req.body.diet - The code of the therapeutic diet (e.g., "SCD", "GAPS") against which to check compliance.
 * @returns {object} 200 - Success. An object containing an array of compliance results, an overall compliance score,
 *                         and counts of compliant, non-compliant, and not-found ingredients.
 * @example POST /api/foods/check-compliance
 * // Request Body:
 * // {
 * //   "ingredients": ["Almonds", "Honey", "Wheat Flour"],
 * //   "diet": "SCD"
 * // }
 * // Response 200:
 * // {
 * //   "results": [
 * //     { "ingredient": "Almonds", "normalized_ingredient": "Almonds", "found": true, "allowed": true, "note": "Allowed in moderation" },
 * //     { "ingredient": "Honey", "normalized_ingredient": "Honey", "found": true, "allowed": true, "note": null },
 * //     { "ingredient": "Wheat Flour", "normalized_ingredient": null, "found": false, "allowed": null, "note": "Ingredient not found in database for this diet." }
 * //   ],
 * //   "score": 67, // (compliantCount / (compliantCount + nonCompliantCount)) * 100, or null if no items found/checked
 * //   "compliantCount": 2,
 * //   "nonCompliantCount": 0,
 * //   "notFoundCount": 1
 * // }
 * @returns {object} 200 - Success (Empty). If an empty `ingredients` array is provided, returns empty results with a null score.
 * // Request Body:
 * // {
 * //   "ingredients": [],
 * //   "diet": "SCD"
 * // }
 * // Response 200:
 * // {
 * //   "results": [],
 * //   "score": null,
 * //   "compliantCount": 0,
 * //   "nonCompliantCount": 0,
 * //   "notFoundCount": 0
 * // }
 * @returns {object} 400 - Bad Request. If `ingredients` array or `diet` is missing or invalid.
 * // Response 400:
 * // {
 * //   "message": "Missing required fields: ingredients (array) and diet are required."
 * // }
 * @returns {object} 500 - Internal Server Error. If there's an error during processing or database interaction.
 * // Response 500:
 * // {
 * //   "message": "Failed to check food compliance.",
 * //   "error": "<error_message>"
 * // }
 * @async
 */
router.post("/check-compliance", async (req, res) => {
  const { ingredients, diet } = req.body;

  try {
    const complianceData = await checkIngredientCompliance(ingredients, diet);
    res.status(200).json(complianceData);
  } catch (error) {
    console.error("[foods.js] Error checking compliance:", error);
    // Use the status code from the error if available, otherwise default to 500
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      message: error.message || "Failed to check food compliance.",
      error: error.message,
    });
  }
});

// Add other food-related routes if needed (e.g., search)

export default router;
