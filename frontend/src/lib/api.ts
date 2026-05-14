// API configuration for Next.js frontend
export const API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://app.meadowmentor.com'
    : 'http://localhost:8000';

// App base URL for redirects
export const APP_BASE_URL = 
  process.env.NODE_ENV === 'production'
    ? 'https://app.meadowmentor.com'
    : 'http://localhost:5173';

export interface FoodItem {
  food_name: string;
  allowed: boolean;
  note?: string;
  food_category?: string;
  diet_code?: string;
}

export interface DietDetails {
  diet_code: string;
  diet_name: string;
  description: string;
}

/**
 * Fetches public food list for a given diet (no auth required)
 */
export async function getPublicFoodsByDiet(dietCode: string): Promise<FoodItem[]> {
  if (!dietCode) {
    console.error('[API] getPublicFoodsByDiet: dietCode is required.');
    return [];
  }

  try {
    console.log(`[API] Fetching public foods for diet: ${dietCode}`);
    const response = await fetch(`${API_BASE_URL}/api/foods/by-diet/${dietCode}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch public foods');
    }

    const foods: FoodItem[] = await response.json();
    console.log(`[API] Found ${foods.length} public foods for diet ${dietCode}.`);
    return foods;
  } catch (error) {
    console.error('[API] Error in getPublicFoodsByDiet:', error);
    return [];
  }
}

/**
 * Fetches diet details by code (no auth required)
 */
export async function getDietDetailsByCode(dietCode: string): Promise<DietDetails | null> {
  try {
    console.log(`[API] Fetching diet details for: ${dietCode} from ${API_BASE_URL}`);
    const response = await fetch(`${API_BASE_URL}/api/therapeutic-diets/by-code/${dietCode}`);
    
    if (!response.ok) {
      console.warn(`[API] Diet details fetch returned status ${response.status} for ${dietCode}`);
      return null;
    }

    const data = await response.json();
    console.log(`✅ [API] Successfully fetched public diet details for: ${dietCode}`);
    return data;
  } catch (error) {
    console.error(`❌ [API] Error fetching public diet details for ${dietCode}:`, error);
    // Return null instead of throwing to prevent component crashes
    return null;
  }
}
