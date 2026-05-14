/**
 * @file mealPresetService.js
 * @description Service module for interacting with the Meal Presets API.
 * 
 * This module provides functions to manage meal presets through CRUD operations.
 * It handles authentication, request/response formatting, and error handling.
 * 
 * Key Features:
 * - Token-based authentication with automatic refresh
 * - Centralized API endpoint configuration
 * - Consistent error handling and propagation
 * - Full CRUD operations for meal presets (Create, Read, Read By ID, Update, Delete)
 * 
 * @see PresetSelector.jsx - Primary consumer of these services
 * @see FoodJournal_AI_Analysis.jsx - Consumer for viewing and managing presets
 * @requires ../env-config.js - For API_BASE_URL configuration
 */

import { API_BASE_URL } from '../env-config.js';

// Base API endpoint for meal presets
const MEAL_PRESETS_API = `${API_BASE_URL}/api/meal-presets`;

/**
 * Fetches meal presets, optionally filtered by diet code.
 * @param {string} dietCode - Diet code to filter presets
 * @param {Function} getFreshIdTokenFunc - Auth token getter
 * @returns {Promise<Array>} Array of meal presets
 * @throws {Error} On authentication or API failure
 */
export const getMealPresets = async (dietCode, getFreshIdTokenFunc) => {
  try {
    if (!getFreshIdTokenFunc) {
      console.error("getFreshIdTokenFunc not provided to getMealPresets");
      throw new Error("Authentication utility not available.");
    }
    const token = await getFreshIdTokenFunc();

    const response = await fetch(`${MEAL_PRESETS_API}?dietCode=${dietCode || ''}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `Failed to fetch meal presets. Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching meal presets:', error);
    throw error;
  }
};

/**
 * Creates a new meal preset.
 * @param {Object} presetData - The meal preset data
 * @param {Function} getFreshIdTokenFunc - Auth token getter
 * @returns {Promise<Object>} Created meal preset
 * @throws {Error} On validation or creation failure
 */
export const createMealPreset = async (presetData, getFreshIdTokenFunc) => {
  try {
    if (!getFreshIdTokenFunc) {
      console.error("getFreshIdTokenFunc not provided to createMealPreset");
      throw new Error("Authentication utility not available.");
    }
    const token = await getFreshIdTokenFunc();

    const response = await fetch(MEAL_PRESETS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(presetData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `Failed to create meal preset. Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating meal preset:', error);
    throw error;
  }
};

/**
 * Updates an existing meal preset.
 * @param {string} id - ID of the preset to update
 * @param {Object} presetData - Updated preset data
 * @param {Function} getFreshIdTokenFunc - Auth token getter
 * @returns {Promise<Object>} Updated meal preset
 * @throws {Error} On update failure
 */
export const updateMealPreset = async (id, presetData, getFreshIdTokenFunc) => {
  try {
    if (!getFreshIdTokenFunc) {
      console.error("getFreshIdTokenFunc not provided to updateMealPreset");
      throw new Error("Authentication utility not available.");
    }
    const token = await getFreshIdTokenFunc();

    const response = await fetch(`${MEAL_PRESETS_API}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(presetData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `Failed to update meal preset. Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating meal preset:', error);
    throw error;
  }
};

/**
 * Fetches a single meal preset by its ID.
 * @param {string} id - The ID of the meal preset to fetch.
 * @param {Function} getFreshIdTokenFunc - Auth token getter.
 * @returns {Promise<Object>} The meal preset object.
 * @throws {Error} On authentication or API failure, or if preset not found.
 */
export const getMealPresetById = async (id, getFreshIdTokenFunc) => {
  try {
    if (!getFreshIdTokenFunc) {
      console.error("getFreshIdTokenFunc not provided to getMealPresetById");
      throw new Error("Authentication utility not available.");
    }
    if (!id) {
      console.error("Preset ID not provided to getMealPresetById");
      throw new Error("Preset ID is required.");
    }
    const token = await getFreshIdTokenFunc();

    const response = await fetch(`${MEAL_PRESETS_API}/${id}`, {
      method: 'GET', // Explicitly GET, though default
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (response.status === 404) {
      throw new Error(`Meal preset with ID ${id} not found.`);
    }
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `Failed to fetch meal preset. Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching meal preset with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Deletes a meal preset by ID.
 * @param {string} id - ID of the preset to delete
 * @param {Function} getFreshIdTokenFunc - Auth token getter
 * @returns {Promise<boolean>} True if deletion was successful
 * @throws {Error} On deletion failure
 */
export const deleteMealPreset = async (id, getFreshIdTokenFunc) => {
  try {
    if (!getFreshIdTokenFunc) {
      console.error("getFreshIdTokenFunc not provided to deleteMealPreset");
      throw new Error("Authentication utility not available.");
    }
    const token = await getFreshIdTokenFunc();

    const response = await fetch(`${MEAL_PRESETS_API}/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `Failed to delete meal preset. Status: ${response.status}`);
    }
    return true;
  } catch (error) {
    console.error('Error deleting meal preset:', error);
    throw error;
  }
};