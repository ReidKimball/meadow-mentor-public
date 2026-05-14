import { API_BASE_URL } from "../env-config.js";
import { HttpError } from "../utils/http-errors.js";

const RECIPES_API = `${API_BASE_URL}/api/recipes`;
const PUBLIC_RECIPES_API = `${API_BASE_URL}/api/public-recipes`;
const PUBLIC_RECIPE_CHAT_API = `${API_BASE_URL}/api/public-recipe-chat`;

/**
 * Creates a new recipe card in the backend.
 * @param {object} recipeData - The recipe data to save.
 * @param {function} getFreshIdToken - Function to get a fresh Firebase ID token.
 * @returns {Promise<object>} The saved recipe data.
 * @throws {HttpError} If the request fails.
 */
export const createRecipe = async (recipeData, getFreshIdToken) => {
  try {
    const token = await getFreshIdToken();
    const response = await fetch(RECIPES_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(recipeData),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new HttpError(
        errorBody.message || "Failed to create recipe.",
        response.status,
        errorBody
      );
    }

    const data = await response.json();
    console.log("Recipe service data:", data);
    return data;
  } catch (error) {
    console.error("Error creating recipe:", error);
    throw error;
  }
};

/**
 * Claims any anonymous public Chef Kay adapted recipes for the authenticated user.
 * @param {string} anonSessionId - Anonymous public chat session id.
 * @param {function} getFreshIdToken - Function to get a fresh Firebase ID token.
 * @returns {Promise<object>} Claim response.
 * @throws {HttpError} If the request fails.
 */
export const claimPublicRecipeAdaptations = async (anonSessionId, getFreshIdToken) => {
  try {
    const token = await getFreshIdToken();
    const response = await fetch(`${PUBLIC_RECIPE_CHAT_API}/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ anonSessionId }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new HttpError(
        errorBody.message || 'Failed to claim recipes.',
        response.status,
        errorBody
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error claiming public recipe adaptations:', error);
    throw error;
  }
};

/**
 * Save a recipe to the user's collection by its ID.
 * @param {string} recipeId - The ID of the recipe to save.
 * @param {function} getFreshIdToken - Function to get a fresh Firebase ID token.
 * @param {number} [userRating] - The user's rating for the recipe.
 */
export const saveRecipeById = async (recipeId, getFreshIdToken, userRating) => {
  console.log(
    `--- saveRecipeById service called for recipeId: ${recipeId} with rating: ${userRating} ---`
  );
  try {
    const token = await getFreshIdToken();
    console.log("Fresh token obtained for saveRecipeById.");
    const response = await fetch(`${RECIPES_API}/${recipeId}/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ rating: userRating }),
    });
    console.log("saveRecipeById response status:", response.status);
    if (!response.ok) {
      const errorBody = await response.json();
      console.error("Error body from server:", errorBody);
      throw new HttpError(
        errorBody.message || "Failed to save recipe.",
        response.status,
        errorBody
      );
    }
    const data = await response.json();
    console.log("saveRecipeById response data:", data);
    return data;
  } catch (error) {
    console.error("Error in saveRecipeById service:", error);
    throw error;
  }
};

/**
 * Unsave a recipe from the user's collection by its ID.
 * @param {string} recipeId - The ID of the recipe to unsave.
 * @param {function} getFreshIdToken - Function to get a fresh Firebase ID token.
 */
export const unsaveRecipeById = async (recipeId, getFreshIdToken) => {
  console.log(
    `--- unsaveRecipeById service called for recipeId: ${recipeId} ---`
  );
  try {
    const token = await getFreshIdToken();
    console.log("Fresh token obtained for unsaveRecipeById.");
    const response = await fetch(`${RECIPES_API}/${recipeId}/save`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("unsaveRecipeById response status:", response.status);
    if (!response.ok) {
      const errorBody = await response.json();
      console.error("Error body from server:", errorBody);
      throw new HttpError(
        errorBody.message || "Failed to unsave recipe.",
        response.status,
        errorBody
      );
    }
    const data = await response.json();
    console.log("unsaveRecipeById response data:", data);
    return data;
  } catch (error) {
    console.error("Error in unsaveRecipeById service:", error);
    throw error;
  }
};

/**
 * Toggles the public status of a recipe.
 * @param {string} recipeId - The ID of the recipe to update.
 * @param {function} getFreshIdToken - Function to get a fresh Firebase ID token.
 */
export const toggleRecipePublicStatus = async (recipeId, getFreshIdToken) => {
  console.log(
    `--- toggleRecipePublicStatus service called for recipeId: ${recipeId} ---`
  );
  try {
    const token = await getFreshIdToken();
    const response = await fetch(`${RECIPES_API}/${recipeId}/toggle-public`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const errorBody = await response.json();
      throw new HttpError(
        errorBody.message || "Failed to toggle recipe status.",
        response.status,
        errorBody
      );
    }
    const data = await response.json();
    console.log("toggleRecipePublicStatus response data:", data);
    return data;
  } catch (error) {
    console.error("Error in toggleRecipePublicStatus service:", error);
    throw error;
  }
};

/**
 * Sets the visibility of a recipe to a specific value.
 * @param {string} recipeId - The ID of the recipe to update.
 * @param {'private'|'unlisted'|'public'} visibility - The visibility to set.
 * @param {function} getFreshIdToken - Function to get a fresh Firebase ID token.
 * @returns {Promise<object>} The updated recipe data.
 */
export const setRecipeVisibility = async (recipeId, visibility, getFreshIdToken) => {
  console.log(
    `--- setRecipeVisibility service called for recipeId: ${recipeId}, visibility: ${visibility} ---`
  );
  try {
    const token = await getFreshIdToken();
    const response = await fetch(`${RECIPES_API}/${recipeId}/toggle-public`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ visibility }),
    });
    if (!response.ok) {
      const errorBody = await response.json();
      throw new HttpError(
        errorBody.message || "Failed to update recipe visibility.",
        response.status,
        errorBody
      );
    }
    const data = await response.json();
    console.log("setRecipeVisibility response data:", data);
    return data;
  } catch (error) {
    console.error("Error in setRecipeVisibility service:", error);
    throw error;
  }
};

/**
 * Fetches all saved recipes for the current user.
 * @param {function} getFreshIdToken - Function to get a fresh Firebase ID token.
 * @returns {Promise<Array>} A list of saved recipes.
 */
export const getSavedRecipes = async (getFreshIdToken) => {
  try {
    const token = await getFreshIdToken();
    const response = await fetch(`${RECIPES_API}/saved`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new HttpError(
        errorBody.message || "Failed to fetch saved recipes.",
        response.status,
        errorBody
      );
    }

    const responseData = await response.json();
    // The API returns { success, count, data }, we just need the data array.
    return responseData.data;
  } catch (error) {
    console.error("Error fetching saved recipes:", error);
    throw error;
  }
};

/**
 * Fetches a recipe by its ID.
 * @param {string} recipeId - The ID of the recipe to fetch.
 * @param {function} getFreshIdToken - Function to get a fresh Firebase ID token.
 * @returns {Promise<object>} The recipe data.
 * @throws {HttpError} If the request fails.
 */
export const getRecipeById = async (recipeId, getFreshIdToken) => {
  try {
    console.log('[recipeService] Fetching recipe by ID:', recipeId);
    const token = await getFreshIdToken();
    const response = await fetch(`${RECIPES_API}/${recipeId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new HttpError(
        errorBody.message || "Failed to fetch recipe.",
        response.status,
        errorBody
      );
    }

    const data = await response.json();
    console.log('[recipeService] Recipe fetched successfully');
    return data;
  } catch (error) {
    console.error(`Error fetching recipe with ID ${recipeId}:`, error);
    throw error;
  }
};

/**
 * Fetches a single recipe by its slug, using an authenticated endpoint.
 * This can fetch both public and private recipes the user has access to.
 * @param {string} slug - The slug of the recipe to fetch.
 * @param {function} getFreshIdToken - Function to get a fresh Firebase ID token.
 * @returns {Promise<object>} The recipe data.
 * @throws {HttpError} If the request fails.
 */
export const getRecipeBySlug = async (slug, getFreshIdToken) => {
  try {
    const token = await getFreshIdToken();
    const response = await fetch(`${RECIPES_API}/slug/${slug}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new HttpError(
        errorBody.message || "Failed to fetch recipe.",
        response.status,
        errorBody
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching recipe with slug ${slug}:`, error);
    throw error;
  }
};

/**
 * Fetches all public recipes, with an option to filter by diet.
 * @param {string} [diet] - Optional diet code to filter recipes.
 * @returns {Promise<object>} A promise that resolves to an object containing the success status and data or an error message.
 */
export const getPublicRecipes = async (diet) => {
  try {
    let url = `${API_BASE_URL}/api/public-recipes`;
    if (diet && diet !== "All") {
      url += `?diet=${encodeURIComponent(diet)}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in getPublicRecipes:", error);
    throw error;
  }
};

/**
 * Fetches a single public recipe by its slug.
 * @param {string} slug - The slug of the recipe to fetch.
 * @returns {Promise<object>} The recipe data.
 * @throws {HttpError} If the request fails.
 */
export const getPublicRecipeBySlug = async (slug) => {
  try {
    const response = await fetch(`${PUBLIC_RECIPES_API}/slug/${slug}`);

    if (!response.ok) {
      const errorBody = await response.json();
      throw new HttpError(
        errorBody.message || "Failed to fetch public recipe.",
        response.status,
        errorBody
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching public recipe with slug ${slug}:`, error);
    throw error;
  }
};

/**
 * Fetches the 5 most recent public recipes, optionally filtered by diet.
 * @param {string} [diet='All'] - The diet to filter by. Defaults to 'All'.
 * @returns {Promise<Object>} The response data from the API.
 */
export const getRecentPublicRecipes = async (diet = "All") => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/public-recipes/recent?diet=${diet}`
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching recent public recipes:", error);
    throw error;
  }
};

/**
 * Fetches all recipes generated by the current user.
 * @param {function} getFreshIdToken - Function to get a fresh Firebase ID token.
 * @returns {Promise<Array>} A list of generated recipes.
 */
export const getGeneratedRecipes = async (getFreshIdToken) => {
  try {
    const token = await getFreshIdToken();
    const response = await fetch(`${RECIPES_API}/generated`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new HttpError(
        errorBody.message || "Failed to fetch generated recipes.",
        response.status,
        errorBody
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching generated recipes:", error);
    throw error;
  }
};

/**
 * Uploads a cover image for a specific recipe.
 * @param {string} recipeId - The ID of the recipe.
 * @param {File} imageFile - The image file to upload.
 * @param {function} getFreshIdToken - Function to get a fresh Firebase ID token.
 * @returns {Promise<object>} The response from the server, including the new image URL.
 * @throws {HttpError} If the request fails.
 */
export const uploadRecipeImage = async (
  recipeId,
  imageFile,
  getFreshIdToken
) => {
  try {
    const token = await getFreshIdToken();
    const formData = new FormData();
    formData.append("recipeImage", imageFile);

    const response = await fetch(`${RECIPES_API}/${recipeId}/image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // 'Content-Type' is not needed; the browser sets it with the correct boundary for FormData
      },
      body: formData,
    });

    if (!response.ok) {
      throw new HttpError(response.status, "Failed to upload recipe image");
    }
    return response.json();
  } catch (error) {
    console.error("Error in uploadRecipeImage service:", error);
    throw error;
  }
};

/**
 * Gets all image versions for a specific recipe.
 * @param {string} recipeId - The ID of the recipe.
 * @param {Function} getFreshIdToken - Function to get a fresh Firebase ID token.
 * @returns {Promise<Object>} The server response containing the list of images.
 */
export const getRecipeImageVersions = async (recipeId, getFreshIdToken) => {
  try {
    const token = await getFreshIdToken();
    const response = await fetch(
      `${API_BASE_URL}/api/recipes/${recipeId}/images`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new HttpError(
        response.status,
        "Failed to fetch recipe image versions"
      );
    }

    return response.json();
  } catch (error) {
    console.error("Error in getRecipeImageVersions service:", error);
    throw error;
  }
};

/**
 * Deletes a specific image for a recipe.
 * @param {string} recipeId - The ID of the recipe.
 * @param {string} imageName - The full GCS object name of the image to delete.
 * @param {Function} getFreshIdToken - Function to get a fresh Firebase ID token.
 * @returns {Promise<Object>} The server response.
 */
export const deleteRecipeImage = async (
  recipeId,
  imageName,
  getFreshIdToken
) => {
  try {
    const token = await getFreshIdToken();
    const response = await fetch(
      `${API_BASE_URL}/api/recipes/${recipeId}/images`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageName }),
      }
    );

    if (!response.ok) {
      throw new HttpError(response.status, "Failed to delete recipe image");
    }

    return response.json();
  } catch (error) {
    console.error("Error in deleteRecipeImage service:", error);
    throw error;
  }
};

/**
 * Sets a specific image as the recipe's cover image.
 * @param {string} recipeId - The ID of the recipe.
 * @param {string} imageName - The full GCS object name of the thumbnail image to set as cover.
 * @param {Function} getFreshIdToken - Function to get a fresh Firebase ID token.
 * @returns {Promise<Object>} The server response containing the new image URLs.
 */
export const setRecipeCoverImage = async (
  recipeId,
  imageName,
  getFreshIdToken
) => {
  try {
    const token = await getFreshIdToken();
    const response = await fetch(`/api/recipes/${recipeId}/images/cover`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ imageName }),
    });

    if (!response.ok) {
      throw new HttpError(response.status, "Failed to set cover image");
    }

    return response.json();
  } catch (error) {
    console.error("Error in setRecipeCoverImage service:", error);
    throw error;
  }
};

/**
 * Rotates a specific image for a recipe.
 * @param {string} recipeId - The ID of the recipe.
 * @param {string} imageName - The full GCS object name of the image to rotate.
 * @param {Function} getFreshIdToken - Function to get a fresh Firebase ID token.
 * @returns {Promise<Object>} The server response.
 */
export const rotateRecipeImage = async (
  recipeId,
  imageName,
  getFreshIdToken
) => {
  try {
    const token = await getFreshIdToken();
    const response = await fetch(`${RECIPES_API}/${recipeId}/image/rotate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ imageName }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new HttpError(
        errorBody.message || "Failed to rotate recipe image.",
        response.status,
        errorBody
      );
    }

    return response.json();
  } catch (error) {
    console.error("Error in rotateRecipeImage service:", error);
    throw error;
  }
};

/**
 * Updates the ingredients of a recipe.
 * @param {string} recipeId - The ID of the recipe to update.
 * @param {Array} ingredients - The updated ingredients array.
 * @param {function} getFreshIdToken - Function to get a fresh Firebase ID token.
 * @returns {Promise<object>} The updated recipe data.
 * @throws {HttpError} If the request fails.
 */
export const updateRecipeIngredients = async (
  recipeId,
  ingredients,
  getFreshIdToken
) => {
  try {
    const token = await getFreshIdToken();
    const response = await fetch(`${RECIPES_API}/${recipeId}/ingredients`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ingredients }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new HttpError(
        errorBody.message || "Failed to update recipe ingredients.",
        response.status,
        errorBody
      );
    }

    return response.json();
  } catch (error) {
    console.error("Error in updateRecipeIngredients service:", error);
    throw error;
  }
};

/**
 * Updates the steps of a recipe.
 * @param {string} recipeId - The ID of the recipe to update.
 * @param {Array} steps - The updated steps array.
 * @param {function} getFreshIdToken - Function to get a fresh Firebase ID token.
 * @returns {Promise<object>} The updated recipe data.
 * @throws {HttpError} If the request fails.
 */
export const updateRecipeSteps = async (recipeId, steps, getFreshIdToken) => {
  try {
    const token = await getFreshIdToken();
    const response = await fetch(`${RECIPES_API}/${recipeId}/steps`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ steps }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update recipe steps");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating recipe steps:", error);
    throw error;
  }
};

/**
 * Duplicates a recipe with a new title.
 * @param {string} recipeId - The ID of the recipe to duplicate.
 * @param {string} newTitle - The new title for the duplicated recipe.
 * @param {function} getFreshIdToken - Function to get a fresh Firebase ID token.
 * @returns {Promise<object>} The duplicated recipe data.
 * @throws {HttpError} If the request fails.
 */
export const duplicateRecipe = async (recipeId, newTitle, getFreshIdToken) => {
  console.log(`--- duplicateRecipe service called for recipeId: ${recipeId} with new title: ${newTitle} ---`);
  try {
    const token = await getFreshIdToken();
    const response = await fetch(`${RECIPES_API}/${recipeId}/duplicate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ newTitle }),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error("Error body from server:", errorBody);
      throw new HttpError(
        errorBody.message || "Failed to duplicate recipe.",
        response.status,
        errorBody
      );
    }

    const data = await response.json();
    console.log("duplicateRecipe response data:", data);
    return data;
  } catch (error) {
    console.error("Error in duplicateRecipe service:", error);
    throw error;
  }
};

/**
 * Triggers the generation of an AI image for a recipe.
 * @param {string} recipeId - The ID of the recipe.
 * @param {function} getFreshIdToken - Function to get a fresh Firebase ID token.
 * @returns {Promise<object>} The server response containing the new image URLs.
 */
export const generateRecipeImage = async (recipeId, getFreshIdToken) => {
  try {
    const token = await getFreshIdToken();
    console.log('[recipeService] Requesting image generation for recipe:', recipeId);
    const response = await fetch(`${RECIPES_API}/${recipeId}/generate-image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
        const errorBody = await response.json();
        console.error('[recipeService] Image generation failed:', {
          recipeId,
          status: response.status,
          errorBody,
        });
        throw new HttpError(
            errorBody.message || "Failed to generate recipe image.",
            response.status,
            errorBody
        );
    }
    const data = await response.json();
    console.log('[recipeService] Image generation response:', data);
    return data;
  } catch (error) {
    console.error("Error in generateRecipeImage service:", error);
    throw error;
  }
};
