/**
 * @file publicRecipeDiscovery.service.js
 * @description Provides a small, reusable service for searching *public* recipes in MongoDB.
 * This is designed to support AI-driven recipe discovery (e.g., Chef Kay chat) without
 * loading the entire recipe catalog into the LLM context window.
 *
 * Key goals:
 * - Keep queries safe and server-controlled (no raw Mongo query strings from the LLM).
 * - Return only the minimal fields needed for listing/search results.
 * - Cap results to control token usage and cost.
 *
 * @version 1.0.0
 * @requires ../models/recipe.model.js - Mongoose model for recipes.
 * @date 2025-12-21
 * @author Cascade
 */

/**
 * @typedef {Object} PublicRecipeDiscoveryCriteria
 * @property {string | null} diet - Diet code to filter by (e.g., "SCD"). If null, do not filter by diet.
 * @property {string | null} mealType - Meal type to filter by (e.g., "breakfast"). If null, do not filter by meal type.
 * @property {boolean} flareFriendly - If true, filter to recipes tagged as flare-friendly.
 * @property {string | null} keywords - Optional keyword string used to match title/description.
 * @property {number} limit - Maximum number of recipes to return.
 */

// Internal Modules - Models
import Recipe from "../models/recipe.model.js"; // Mongoose model for recipe documents.

/**
 * A fixed allowlist of tags that indicate the recipe is gentle during a flare.
 *
 * @type {string[]}
 */
export const FLARE_FRIENDLY_TAGS = ["flare-friendly", "gentle", "low-fiber"];

/**
 * Escapes user-provided strings so they can be used safely inside a RegExp.
 *
 * @function escapeRegExp
 * @param {string} value - Raw user string.
 * @returns {string} The escaped string.
 */
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Builds a safe MongoDB query for public recipe discovery.
 *
 * @function buildPublicRecipeDiscoveryQuery
 * @param {PublicRecipeDiscoveryCriteria} criteria - Normalized criteria.
 * @returns {object} A MongoDB query object.
 */
export function buildPublicRecipeDiscoveryQuery(criteria) {
  const query = {
    visibility: "public",
  };

  if (criteria.diet) {
    query.recipeDiet = criteria.diet;
  }

  if (criteria.mealType) {
    query.mealType = criteria.mealType;
  }

  if (criteria.flareFriendly) {
    query.tags = { $in: FLARE_FRIENDLY_TAGS };
  }

  if (criteria.keywords) {
    const safe = escapeRegExp(criteria.keywords.trim());
    if (safe) {
      const rx = new RegExp(safe, "i");
      query.$or = [{ recipeTitle: rx }, { recipeDescription: rx }];
    }
  }

  return query;
}

/**
 * Finds the top public recipes for discovery.
 *
 * Sorting strategy:
 * - Highest `averageRating` first.
 * - Newer recipes as a tie-breaker (useful when most recipes have zero ratings).
 *
 * @async
 * @function findPublicRecipesForDiscovery
 * @param {PublicRecipeDiscoveryCriteria} criteria - Search criteria (diet/mealType/tags/keywords).
 * @returns {Promise<object[]>} Array of recipe docs (lean objects) with only minimal listing fields.
 */
export async function findPublicRecipesForDiscovery(criteria) {
  const normalized = {
    diet: criteria.diet ?? null,
    mealType: criteria.mealType ?? null,
    flareFriendly: Boolean(criteria.flareFriendly),
    keywords: typeof criteria.keywords === "string" ? criteria.keywords : null,
    limit: Number.isFinite(criteria.limit) ? Math.max(1, Math.min(criteria.limit, 25)) : 5,
  };

  const query = buildPublicRecipeDiscoveryQuery(normalized);

  return Recipe.find(query)
    .select({
      _id: 1,
      recipeTitle: 1,
      recipeDescription: 1,
      recipeDiet: 1,
      mealType: 1,
      slug: 1,
      averageRating: 1,
      tags: 1,
      createdAt: 1,
    })
    .sort({ averageRating: -1, createdAt: -1 })
    .limit(normalized.limit)
    .lean();
}
