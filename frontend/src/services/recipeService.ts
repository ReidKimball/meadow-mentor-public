import { Recipe } from '@/types/recipe';
import { API_BASE_URL } from '@/lib/api';

export interface RecipesResponse {
  success: boolean;
  count: number;
  data: Recipe[];
}

export interface SingleRecipeResponse {
  success: boolean;
  data: Recipe;
}

export async function getPublicRecipes(diet?: string): Promise<RecipesResponse> {
  try {
    let url = `${API_BASE_URL}/api/public-recipes`;
    if (diet && diet !== "All") {
      url += `?diet=${encodeURIComponent(diet)}`;
    }

    const response = await fetch(url, {
      next: { revalidate: 60 } // Revalidate every 60 seconds (ISR)
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch recipes: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching public recipes:', error);
    throw error;
  }
}

// Helper for Server Components to handle 404s gracefully
export async function getPublicRecipeBySlug(slug: string): Promise<SingleRecipeResponse | null> {
  try {
    const url = `${API_BASE_URL}/api/public-recipes/slug/${encodeURIComponent(slug)}`;

    const response = await fetch(url, {
      next: { revalidate: 60 } // Revalidate every 60 seconds (ISR)
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch recipe: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching public recipe by slug:', error);
    // In Server Components, we might want to throw to trigger error.tsx, 
    // or return null to trigger notFound(). 
    // For now, rethrowing so the caller decides.
    throw error;
  }
}

export interface GenerateImageResponse {
  success: boolean;
  message?: string;
  data?: {
    thumbnail?: string;
    display?: string;
    original?: string;
  };
}

export async function generatePublicRecipeImage(recipeId: string, anonSessionId: string): Promise<GenerateImageResponse> {
  try {
    const url = `${API_BASE_URL}/api/public-recipe-chat/recipes/${recipeId}/generate-image`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ anonSessionId })
    });

    if (!response.ok) {
      throw new Error(`Failed to generate recipe image: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating public recipe image:', error);
    throw error;
  }
}
