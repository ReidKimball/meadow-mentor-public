/**
 * @file therapeuticDiets.js
 * @description This file defines the API routes for managing and retrieving information about therapeutic diets supported by the application.
 * It handles requests related to fetching lists of diets, their details, and potentially other diet-specific operations.
 * @version 1.0.0
 * @requires express - Express framework for building the router.
 * @requires ../models/therapeuticDiets.model.js - Mongoose model for therapeutic diets.
 * @date 2025-05-20
 * @author Cascade
 */

// Third-Party Libraries
import express from "express"; // Express.js framework for creating router and handling HTTP requests.

// Internal Modules / Models
import TherapeuticDiet from "../models/therapeuticDiets.model.js"; // Mongoose model for interacting with the 'therapeuticdiets' collection in MongoDB.

/**
 * Express router to mount therapeutic diet related functions on.
 * @type {express.Router}
 */
const router = express.Router();

// GET endpoint to fetch supported therapeutic diets
/**
 * @route GET /
 * @description Fetches a list of all therapeutic diets that are marked as 'supported'.
 * It can be filtered by `diet_type` (e.g., 'primary' or 'restriction') via a query parameter.
 * The list includes only the diet's name and code, sorted alphabetically by name.
 * This endpoint is typically used to populate dropdowns or lists in the frontend where users can select a diet.
 * @access Public
 * @param {string} [req.query.diet_type] - Optional. Filters diets by their type ('primary' or 'restriction').
 * @returns {object} 200 - An array of supported therapeutic diet objects, each containing `diet_name` and `diet_code`.
 * @example response - 200 - Success
 * [
 *   {
 *     "diet_name": "Gut and Psychology Syndrome (GAPS)",
 *     "diet_code": "gaps",
 *     "diet_type": "primary"
 *   },
 *   {
 *     "diet_name": "Specific Carbohydrate Diet (SCD)",
 *     "diet_code": "scd",
 *     "diet_type": "restriction"
 *   }
 * ]
 * @returns {object} 500 - An error object if there was an issue fetching the diets from the database.
 * @example response - 500 - Internal Server Error
 * {
 *   "error": "Internal server error fetching diets"
 * }
 */
router.get("/", async (req, res) => {
  try {
    const { diet_type } = req.query; // Get diet_type from query params

    const filter = { supported: true }; // Base filter

    // If diet_type is provided, add it to the filter
    if (diet_type) {
      filter.diet_type = diet_type;
    }

    // Find diets based on the filter, select only the diet_name and diet_code, and sort alphabetically
    const supportedDiets = await TherapeuticDiet.find(
      filter, // Use the dynamic filter
      { diet_name: 1, diet_code: 1, diet_type: 1, _id: 0 } // Also include diet_type in the response
    ).sort({ diet_name: 1 }); // Sort alphabetically by diet_name

    console.log(
      `✅ [therapeuticDiets.js] Successfully fetched and returning ${supportedDiets.length} supported diets.`
    );
    return res.status(200).json(supportedDiets);
  } catch (error) {
    console.error("❌ [therapeuticDiets.js] Error fetching supported therapeutic diets:", error);
    return res
      .status(500)
      .json({ error: "Internal server error fetching diets", details: error.message });
  }
});

/**
 * @route GET /by-code/:diet_code
 * @description Fetches the full details of a specific therapeutic diet by its diet code.
 * @access Public
 * @param {string} req.params.diet_code - The unique code for the diet (e.g., 'SCD', 'GAPS').
 * @returns {object} 200 - The therapeutic diet object if found.
 * @returns {object} 404 - An error object if the diet with the specified code is not found.
 * @returns {object} 500 - An error object if there was an internal server issue.
 */
router.get("/by-code/:diet_code", async (req, res) => {
  try {
    const { diet_code } = req.params;
    // Use a case-insensitive regex to find the diet by its code.
    // This is more robust for codes that might have variations in casing or spaces.
    const diet = await TherapeuticDiet.findOne({ diet_code: { $regex: new RegExp(`^${diet_code}$`, 'i') } });

    if (!diet) {
      console.warn(`[therapeuticDiets.js] Diet not found for code: ${diet_code}`);
      return res.status(404).json({ error: "Diet not found" });
    }

    console.log(`✅ [therapeuticDiets.js] Successfully fetched diet details for: ${diet_code}`);
    return res.status(200).json(diet);
  } catch (error) {
    console.error(`❌ [therapeuticDiets.js] Error fetching diet by code: ${req.params.diet_code}`, error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

/**
 * Exports the router for use in the main application setup.
 * This allows the routes defined in this file to be mounted under a specific path (e.g., /api/therapeutic-diets).
 * @module routes/therapeuticDiets
 */
export default router;
