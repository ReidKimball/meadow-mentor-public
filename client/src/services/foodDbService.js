import { API_BASE_URL } from '../env-config';
import { getAuth } from 'firebase/auth';
import { app } from '../config/firestore';

const auth = getAuth(app);

/**
 * Transforms API food item to the format expected by the frontend
 * @param {Object} apiFood - Food item from the API
 * @returns {Object} Transformed food item
 */
const transformFoodItem = (apiFood) => ({
  _id: apiFood._id,
  name: apiFood.food_name,
  normalizedName: apiFood.normalized_food_name,
  status: apiFood.allowed ? 'ALLOWED' : 'NOT_ALLOWED',
  description: apiFood.note,
  category: apiFood.food_category, // Add if available in your data
  dietCode: apiFood.diet_code,
  // Include any other fields you need
});

/**
 * Fetches food items based on the user's therapeutic diet
 * @param {string} dietCode - The code of the therapeutic diet (e.g., 'SCD', 'GAPS')
 * @returns {Promise<Array>} - Array of food items
 * @throws {Error} - If the request fails
 */
const getFoodsByDiet = async (dietCode) => {
  if (!dietCode) {
    throw new Error('Diet code is required');
  }

  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const token = await user.getIdToken(true);
    console.log('Fetching foods for diet:', dietCode);
    
    const response = await fetch(
      `${API_BASE_URL}/api/therapeutic-diet-foods?diet_code=${encodeURIComponent(dietCode)}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch foods');
    }

    const result = await response.json();
    console.log('API Response:', result);
    
    if (!result.success || !Array.isArray(result.data)) {
      console.error('Unexpected API response format:', result);
      return [];
    }

    // Transform the API data to match our frontend format
    const foods = result.data.map(transformFoodItem);
    console.log('Transformed foods:', foods);
    
    return foods;
  } catch (error) {
    console.error('Error in getFoodsByDiet:', error);
    throw error;
  }
};

/**
 * Fetches a list of food objects for a given diet from the public API.
 * This function does not require authentication and is safe for public use.
 * @param {string} dietCode - The code for the therapeutic diet (e.g., 'SCD').
 * @returns {Promise<Array<object>>} - A promise that resolves to an array of food objects, each containing `food_name` and `allowed` status.
 * @throws {Error} - If the network request fails or the API returns an error.
 */
const getPublicFoodsByDiet = async (dietCode) => {
  if (!dietCode) {
    console.error("[foodDbService] getPublicFoodsByDiet: dietCode is required.");
    return []; // Return empty array if no diet code is provided
  }

  try {
    console.log(`[foodDbService] Fetching public foods for diet: ${dietCode}`);
    const response = await fetch(`${API_BASE_URL}/api/foods/by-diet/${dietCode}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch public foods');
    }

    const foods = await response.json();
    console.log(`[foodDbService] Found ${foods.length} public foods for diet ${dietCode}.`);
    return foods;

  } catch (error) {
    console.error('[foodDbService] Error in getPublicFoodsByDiet:', error);
    // In a public context, we might not want to throw, but return an empty array
    // so the UI can handle it gracefully without crashing.
    return [];
  }
};

/**
 * Fetches the full details of a specific therapeutic diet by its code. This is a public endpoint.
 * @param {string} dietCode - The code of the diet to fetch (e.g., 'SCD').
 * @returns {Promise<object>} A promise that resolves to the diet details object.
 * @throws {Error} If the network request fails.
 */
export const getDietDetailsByCode = async (dietCode) => {
  try {
    // Use the public api instance, no auth needed
    const response = await fetch(`${API_BASE_URL}/api/therapeutic-diets/by-code/${dietCode}`);
    console.log(`✅ [foodDbService] Successfully fetched public diet details for: ${dietCode}`);
    return response.json();
  } catch (error) {
    console.error(`❌ [foodDbService] Error fetching public diet details for ${dietCode}:`, error);
    throw error; // Let the calling component handle the error
  }
};

export default {
  getFoodsByDiet,
  getPublicFoodsByDiet,
  getDietDetailsByCode,
};
