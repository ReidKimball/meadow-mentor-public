// MCP Service
// This file will contain the business logic for MCP features.

import TherapeuticDietFood from '../models/therapeuticDietFood.model.js'; // Import the model
// import mcpConfig from '../config/mcp.config.js'; // Example config import

/**
 * @async
 * @function getAvailableDiets
 * @description Retrieves a list of supported therapeutic diets.
 *              In a production environment, this might fetch from a database collection
 *              (e.g., a 'diets' collection or distinct 'diet_code' from 'therapeuticDietFood').
 *              For this MVP phase, it returns a hardcoded list.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of diet objects.
 *                                    Each object should have 'code' and 'name' properties.
 * @throws {Error} If there's an issue fetching the diets (e.g., database error).
 */
export const getAvailableDiets = async () => {
  console.log('[mcpService.js] getAvailableDiets invoked.');
  try {
    // For now, returning a hardcoded list based on therapeuticDietFood.model.js enum
    // This matches the list previously in the controller.
    // Later, this could query a 'TherapeuticDiets' model or distinct values from 'TherapeuticDietFood'.
    const diets = [
      { code: "SCD", name: "Specific Carbohydrate Diet" },
      { code: "GAPS", name: "Gut and Psychology Syndrome Diet" },
      { code: "Paleo AIP", name: "Paleo Autoimmune Protocol" },
      { code: "Mediterranean", name: "Mediterranean Diet" },
    ];
    return diets;
  } catch (error) {
    console.error('[mcpService.js] Error in getAvailableDiets:', error);
    // Re-throw the error to be handled by the controller or a global error handler
    // Potentially wrap it in a custom service layer error if needed
    throw new Error('Failed to retrieve available diets.');
  }
};

/**
 * @async
 * @function searchFoodItems
 * @description Searches for food items in the database based on provided criteria.
 *              Supports text search on food name and filtering by diet code, with pagination.
 * @param {object} params - The search parameters.
 * @param {string[]} [params.q] - Array of search query strings for food names (case-insensitive, partial match on each).
 * @param {string} [params.diet] - The diet code to filter by (exact match, case-sensitive based on input).
 * @param {number} params.limit - The maximum number of items to return.
 * @param {number} params.offset - The number of items to skip (for pagination).
 * @returns {Promise<object>} A promise that resolves to an object containing:
 *                            - `data`: An array of found food item objects. Each object includes:
 *                              - `id`: The MongoDB document ID (_id).
 *                              - `food_name`: The name of the food.
 *                              - `normalized_food_name`: The normalized name of the food.
 *                              - `diet_code`: The diet code associated with this entry.
 *                              - `allowed`: Boolean indicating if the food is allowed for the diet.
 *                              - `note`: Any notes associated with the food for this diet.
 *                              - `source_file`: The source file of the data, if available.
 *                            - `pagination`: An object with `total` (total matching documents),
 *                              `limit`, `offset`, `currentPage`, `totalPages`, `hasNextPage`, `hasPrevPage`.
 * @throws {Error} If there's an issue performing the database query.
 */
export const searchFoodItems = async ({ q, diet, limit, offset }) => {
  console.log('[mcpService.js] searchFoodItems invoked with params:', { q, diet, limit, offset });
  try {
    const query = {};
    let normalizedQueries = []; // For storing normalized query strings

    // Normalize food name queries (TASK-BE-MCP-ENHSEARCH-006)
    if (q && Array.isArray(q) && q.length > 0) {
      normalizedQueries = q.map(item => item.trim().toLowerCase());
      // Note: 'normalizedQueries' will be used in the next task to build the $in query.
    }

    // Construct MongoDB query (TASK-BE-MCP-ENHSEARCH-007)
    // Filter by diet_code if 'diet' is provided.
    if (diet) {
      // The validator ensures 'diet' is one of the known uppercase codes if provided.
      query.diet_code = { $regex: `^${diet}$`, $options: 'i' };
    }

    // Filter by normalized_food_name using regex for simple pluralization
    if (normalizedQueries.length > 0) {
      const regexQueries = normalizedQueries.map(term => {
        // Regex to match the term or the term followed by 's', case-insensitive
        // ^ and $ ensure it matches the whole string.
        return { normalized_food_name: { $regex: `^${term}(s)?$`, $options: 'i' } };
      });

      if (regexQueries.length === 1) {
        // If only one query term, apply its regex directly to normalized_food_name
        query.normalized_food_name = regexQueries[0].normalized_food_name;
      } else {
        // If multiple query terms, use $or to match any of them
        query.$or = regexQueries;
      }
    }

    const [foodItems, totalItems] = await Promise.all([
      TherapeuticDietFood.find(query)
        .skip(offset)
        .limit(limit)
        .select('food_name normalized_food_name diet_code allowed note source_file') // Select specific fields
        .lean(), // Use .lean() for performance as results are read-only
      TherapeuticDietFood.countDocuments(query)
    ]);

    // Map _id to id for the response
    const formattedData = foodItems.map(item => ({
      id: item._id.toString(),
      food_name: item.food_name,
      normalized_food_name: item.normalized_food_name,
      diet_code: item.diet_code,
      allowed: item.allowed,
      note: item.note,
      source_file: item.source_file
    }));
    
    const totalPages = Math.ceil(totalItems / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    const results = {
      data: formattedData,
      pagination: {
        total: totalItems,
        limit: limit,
        offset: offset,
        currentPage: currentPage,
        totalPages: totalPages,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: offset > 0 && totalItems > 0,
      }
    };

    console.log(`[mcpService.js] searchFoodItems found ${totalItems} items, returning ${formattedData.length}.`);
    return results;

  } catch (error) {
    console.error('[mcpService.js] Error in searchFoodItems:', error);
    throw new Error('Failed to search for food items due to a server error.'); // More generic error for client
  }
};

/**
 * @async
 * @function getFoodItemById
 * @description Retrieves a specific food item by its MongoDB ID.
 * @param {string} id - The MongoDB ObjectId of the food item.
 * @returns {Promise<object|null>} A promise that resolves to the food item object if found, or null otherwise.
 *                                  The object includes: id, food_name, normalized_food_name, diet_code, allowed, note, source_file.
 * @throws {Error} If there's an issue performing the database query (other than not found).
 */
export const getFoodItemById = async (id) => {
  console.log(`[mcpService.js] getFoodItemById invoked with ID: ${id}`);
  try {
    const foodItem = await TherapeuticDietFood.findById(id)
      .select('food_name normalized_food_name diet_code allowed note source_file') // Select specific fields
      .lean(); // Use .lean() for faster queries

    if (!foodItem) {
      console.log(`[mcpService.js] Food item with ID: ${id} not found.`);
      return null;
    }

    // Map _id to id for the response
    const formattedData = {
      id: foodItem._id.toString(),
      food_name: foodItem.food_name,
      normalized_food_name: foodItem.normalized_food_name,
      diet_code: foodItem.diet_code,
      allowed: foodItem.allowed,
      note: foodItem.note,
      source_file: foodItem.source_file
    };

    console.log(`[mcpService.js] Food item with ID: ${id} found.`);
    return formattedData;

  } catch (error) {
    console.error(`[mcpService.js] Error in getFoodItemById for ID ${id}:`, error);
    // Check if it's a CastError (e.g., invalid ObjectId format), though validator should catch this first.
    if (error.name === 'CastError') {
      // This case should ideally be caught by the validator first.
      // If it reaches here, it implies a non-ObjectId string was passed somehow bypassing validation.
      console.warn(`[mcpService.js] CastError for ID: ${id}. This might indicate an invalid ID format not caught by validator.`);
      return null; // Treat as not found if ID format is wrong at this stage, though validator should prevent this.
    }
    // For other errors, re-throw a generic error to be handled by the global error handler.
    throw new Error('Failed to retrieve food item due to a server error.');
  }
};

// Future service methods for food details, etc., will be added here.
