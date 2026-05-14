/**
 * @file conditions.js
 * @description Manages API endpoints related to health conditions. This includes searching for conditions,
 * providing autocomplete suggestions for condition names, and listing all available conditions.
 * It also incorporates a mechanism for tracking search queries to understand user needs and search trends.
 * @requires express - Fast, unopinionated, minimalist web framework for Node.js.
 * @requires dotenv - Loads environment variables from a .env file.
 * @requires ../models/conditions.model.js - Mongoose model for health conditions.
 * @requires ../models/conditionSearch.model.js - Mongoose model for tracking condition search queries.
 * @requires ../utils/stringUtils.js - Utility functions for string manipulation, like normalization and fuzzy matching.
 * @author Cascade (AI Assistant)
 * @version 1.0.0
 * @date 2025-05-20
 */

// Third-Party Libraries
import express from "express"; // Framework for building web applications
import dotenv from "dotenv"; // Utility for loading environment variables

// Internal Modules: Models
import Condition from "../models/conditions.model.js"; // Mongoose model for health condition data
import ConditionSearch from "../models/conditionSearch.model.js"; // Mongoose model for tracking search queries on conditions

// Internal Modules: Utilities
import { normalizeString, findMostSimilarTerm } from "../utils/stringUtils.js"; // Helper functions for string processing

// Initialize dotenv to load environment variables from .env file
dotenv.config();

/**
 * Express router to mount condition-related functions on.
 * @type {express.Router}
 */
const router = express.Router();

/**
 * @function trackSearchQuery
 * @description Asynchronously tracks search terms for conditions. It normalizes the term,
 * checks for existing similar terms using fuzzy matching provided by `findMostSimilarTerm`,
 * and either updates an existing search record in the `ConditionSearch` collection or creates a new one.
 * This helps in understanding search trends and popular conditions without impacting the primary search functionality.
 * Errors during this process are logged but not propagated to prevent disruption of the main API endpoint.
 * @async
 * @param {string} searchTerm - The original search term entered by the user. If empty or whitespace, the function returns early.
 * @param {boolean} matchFound - Indicates whether the search term resulted in any matching conditions from the `Condition` collection.
 * @returns {Promise<void>} Does not return a value; performs database operations asynchronously.
 * @see {@link normalizeString}
 * @see {@link findMostSimilarTerm}
 */
async function trackSearchQuery(searchTerm, matchFound) {
  try {
    // Do not track empty or whitespace-only search terms
    if (!searchTerm || searchTerm.trim() === "") return;

    const normalizedTerm = normalizeString(searchTerm); // Normalize the term for consistent tracking

    // Retrieve all existing normalized terms to check for similarities
    const existingSearches = await ConditionSearch.find(
      {},
      { normalized_term: 1 } // Projection to fetch only normalized_term
    );
    const existingTerms = existingSearches.map(
      (search) => search.normalized_term
    );

    // Find the most similar existing term to the current normalized search term
    const similarTerm = findMostSimilarTerm(normalizedTerm, existingTerms);

    if (similarTerm) {
      // If a similar term exists, update its record
      await ConditionSearch.findOneAndUpdate(
        { normalized_term: similarTerm },
        {
          $inc: { search_count: 1 }, // Increment the search count
          $addToSet: { original_terms: searchTerm }, // Add the new original term if it's not already present
          last_searched: new Date(), // Update the last searched timestamp
          matched_condition: matchFound, // Update whether this search instance found a match
        }
      );
      console.log(`[conditions.js] Updated search record for similar term: "${similarTerm}" (original: "${searchTerm}")`);
    } else {
      // If no similar term is found, create a new search record
      const newSearch = new ConditionSearch({
        normalized_term: normalizedTerm,
        original_terms: [searchTerm],
        search_count: 1,
        first_searched: new Date(),
        last_searched: new Date(),
        matched_condition: matchFound,
      });
      await newSearch.save();
      console.log(`[conditions.js] Created new search record for term: "${normalizedTerm}" (original: "${searchTerm}")`);
    }
  } catch (error) {
    // Log errors but do not let them break the main search functionality
    console.error("Error tracking search query:", error);
    // Deliberately not re-throwing to ensure main functionality is not impacted.
  }
}

/**
 * @route GET /search
 * @description Searches for health conditions based on a query parameter `condition`.
 * Performs a case-insensitive regular expression search on the `condition_name` field.
 * After the search, it asynchronously calls `trackSearchQuery` to log the search term and its outcome.
 * @access Public
 * @param {object} req - Express request object.
 * @param {string} [req.query.condition=""] - The search term for conditions. Defaults to an empty string if not provided.
 * @param {object} res - Express response object.
 * @returns {Promise<void>} Sends a JSON response with search results or an error status.
 * @example 
 * // Request:
 * // GET /api/conditions/search?condition=Crohn's
 * 
 * // Response (200 OK):
 * // {
 * //   "results": [
 * //     { 
 * //       "_id": "someObjectId", 
 * //       "condition_name": "Crohn's Disease", 
 * //       "description": "...", 
 * //       "therapeutic_diets": [...]
 * //     }
 * //   ]
 * // }
 * 
 * // Response (500 Internal Server Error):
 * // {
 * //   "error": "Internal server error"
 * // }
 */
router.get("/search", async (req, res) => {
  try {
    const searchTerm = req.query.condition || "";

    console.log(`[conditions.js] Received search request for: "${searchTerm}"`);

    // Escape special regex characters in the search term to prevent regex injection or errors
    const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");

    // Create a case-insensitive search using regex on the 'condition_name' field
    const results = await Condition.find({
      condition_name: { $regex: escapedSearchTerm, $options: "i" },
      supported: true,
    });

    console.log(
      `[conditions.js] Found ${results.length} matches for "${searchTerm}"`
    );

    // Track this search query asynchronously (do not await to avoid delaying the response)
    trackSearchQuery(searchTerm, results.length > 0);

    return res.status(200).json({ results });
  } catch (error) {
    console.error("Error searching conditions:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @route GET /autocomplete
 * @description Provides autocomplete suggestions for health condition names based on a partial search term (`req.query.term`).
 * Returns a list of matching condition names, limited to 10 suggestions. 
 * The search is case-insensitive and requires the term to be at least 2 characters long.
 * @access Public
 * @param {object} req - Express request object.
 * @param {string} [req.query.term=""] - The partial search term for autocomplete. Must be at least 2 characters.
 * @param {object} res - Express response object.
 * @returns {Promise<void>} Sends a JSON response with an array of suggestion strings or an error status.
 * @example
 * // Request:
 * // GET /api/conditions/autocomplete?term=chro
 * 
 * // Response (200 OK):
 * // {
 * //   "suggestions": ["Crohn's Disease", "Chronic Fatigue Syndrome"]
 * // }
 * 
 * // Response (200 OK, term too short):
 * // {
 * //   "suggestions": []
 * // }
 * 
 * // Response (500 Internal Server Error):
 * // {
 * //   "error": "Internal server error"
 * // }
 */
router.get("/autocomplete", async (req, res) => {
  try {
    const searchTerm = req.query.term || "";

    // Return empty suggestions if the search term is too short, improves performance and relevance.
    if (searchTerm.length < 2) {
      return res.status(200).json({ suggestions: [] });
    }

    console.log(`[conditions.js] Autocomplete request for: "${searchTerm}"`);

    // Find condition names that match the search term using a case-insensitive regex
    // Only return the condition_name field and limit to 10 suggestions for performance
    const results = await Condition.find(
      { condition_name: { $regex: searchTerm, $options: "i" }, supported: true },
      { condition_name: 1, _id: 0 } // Projection: only return the condition_name field, exclude _id
    ).limit(10); // Performance: Limit the number of suggestions

    // Map results to an array of strings (condition names)
    const suggestions = results.map((result) => result.condition_name);

    console.log(
      `[conditions.js] Found ${suggestions.length} autocomplete suggestions for "${searchTerm}"`
    );

    return res.status(200).json({ suggestions });
  } catch (error) {
    console.error("Error getting autocomplete suggestions:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @route GET /
 * @description Retrieves a list of all available health conditions, sorted alphabetically by name.
 * This endpoint is useful for populating dropdowns or lists of conditions in the frontend.
 * Only returns the `condition_name` for each condition.
 * @access Public
 * @param {object} req - Express request object (not used for specific parameters here).
 * @param {object} res - Express response object.
 * @returns {Promise<void>} Sends a JSON response with an array of condition objects or an error status.
 * @example
 * // Request:
 * // GET /api/conditions/
 * 
 * // Response (200 OK):
 * // [
 * //   { "_id": "someObjectId1", "condition_name": "Arthritis" },
 * //   { "_id": "someObjectId2", "condition_name": "Crohn's Disease" },
 * //   ...
 * // ]
 * // (Note: Example shows _id for clarity, but current projection only returns condition_name)
 * // Actual Response (200 OK with current projection):
 * // [
 * //   { "condition_name": "Arthritis" },
 * //   { "condition_name": "Crohn's Disease" },
 * //   ...
 * // ]
 * 
 * // Response (500 Internal Server Error):
 * // {
 * //   "error": "Internal server error"
 * // }
 */
router.get("/", async (req, res) => {
  try {
    // Fetch all conditions, projecting only the condition_name, and sort them alphabetically
    const conditions = await Condition.find(
      { supported: true },
      { condition_name: 1, _id: 0 }
    ).sort({
      condition_name: 1, // Sort by condition_name in ascending order (A-Z)
    });
    console.log(`[conditions.js] Returning ${conditions.length} conditions`);
    return res.status(200).json(conditions);
  } catch (error) {
    console.error("Error fetching conditions:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Exports the Express router for conditions API endpoints.
 * @module routes/conditions
 */
export default router;
