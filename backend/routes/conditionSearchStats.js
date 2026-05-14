/**
 * @file conditionSearchStats.js
 * @description This file defines the Express router for handling API endpoints related to condition search statistics. 
 *              It provides routes for administrators to view all searches, aggregated search statistics (top, recent, unmatched),
 *              and to delete specific search entries. All routes are protected and require admin privileges.
 * @version 1.0.0
 * @requires express - Express framework for building the router.
 * @requires ../models/conditionSearch.model.js - Mongoose model for condition search data.
 * @requires ../middleware/verifyAdmin.js - Middleware to verify administrator privileges.
 * @date 2025-05-21
 * @author Cascade
 */

import express from "express"; // Express framework for creating router handlers.
import ConditionSearch from "../models/conditionSearch.model.js"; // Mongoose model for interacting with the 'conditionsearches' collection.
import { verifyAdmin } from "../middleware/verifyAdmin.js"; // Middleware to ensure only administrators can access these routes.

/**
 * Express router to mount condition search statistics related functions on.
 * @type {object}
 * @const
 * @namespace conditionSearchStatsRouter
 */
const router = express.Router();

// Add verifyAdmin middleware to protect all routes defined in this file.
// This ensures that only users with administrator privileges can access these endpoints.
router.use(verifyAdmin);

/**
 * @route GET /searches
 * @description Retrieves all recorded condition searches, sorted by the normalized term.
 *              This endpoint is intended for administrative purposes to review all search queries made by users.
 * @access Admin
 * @middleware verifyAdmin - Applied globally to this router.
 * @async
 * @returns {object} 200 - An array of condition search objects.
 * @returns {object} 500 - An error object if an internal server error occurs.
 * @example // Response 200:
 * // [
 * //   {
 * //     "_id": "60c72b2f9b1e8b001c8e4d1a",
 * //     "term": "Crohn's Disease",
 * //     "normalized_term": "crohns disease",
 * //     "search_count": 15,
 * //     "last_searched": "2025-05-20T10:00:00.000Z",
 * //     "matched_condition": true
 * //   }, 
 * //   // ... more search objects
 * // ]
 */
router.get("/searches", async (req, res) => {
  try {
    const searches = await ConditionSearch.find().sort({ normalized_term: 1 });
    return res.status(200).json(searches);
  } catch (error) {
    console.error("Error fetching condition searches:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @route GET /search-stats
 * @description Retrieves aggregated statistics for condition searches, including top searched terms, 
 *              recent searches, and unmatched searches (terms searched multiple times but not matching any known condition).
 *              This endpoint is for administrative use to gain insights into user search patterns and identify potential new conditions to add.
 * @access Admin
 * @middleware verifyAdmin - Applied globally to this router.
 * @async
 * @returns {object} 200 - An object containing 'topSearches', 'recentSearches', and 'unmatchedSearches' arrays.
 * @returns {object} 500 - An error object if an internal server error occurs.
 * @example // Response 200:
 * // {
 * //   "topSearches": [ { "term": "IBD", "search_count": 50, ... } ],
 * //   "recentSearches": [ { "term": "SCD Diet", "last_searched": "2025-05-21T08:00:00.000Z", ... } ],
 * //   "unmatchedSearches": [ { "term": "xyz syndrome", "search_count": 5, "matched_condition": false, ... } ]
 * // }
 */
router.get("/search-stats", async (req, res) => {
  try {
    // Get top searched terms
    const topSearches = await ConditionSearch.find()
      .sort({ search_count: -1 })
      .limit(20);

    // Get recent searches
    const recentSearches = await ConditionSearch.find()
      .sort({ last_searched: -1 })
      .limit(20);

    // Get unmatched searches (potential new conditions to add)
    const unmatchedSearches = await ConditionSearch.find({
      matched_condition: false,
      search_count: { $gt: 1 }, // Only show if searched multiple times
    }).sort({ search_count: -1 });

    return res.status(200).json({
      topSearches,
      recentSearches,
      unmatchedSearches,
    });
  } catch (error) {
    console.error("Error fetching search statistics:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @route DELETE /search/:id
 * @description Deletes a specific condition search entry by its ID.
 *              This endpoint is for administrative use to manage and clean up search records.
 * @access Admin
 * @middleware verifyAdmin - Applied globally to this router.
 * @async
 * @param {object} req.params - The URL parameters.
 * @param {string} req.params.id - The MongoDB ObjectId of the condition search entry to delete.
 * @returns {object} 200 - A success message indicating the search entry was deleted.
 * @returns {object} 404 - An error object if the condition search entry with the given ID is not found.
 * @returns {object} 500 - An error object if an internal server error occurs.
 * @example // req.params.id: "60c72b2f9b1e8b001c8e4d1a"
 * // Response 200:
 * // { "message": "Condition search deleted successfully" }
 * // Response 404:
 * // { "error": "Condition search not found" }
 */
router.delete("/search/:id", async (req, res) => {
  try {
    const result = await ConditionSearch.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: "Condition search not found" });
    }
    return res
      .status(200)
      .json({ message: "Condition search deleted successfully" });
  } catch (error) {
    console.error("Error deleting condition search:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
