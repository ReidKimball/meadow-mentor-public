/**
 * @file Defines the newsletter service for frontend operations.
 * @description This file contains functions responsible for making API calls to the backend's newsletter endpoints.
 * It abstracts the data fetching logic away from the UI components.
 * @requires module:../env-config - For accessing the API base URL.
 * @author Cascade
 * @version 1.0.0
 * @date 2025-07-25
 */

// Configuration
import { API_BASE_URL } from '../env-config'; // Provides the base URL for the backend API.

/**
 * @async
 * @function subscribeToNewsletter
 * @description Sends a request to the backend API to subscribe a user to the public newsletter.
 * This function is called from UI components like the site footer.
 * @param {string} email - The email address to be subscribed.
 * @returns {Promise<object>} A promise that resolves with the JSON response from the backend on success.
 * @throws {Error} Throws an error if the network response is not ok or if the fetch operation fails.
 * @example
 * import { subscribeToNewsletter } from './services/newsletterService';
 * 
 * const handleSignup = async (email) => {
 *   try {
 *     const result = await subscribeToNewsletter(email);
 *     console.log('Subscription successful:', result.message);
 *   } catch (error) {
 *     console.error('Subscription failed:', error.message);
 *   }
 * };
 */
export const subscribeToNewsletter = async (email) => { // called from Footer.jsx
  try {
    const response = await fetch(`${API_BASE_URL}/api/newsletter/subscribe`, { // goes to route in newsletter.js (defined in index.js)
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to subscribe.');
    }

    return await response.json();
  } catch (error) {
    console.error('[newsletterService.js] ❌ Error in subscribeToNewsletter:', error);
    throw error;
  }
};
