import { API_BASE_URL } from '../env-config.js';

/**
 * @file adminService.js
 * Fetches all users who have at least one AI response.
 * @param {Function} getFreshIdToken - Function to get a fresh Firebase ID token.
 * @returns {Promise<Array>} A promise that resolves to an array of user objects.
 */
export const getUsersWithResponses = async (getFreshIdToken) => {
  const token = await getFreshIdToken();
  const response = await fetch(`${API_BASE_URL}/api/admin/users-with-responses`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch users with AI responses");
  }

  return response.json();
};

/**
 * Fetches AI responses based on a set of filters.
 * @param {object} filters - The filters to apply.
 * @param {string} filters.firebaseUID - The Firebase UID of the user.
 * @param {string} [filters.startDate] - The start date for the date range filter.
 * @param {string} [filters.endDate] - The end date for the date range filter.
 * @param {string} [filters.serviceType] - The service type to filter by.
 * @param {boolean} [filters.saved] - The saved status to filter by.
 * @param {Function} getFreshIdToken - Function to get a fresh Firebase ID token.
 * @returns {Promise<Array>} A promise that resolves to an array of AI response objects.
 */
export const getResponsesByFilter = async (filters, getFreshIdToken) => {
  const token = await getFreshIdToken();
  const queryParams = new URLSearchParams(filters).toString();

  const response = await fetch(`${API_BASE_URL}/api/admin/responses?${queryParams}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch AI responses by filter");
  }

  return response.json();
};

/**
 * Deletes a specific AI response by its ID.
 * @param {string} responseId - The ID of the AI response to delete.
 * @param {Function} getFreshIdToken - Function to get a fresh Firebase ID token.
 * @returns {Promise<object>} A promise that resolves to the response from the server.
 */
export const deleteResponse = async (responseId, getFreshIdToken) => {
  const token = await getFreshIdToken();
  const response = await fetch(`${API_BASE_URL}/api/admin/responses/${responseId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to delete response');
  }
  const data = await response.json();
  return data;
};

/**
 * @function getRecipeValidationLogs
 * @description Fetches paginated recipe validation logs for administrators.
 * @param {Function} getFreshIdToken - Function to get a fresh Firebase ID token.
 * @param {number} page - The page number to fetch.
 * @param {number} limit - The number of logs per page.
 * @param {boolean|undefined} isCompliant - Optional filter for compliance status.
 * @returns {Promise<object>} An object containing logs, totalPages, and currentPage.
 */
export const getRecipeValidationLogs = async (getFreshIdToken, page = 1, limit = 20, isCompliant) => {
  const token = await getFreshIdToken();
  const queryParams = new URLSearchParams({ page, limit });
  if (isCompliant !== undefined) {
    queryParams.append('isCompliant', isCompliant);
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/recipe-validation-logs?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch recipe validation logs');
  }

  return data;
};
