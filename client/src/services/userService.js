/**
 * @file userService.js
 * @description Service for user-related API calls.
 */

import { API_BASE_URL } from '../env-config.js';

/**
 * Marks the user's onboarding as complete.
 * @param {Function} getFreshIdTokenFunc - Function to get a fresh Firebase ID token.
 * @returns {Promise<object>} The updated user object from the backend.
 */
export const completeOnboarding = async (getFreshIdTokenFunc) => {
  console.log('(userService) - Firing completeOnboarding');
  console.log('(userService) - API_BASE_URL:', API_BASE_URL);
  const API_URL = `${API_BASE_URL}/api/users`;
  try {
    const token = await getFreshIdTokenFunc();
    const response = await fetch(`${API_URL}/complete-onboarding`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to complete onboarding');
    }

    return await response.json();
  } catch (error) {
    console.error('Error completing onboarding:', error);
    throw error;
  }
};

/**
 * Uploads a user profile image.
 * @param {File} imageFile - The image file to upload.
 * @param {Function} getFreshIdTokenFunc - Function to get a fresh Firebase ID token.
 * @returns {Promise<object>} Response containing the new profile image URL.
 */
export const uploadProfileImage = async (imageFile, getFreshIdTokenFunc) => {
  console.log('(userService) - Uploading profile image');
  const API_URL = `${API_BASE_URL}/api/users`;
  
  try {
    const token = await getFreshIdTokenFunc();
    
    // Create FormData to send the file
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await fetch(`${API_URL}/profile-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to upload profile image');
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw error;
  }
};

const userService = {
  completeOnboarding,
  uploadProfileImage,
};

export default userService;
