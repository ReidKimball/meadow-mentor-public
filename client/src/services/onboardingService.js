import { API_BASE_URL } from '../env-config.js';

/**
 * Fetches the user's pre-generated first healing meal recipe.
 * @param {string} token - The Firebase auth token for the user.
 * @returns {Promise<Object>} A promise that resolves to the API response data, including the recipe and a welcome message.
 */
export const getFirstHealingMeal = async (token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/onboarding/first-healing-meal`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch first healing meal.');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in getFirstHealingMeal service:', error);
    throw error;
  }
};

/**
 * Marks the first healing meal onboarding step as complete for the user.
 * @param {string} token - The Firebase auth token for the user.
 * @returns {Promise<Object>} A promise that resolves to the API response data.
 */
export const completeFirstHealingMeal = async (getFreshIdTokenFunc) => {
  try {
    const token = typeof getFreshIdTokenFunc === 'function' 
      ? await getFreshIdTokenFunc() 
      : getFreshIdTokenFunc;

    const response = await fetch(`${API_BASE_URL}/api/onboarding/first-healing-meal/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to complete first healing meal step.');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in completeFirstHealingMeal service:', error);
    throw error;
  }
};

/**
 * @desc    Notifies the backend that the user has skipped the Quick Start guide.
 * @param   {Function} getFreshIdTokenFunc - Function to get a fresh Firebase ID token.
 * @returns {Promise<Object>} The response data from the server.
 */
export const skipQuickStart = async (getFreshIdTokenFunc) => {
  console.log('(onboardingService) - Firing skipQuickStart');
  try {
    const token = await getFreshIdTokenFunc();
    const response = await fetch(`${API_BASE_URL}/api/onboarding/skip-quick-start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('(onboardingService) - Server response:', data);
    return data;

  } catch (error) {
    console.error('Error in skipQuickStart service:', error);
    throw error;
  }
};

/**
 * Marks the Ask Kay intro as shown for the user.
 * @param {Function} getFreshIdTokenFunc - Function to get a fresh Firebase ID token.
 * @returns {Promise<Object>} A promise that resolves to the API response data.
 */
export const completeAskKayIntro = async (getFreshIdTokenFunc) => {
  try {
    const token = await getFreshIdTokenFunc();
    const response = await fetch(`${API_BASE_URL}/api/onboarding/ask-kay-intro-complete`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to mark Ask Kay intro complete.');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in completeAskKayIntro service:', error);
    throw error;
  }
};

/**
 * Fetches the Chef Kay intro message content.
 * @param {Function} getFreshIdTokenFunc - Function to get a fresh Firebase ID token.
 * @returns {Promise<Object>} A promise that resolves to the intros content.
 */
export const getAskKayIntro = async (getFreshIdTokenFunc) => {
  try {
    const token = await getFreshIdTokenFunc();
    const response = await fetch(`${API_BASE_URL}/api/onboarding/ask-kay-intro`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch Ask Kay intro.');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in getAskKayIntro service:', error);
    throw error;
  }
};
