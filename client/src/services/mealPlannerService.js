// mealPlannerService.js

/**
 * Service for interacting with the Meal Planner API
 */

import { API_BASE_URL } from '../env-config';

/**
 * Generates a new meal plan TEMPLATE (no longer requires startDate)
 * @param {Function} getFreshIdTokenFunc - Function to get a fresh Firebase ID token
 * @param {Object} settings - Meal plan settings
 * @param {number} settings.planDuration - Number of days (1-14)
 * @param {Object} settings.includedMealTypes - Which meal types to include
 * @param {string} settings.dynamicPreferences - Optional special requests
 * @returns {Promise<Object>} The generated meal plan template
 */
export const generateMealPlan = async (getFreshIdTokenFunc, settings, options = {}) => {
  try {
    console.log('[mealPlannerService] Generating meal plan template...');
    console.log('Settings:', settings);
    console.log('Options:', options);
    console.log('Creating template (no specific dates)');

    const token = await getFreshIdTokenFunc();

    const response = await fetch(`${API_BASE_URL}/api/meal-planner/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        apiService: 'mealPlanner',
        settings,
        ...options
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[mealPlannerService] Error response:', errorData);
      throw new Error(errorData.error || 'Failed to generate meal plan');
    }

    const data = await response.json();
    console.log('[mealPlannerService] Meal plan generated successfully');
    return data;
  } catch (error) {
    console.error('[mealPlannerService] Error generating meal plan:', error);
    throw error;
  }
};

/**
 * Admin-only: Checks whether a meal plan contains any non-public recipes.
 * @param {Function} getFreshIdTokenFunc - Function to get a fresh Firebase ID token
 * @param {string} planId - The meal plan ID
 * @returns {Promise<Object>} Publish readiness info
 */
export const getMealPlanPublishCheck = async (getFreshIdTokenFunc, planId) => {
  try {
    const token = await getFreshIdTokenFunc();
    const response = await fetch(
      `${API_BASE_URL}/api/meal-planner/${planId}/publish-check`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to check meal plan publish readiness');
    }

    return response.json();
  } catch (error) {
    console.error('[mealPlannerService] Error checking meal plan publish readiness:', error);
    throw error;
  }
};

/**
 * Admin-only: Publishes a meal plan as public or unlisted.
 * @param {Function} getFreshIdTokenFunc - Function to get a fresh Firebase ID token
 * @param {string} planId - The meal plan ID
 * @param {Object} payload - Publish payload
 * @param {'public'|'unlisted'} payload.visibility - Target visibility
 * @param {string} payload.slug - Slug to use
 * @param {boolean} payload.makeRecipesPublic - If true, makes contained recipes public
 * @returns {Promise<Object>} Updated meal plan
 */
export const publishMealPlan = async (getFreshIdTokenFunc, planId, payload) => {
  try {
    const token = await getFreshIdTokenFunc();
    const response = await fetch(`${API_BASE_URL}/api/meal-planner/${planId}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to publish meal plan');
    }

    return response.json();
  } catch (error) {
    console.error('[mealPlannerService] Error publishing meal plan:', error);
    throw error;
  }
};

/**
 * Gets all meal plans for the authenticated user
 * @param {Function} getFreshIdTokenFunc - Function to get a fresh Firebase ID token
 * @returns {Promise<Object[]>} Array of meal plans
 */
export const getMealPlans = async (getFreshIdTokenFunc) => {
  try {
    console.log('[mealPlannerService] Fetching meal plans...');

    const token = await getFreshIdTokenFunc();

    const response = await fetch(`${API_BASE_URL}/api/meal-planner`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[mealPlannerService] Error response:', errorData);
      throw new Error(errorData.error || 'Failed to fetch meal plans');
    }

    const data = await response.json();
    console.log('[mealPlannerService] Meal plans fetched successfully');
    return data.mealPlans;
  } catch (error) {
    console.error('[mealPlannerService] Error fetching meal plans:', error);
    throw error;
  }
};

/**
 * Gets a specific meal plan by ID
 * @param {Function} getFreshIdTokenFunc - Function to get a fresh Firebase ID token
 * @param {string} planId - The meal plan ID
 * @returns {Promise<Object>} The meal plan
 */
export const getMealPlanById = async (getFreshIdTokenFunc, planId) => {
  try {
    console.log('[mealPlannerService] Fetching meal plan:', planId);

    const token = await getFreshIdTokenFunc();

    const response = await fetch(`${API_BASE_URL}/api/meal-planner/${planId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[mealPlannerService] Error response:', errorData);
      throw new Error(errorData.error || 'Failed to fetch meal plan');
    }

    const data = await response.json();
    console.log('[mealPlannerService] Meal plan fetched successfully');
    return data;
  } catch (error) {
    console.error('[mealPlannerService] Error fetching meal plan:', error);
    throw error;
  }
};

/**
 * Deletes a meal plan by ID
 * @param {Function} getFreshIdTokenFunc - Function to get a fresh Firebase ID token
 * @param {string} planId - The meal plan ID
 * @returns {Promise<Object>} Success response
 */
export const deleteMealPlan = async (getFreshIdTokenFunc, planId) => {
  try {
    console.log('[mealPlannerService] Deleting meal plan:', planId);

    const token = await getFreshIdTokenFunc();

    const response = await fetch(`${API_BASE_URL}/api/meal-planner/${planId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[mealPlannerService] Error response:', errorData);
      throw new Error(errorData.error || 'Failed to delete meal plan');
    }

    const data = await response.json();
    console.log('[mealPlannerService] Meal plan deleted successfully');
    return data;
  } catch (error) {
    console.error('[mealPlannerService] Error deleting meal plan:', error);
    throw error;
  }
};

/**
 * Updates a meal plan
 * @param {Function} getFreshIdTokenFunc - Function to get a fresh Firebase ID token
 * @param {string} planId - The meal plan ID
 * @param {Object} updates - The updates to apply
 * @returns {Promise<Object>} Success response
 */
export const updateMealPlan = async (getFreshIdTokenFunc, planId, updates) => {
  try {
    console.log('[mealPlannerService] Updating meal plan:', planId);
    console.log('Updates:', updates);

    const token = await getFreshIdTokenFunc();

    const response = await fetch(`${API_BASE_URL}/api/meal-planner/${planId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[mealPlannerService] Error response:', errorData);
      throw new Error(errorData.error || 'Failed to update meal plan');
    }

    const data = await response.json();
    console.log('[mealPlannerService] Meal plan updated successfully');
    return data;
  } catch (error) {
    console.error('[mealPlannerService] Error updating meal plan:', error);
    throw error;
  }
};

/**
 * Generates a placeholder meal idea for an empty meal slot
 * @param {Function} getFreshIdTokenFunc - Function to get a fresh Firebase ID token
 * @param {string} planId - The meal plan ID
 * @param {number} dayIndex - The index of the day in the meal plan
 * @param {string} mealType - The meal type (breakfast, lunch, dinner, snack)
 * @returns {Promise<Object>} The generated placeholder meal
 */
export const generatePlaceholderIdea = async (getFreshIdTokenFunc, planId, dayIndex, mealType) => {
  try {
    console.log('[mealPlannerService] Generating placeholder meal idea');
    console.log('Plan ID:', planId);
    console.log('Day Index:', dayIndex);
    console.log('Meal Type:', mealType);

    const token = await getFreshIdTokenFunc();

    const response = await fetch(`${API_BASE_URL}/api/meal-planner/${planId}/generate-placeholder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        apiService: 'mealPlanner',
        dayIndex,
        mealType,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[mealPlannerService] Error response:', errorData);
      throw new Error(errorData.error || 'Failed to generate placeholder idea');
    }

    const data = await response.json();
    console.log('[mealPlannerService] Placeholder idea generated successfully');
    return data;
  } catch (error) {
    console.error('[mealPlannerService] Error generating placeholder idea:', error);
    throw error;
  }
};

/**
 * Generates a full recipe from a placeholder meal
 * @param {Function} getFreshIdTokenFunc - Function to get a fresh Firebase ID token
 * @param {string} planId - The meal plan ID
 * @param {number} dayIndex - The index of the day in the meal plan
 * @param {string} mealType - The meal type (breakfast, lunch, dinner, snack)
 * @returns {Promise<Object>} The generated recipe
 */
export const generatePlaceholderRecipe = async (getFreshIdTokenFunc, planId, dayIndex, mealType, options = {}) => {
  try {
    console.log('[mealPlannerService] Generating recipe for placeholder');
    console.log('Plan ID:', planId);
    console.log('Day Index:', dayIndex);
    console.log('Meal Type:', mealType);
    console.log('Options:', options);

    const token = await getFreshIdTokenFunc();

    const response = await fetch(`${API_BASE_URL}/api/meal-planner/${planId}/generate-recipe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        apiService: 'mealPlanner',
        dayIndex,
        mealType,
        ...options
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[mealPlannerService] Error response:', errorData);
      throw new Error(errorData.error || 'Failed to generate recipe');
    }

    const data = await response.json();
    console.log('[mealPlannerService] Recipe generated successfully');
    return data;
  } catch (error) {
    console.error('[mealPlannerService] Error generating recipe:', error);
    throw error;
  }
};

/**
 * Saves meal plan settings to user profile
 * @param {Function} getFreshIdTokenFunc - Function to get a fresh Firebase ID token
 * @param {Object} settings - The settings object to save
 * @returns {Promise<Object>} Success response with saved settings
 */
export const saveMealPlanSettings = async (getFreshIdTokenFunc, settings) => {
  try {
    console.log('[mealPlannerService] Saving meal plan settings');
    console.log('Settings:', settings);

    const token = await getFreshIdTokenFunc();

    const response = await fetch(`${API_BASE_URL}/api/meal-planner/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ settings }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[mealPlannerService] Error response:', errorData);
      throw new Error(errorData.error || 'Failed to save settings');
    }

    const data = await response.json();
    console.log('[mealPlannerService] Settings saved successfully');
    return data;
  } catch (error) {
    console.error('[mealPlannerService] Error saving settings:', error);
    throw error;
  }
};

/**
 * Gets meal plan settings from user profile
 * @param {Function} getFreshIdTokenFunc - Function to get a fresh Firebase ID token
 * @returns {Promise<Object>} The user's meal plan settings
 */
export const getMealPlanSettings = async (getFreshIdTokenFunc) => {
  try {
    console.log('[mealPlannerService] Fetching meal plan settings');

    const token = await getFreshIdTokenFunc();

    const response = await fetch(`${API_BASE_URL}/api/meal-planner/settings`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[mealPlannerService] Error response:', errorData);
      throw new Error(errorData.error || 'Failed to fetch settings');
    }

    const data = await response.json();
    console.log('[mealPlannerService] Settings fetched successfully');
    return data.settings;
  } catch (error) {
    console.error('[mealPlannerService] Error fetching settings:', error);
    throw error;
  }
};

/**
 * DEPRECATED: Use assignMealPlan instead
 * @deprecated Use assignMealPlan to assign a template to specific dates
 */
export const activateMealPlan = async (getFreshIdTokenFunc, planId) => {
  console.warn('[mealPlannerService] activateMealPlan is DEPRECATED - use assignMealPlan instead');
  throw new Error('activateMealPlan is deprecated. Use assignMealPlan instead.');
};

/**
 * Assigns a meal plan template to specific dates
 * @param {Function} getFreshIdTokenFunc - Function to get a fresh Firebase ID token
 * @param {string} planId - The meal plan template ID to assign
 * @param {Date} startDate - The start date for the assignment
 * @param {boolean} makeActive - Whether to make this assignment active (default: true)
 * @returns {Promise<Object>} The assignment and updated meal plan
 */
export const assignMealPlan = async (getFreshIdTokenFunc, planId, startDate, makeActive = true) => {
  try {
    console.log('[mealPlannerService] Assigning meal plan template:', planId);
    console.log('Start date:', startDate);
    console.log('Make active:', makeActive);

    const token = await getFreshIdTokenFunc();

    const response = await fetch(`${API_BASE_URL}/api/meal-planner/${planId}/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        startDate: startDate instanceof Date ? startDate.toISOString() : startDate,
        makeActive,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[mealPlannerService] Error response:', errorData);
      throw new Error(errorData.error || 'Failed to assign meal plan');
    }

    const data = await response.json();
    console.log('[mealPlannerService] Meal plan assigned successfully');
    return data;
  } catch (error) {
    console.error('[mealPlannerService] Error assigning meal plan:', error);
    throw error;
  }
};

/**
 * Checks for overlapping active meal plans
 * @param {Function} getFreshIdTokenFunc - Function to get a fresh Firebase ID token
 * @param {Date} startDate - Start date of the new plan
 * @param {Date} endDate - End date of the new plan
 * @returns {Promise<Object>} Conflict information
 */
export const checkMealPlanConflicts = async (getFreshIdTokenFunc, startDate, endDate) => {
  try {
    console.log('[mealPlannerService] Checking for conflicts');
    console.log('Date range:', startDate, 'to', endDate);

    const token = await getFreshIdTokenFunc();

    const response = await fetch(`${API_BASE_URL}/api/meal-planner/check-conflicts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ startDate, endDate }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[mealPlannerService] Error response:', errorData);
      throw new Error(errorData.error || 'Failed to check conflicts');
    }

    const data = await response.json();
    console.log('[mealPlannerService] Conflict check complete');
    return data;
  } catch (error) {
    console.error('[mealPlannerService] Error checking conflicts:', error);
    throw error;
  }
};

/**
 * Gets the active meal plan for a specific date
 * @param {Function} getFreshIdTokenFunc - Function to get a fresh Firebase ID token
 * @param {Date} date - The date to get the active plan for
 * @returns {Promise<Object|null>} The active meal plan or null
 */
export const getActivePlanForDate = async (getFreshIdTokenFunc, date) => {
  try {
    console.log('[mealPlannerService] Getting active plan for date:', date);

    const token = await getFreshIdTokenFunc();

    const response = await fetch(`${API_BASE_URL}/api/meal-planner/active?date=${date.toISOString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[mealPlannerService] Error response:', errorData);
      throw new Error(errorData.error || 'Failed to get active plan');
    }

    const data = await response.json();
    console.log('[mealPlannerService] Active plan retrieved');
    return data.mealPlan;
  } catch (error) {
    console.error('[mealPlannerService] Error getting active plan:', error);
    throw error;
  }
};

/**
 * Duplicates a meal plan template (creates a new template, no dates)
 * @param {Function} getFreshIdTokenFunc - Function to get a fresh Firebase ID token
 * @param {string} planId - The meal plan template ID to duplicate
 * @returns {Promise<Object>} The duplicated meal plan template
 */
export const duplicateMealPlan = async (getFreshIdTokenFunc, planId) => {
  try {
    console.log('[mealPlannerService] Duplicating meal plan template:', planId);

    const token = await getFreshIdTokenFunc();

    const response = await fetch(`${API_BASE_URL}/api/meal-planner/${planId}/duplicate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[mealPlannerService] Error response:', errorData);
      throw new Error(errorData.error || 'Failed to duplicate meal plan');
    }

    const data = await response.json();
    console.log('[mealPlannerService] Meal plan template duplicated successfully');
    return data.mealPlan;
  } catch (error) {
    console.error('[mealPlannerService] Error duplicating meal plan:', error);
    throw error;
  }
};

/**
 * Generates a surprise meal (random recipe or AI placeholder)
 * @param {Function} getFreshIdTokenFunc - Function to get a fresh Firebase ID token
 * @param {string} planId - The meal plan ID
 * @param {number} dayIndex - The index of the day in the meal plan
 * @param {string} mealType - The meal type (breakfast, lunch, dinner, snack)
 * @returns {Promise<Object>} The generated meal
 */
export const generateSurpriseMeal = async (getFreshIdTokenFunc, planId, dayIndex, mealType) => {
  try {
    console.log('[mealPlannerService] Generating surprise meal');
    console.log('Plan ID:', planId);
    console.log('Day Index:', dayIndex);
    console.log('Meal Type:', mealType);

    const token = await getFreshIdTokenFunc();

    const response = await fetch(`${API_BASE_URL}/api/meal-planner/${planId}/surprise-me`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        apiService: 'mealPlanner',
        dayIndex,
        mealType,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[mealPlannerService] Error response:', errorData);
      throw new Error(errorData.error || 'Failed to generate surprise meal');
    }

    const data = await response.json();
    console.log('[mealPlannerService] Surprise meal generated successfully');
    return data;
  } catch (error) {
    console.error('[mealPlannerService] Error generating surprise meal:', error);
    throw error;
  }
};

/**
 * Unassigns (deactivates) the active meal plan for a specific date
 * @param {Function} getFreshIdTokenFunc - Function to get a fresh Firebase ID token
 * @param {Date} date - The date to unassign
 * @returns {Promise<Object>} The deactivated assignment
 */
export const unassignMealPlanForDate = async (getFreshIdTokenFunc, date) => {
  try {
    console.log('[mealPlannerService] Unassigning meal plan for date:', date);

    const token = await getFreshIdTokenFunc();
    const dateString = date.toISOString();

    const response = await fetch(`${API_BASE_URL}/api/meal-planner/active?date=${dateString}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[mealPlannerService] Error response:', errorData);
      throw new Error(errorData.error || 'Failed to unassign meal plan');
    }

    const data = await response.json();
    console.log('[mealPlannerService] Meal plan unassigned successfully');
    return data;
  } catch (error) {
    console.error('[mealPlannerService] Error unassigning meal plan:', error);
    throw error;
  }
};
