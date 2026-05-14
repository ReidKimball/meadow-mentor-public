import { z } from 'zod';
import axios from 'axios';
// Local type definitions based on SDK examples, as direct imports are not found.

interface TextContentPart {
  type: 'text';
  text: string;
  [key: string]: any; // Allow other properties to match SDK expectations
}

// JsonContentPart is removed as type: 'json' seems not directly supported in SDK's ContentPart union.
// JSON data will be stringified and returned in a TextContentPart.

// Define structure for resource content parts based on SDK expectations
interface ResourceType1 {
  text: string;
  uri: string;
  mimeType?: string;
  [key: string]: any;
}

interface ResourceType2 {
  uri: string;
  blob: string;
  mimeType?: string;
  [key: string]: any;
}

interface ResourceContentPart {
  type: 'resource';
  resource: ResourceType1 | ResourceType2;
  [key: string]: any; // Allow other properties
}

// Expand this union if other content part types are discovered (e.g., 'error')
export type ContentPart = TextContentPart | ResourceContentPart; // JsonContentPart removed

interface ToolInvocationResponse {
  content: ContentPart[];
  // Other optional fields like 'error' or 'usage' might exist.
  [key: string]: any; // Allow other properties to match SDK expectations
}

export const GET_FOOD_INGREDIENT_INFO_TOOL_NAME = 'get_food_ingredient_info';
export const GET_FOOD_INGREDIENT_INFO_TOOL_DESCRIPTION = 'Fetches information about specified food ingredients, including their compliance with a given therapeutic diet (e.g., SCD - Specific Carbohydrate Diet).';

export const getFoodIngredientInfoInputSchema = z.object({
  ingredient_names: z.array(z.string()).describe("An array of food ingredient names to query. E.g., ['banana', 'apple', 'whole wheat flour']"),
  diet_code: z.string().describe("The code for the therapeutic diet to check against. E.g., 'SCD'."),
});

// Input type inferred from the Zod schema
type GetFoodIngredientInfoInput = z.infer<typeof getFoodIngredientInfoInputSchema>;

// Structure for the mocked output data for a single ingredient
interface FoodIngredientInfo {
  ingredient_name: string;
  is_compliant: boolean;
  details: string;
  allowed_preparations?: string[];
  notes?: string;
}

// Mocked tool execution logic
export async function executeGetFoodIngredientInfo(
  input: GetFoodIngredientInfoInput
): Promise<ToolInvocationResponse> {
  console.log('[executeGetFoodIngredientInfo] Called with params:', JSON.stringify(input, null, 2));

  const { ingredient_names, diet_code } = input;
  const mainBackendApiUrl = process.env.MAIN_BACKEND_API_URL;

  if (!mainBackendApiUrl) {
    console.error('Error: MAIN_BACKEND_API_URL is not set in environment variables.');
    const errorContentPart: ContentPart = {
      type: 'text',
      text: JSON.stringify({ error: 'Server configuration error: MAIN_BACKEND_API_URL is not set.' })
    };
    console.log('[executeGetFoodIngredientInfo] Returning error response:', JSON.stringify({ content: [errorContentPart] }, null, 2));
    return { content: [errorContentPart] };
  }

  const params = new URLSearchParams();
  ingredient_names.forEach(name => params.append('q', name));
  params.append('diet', diet_code);

  const requestUrl = `${mainBackendApiUrl}/mcp/v1/foods/search?${params.toString()}`;
  console.log(`MCP Server: Calling main backend API: ${requestUrl}`);

  console.log(`[executeGetFoodIngredientInfo] Attempting to call API: ${requestUrl} with queryParams:`, params.toString());
  try {
    const response = await axios.get(requestUrl, {
      headers: {
        'Accept': 'application/json',
        // If your main backend API requires authentication from the MCP server,
        // add necessary headers here (e.g., an API key or token).
      }
    });
    console.log('[executeGetFoodIngredientInfo] Axios GET request successful. Response status:', response.status);
    console.log('[executeGetFoodIngredientInfo] Response data:', JSON.stringify(response.data, null, 2));

    const apiData = response.data;
    const textContentPart: ContentPart = { type: 'text', text: JSON.stringify(apiData) };
    console.log('[executeGetFoodIngredientInfo] Successfully prepared tool response:', JSON.stringify({ content: [textContentPart] }, null, 2));
    return { content: [textContentPart] };

  } catch (error) {
    console.error(`Error calling main backend API at ${requestUrl}:`, error);
    let errorMessage = 'Failed to fetch food ingredient information from the backend.';
    let errorDetails: any = {}; // Using 'any' for flexibility with backend error structure

    if (axios.isAxiosError(error)) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage = `Backend API error: ${error.response.status} ${error.response.statusText}`;
        errorDetails = error.response.data; // This could be an object or string from the backend
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response received from backend API.';
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('[executeGetFoodIngredientInfo] Error fetching food ingredient information:', errorMessage);
      }
    } else if (error instanceof Error) { // General Error
      errorMessage = `Unexpected error: ${error.message}`;
    } else { // Fallback for non-Error objects thrown
      errorMessage = 'An unknown error occurred.';
    }

    const errorContentPart: ContentPart = {
      type: 'text',
      text: JSON.stringify({
        error: errorMessage,
        details: errorDetails,
        requested_url: requestUrl // For debugging
      })
    };
    console.log('[executeGetFoodIngredientInfo] Prepared error response:', JSON.stringify({ content: [errorContentPart] }, null, 2));
    return { content: [errorContentPart] };
  }
}
