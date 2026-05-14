import { HttpError } from "../utils/http-errors.js";

// Determine API base URL: use env var if set, otherwise fall back to current origin. This fixes mobile devices that cannot reach localhost.
import { API_BASE_URL } from "../env-config.js";
const SHOPPING_LIST_API_URL = `${API_BASE_URL}/api/shopping-list`;

/**
 * Fetches the user's shopping list.
 * @param {Function} getFreshIdTokenFunc - Function to get a fresh Firebase ID token.
 * @returns {Promise<Object>} The user's shopping list.
 */
export const getShoppingList = async (getFreshIdTokenFunc) => {
  console.log('*** SHOPPING_LIST_API_URL:', SHOPPING_LIST_API_URL);
  const token = await getFreshIdTokenFunc();
  const response = await fetch(SHOPPING_LIST_API_URL, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Failed to fetch shopping list:', errorData);
    throw new HttpError(errorData.message || 'Failed to fetch shopping list', response.status, errorData);
  }
  return response.json();
};

/**
 * Adds ingredients to the user's shopping list.
 * @param {Array<Object>} ingredients - The ingredients to add.
 * @param {Function} getFreshIdTokenFunc - Function to get a fresh Firebase ID token.
 * @returns {Promise<Object>} The updated shopping list.
 */
export const addIngredients = async (ingredients, getFreshIdTokenFunc) => {
  const token = await getFreshIdTokenFunc();
  const response = await fetch(`${SHOPPING_LIST_API_URL}/ingredients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ ingredients }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Failed to add ingredients:', errorData);
    throw new HttpError(errorData.message || 'Failed to add ingredients', response.status, errorData);
  }
  return response.json();
};

/**
 * Updates a specific ingredient in the shopping list.
 * @param {string} ingredientId - The ID of the ingredient to update.
 * @param {Object} updates - The updates to apply to the ingredient.
 * @param {Function} getFreshIdTokenFunc - Function to get a fresh Firebase ID token.
 * @returns {Promise<Object>} The updated shopping list.
 */
export const updateIngredient = async (ingredientId, updates, getFreshIdTokenFunc) => {
  const token = await getFreshIdTokenFunc();
  const response = await fetch(`${SHOPPING_LIST_API_URL}/ingredients/${ingredientId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Failed to update ingredient:', errorData);
    throw new HttpError(errorData.message || 'Failed to update ingredient', response.status, errorData);
  }
  return response.json();
};

/**
 * Deletes an ingredient from the shopping list.
 * @param {string} ingredientId - The ID of the ingredient to delete.
 * @param {Function} getFreshIdTokenFunc - Function to get a fresh Firebase ID token.
 * @returns {Promise<Object>} The updated shopping list.
 */
export const deleteIngredient = async (ingredientId, getFreshIdTokenFunc) => {
  const token = await getFreshIdTokenFunc();
  const response = await fetch(`${SHOPPING_LIST_API_URL}/ingredients/${ingredientId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Failed to delete ingredient:', errorData);
    throw new HttpError(errorData.message || 'Failed to delete ingredient', response.status, errorData);
  }
  return response.json();
};

/**
 * Removes all checked ingredients from the shopping list.
 * @param {Function} getFreshIdTokenFunc - Function to get a fresh Firebase ID token.
 * @returns {Promise<Object>} The updated shopping list.
 */
export const clearCheckedIngredients = async (getFreshIdTokenFunc) => {
  const token = await getFreshIdTokenFunc();
  const response = await fetch(`${SHOPPING_LIST_API_URL}/clear-checked`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Failed to clear checked ingredients:', errorData);
    throw new HttpError(errorData.message || 'Failed to clear checked ingredients', response.status, errorData);
  }
  return response.json();
};
