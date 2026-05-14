/**
 * @file bowelMovementService.js
 * @description Service for Bowel Movement (BM) logging API calls.
 */

import { API_BASE_URL } from '../env-config.js';

/**
 * Creates a new bowel movement entry.
 * @param {object} bmData - The BM data to create.
 * @param {Function} getFreshIdTokenFunc - Function to get a fresh Firebase ID token.
 * @param {string} idempotencyKey - Unique key to prevent duplicates.
 * @returns {Promise<object>} The created BM entry.
 */
export const createBowelMovement = async (bmData, getFreshIdTokenFunc, idempotencyKey) => {
  const API_URL = `${API_BASE_URL}/api/bowel-movements`;
  try {
    const token = await getFreshIdTokenFunc();
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(bmData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to create bowel movement entry');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating bowel movement:', error);
    throw error;
  }
};

/**
 * Lists bowel movement entries with optional filtering.
 * @param {object} filters - Query filters (start, end, bristol_type, etc.)
 * @param {Function} getFreshIdTokenFunc - Function to get a fresh Firebase ID token.
 * @returns {Promise<object>} List of BM entries.
 */
export const listBowelMovements = async (filters = {}, getFreshIdTokenFunc) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });

  const API_URL = `${API_BASE_URL}/api/bowel-movements?${params.toString()}`;
  try {
    const token = await getFreshIdTokenFunc();
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to fetch bowel movements');
    }

    return await response.json();
  } catch (error) {
    console.error('Error listing bowel movements:', error);
    throw error;
  }
};

/**
 * Updates an existing bowel movement entry.
 * @param {string} id - The entry ID.
 * @param {object} updateData - Data to update.
 * @param {Function} getFreshIdTokenFunc - Function to get a fresh Firebase ID token.
 * @returns {Promise<object>} The updated entry.
 */
export const updateBowelMovement = async (id, updateData, getFreshIdTokenFunc) => {
  const API_URL = `${API_BASE_URL}/api/bowel-movements/${id}`;
  try {
    const token = await getFreshIdTokenFunc();
    const response = await fetch(API_URL, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to update bowel movement');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating bowel movement:', error);
    throw error;
  }
};

/**
 * Deletes a bowel movement entry.
 * @param {string} id - The entry ID.
 * @param {Function} getFreshIdTokenFunc - Function to get a fresh Firebase ID token.
 * @returns {Promise<object>} Success message.
 */
export const deleteBowelMovement = async (id, getFreshIdTokenFunc) => {
  const API_URL = `${API_BASE_URL}/api/bowel-movements/${id}`;
  try {
    const token = await getFreshIdTokenFunc();
    const response = await fetch(API_URL, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to delete bowel movement');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting bowel movement:', error);
    throw error;
  }
};

const bowelMovementService = {
  createBowelMovement,
  listBowelMovements,
  updateBowelMovement,
  deleteBowelMovement,
};

export default bowelMovementService;
