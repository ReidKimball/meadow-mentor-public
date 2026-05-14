import mongoose from "mongoose";
import UserHealth from "../models/userHealth.model.js";
import User from "../models/user.model.js";
import { grantBonusCredits } from "./credit.service.js";

/**
 * UserHealth Service
 * 
 * Handles all operations related to user health data.
 * IMPORTANT: This service handles Protected Health Information (PHI).
 * - Never log health values directly (log user IDs only)
 * - Use transactions for create/update operations
 * - Ensure proper error handling
 */

/**
 * Get user health data by firebaseUID
 * @param {string} firebaseUID - Firebase UID of the user
 * @returns {Promise<Object|null>} UserHealth document or null if not found
 */
export const getUserHealth = async (firebaseUID) => {
  try {

    const healthData = await UserHealth.findOne({ firebaseUID });
    
    if (!healthData) {

      return null;
    }
    

    return healthData;
  } catch (error) {
    console.error(`(userHealth.service.js) Error fetching health data for user ${firebaseUID}:`, error);
    throw error;
  }
};

/**
 * Create new health record
 * @param {string} userId - MongoDB ObjectId of the user
 * @param {string} firebaseUID - Firebase UID of the user
 * @param {Object} healthData - Health data to store
 * @param {Object} session - Optional MongoDB session for transactions
 * @returns {Promise<Object>} Created UserHealth document
 */
export const createUserHealth = async (userId, firebaseUID, healthData, session = null) => {
  try {

    
    const healthRecord = {
      userId,
      firebaseUID,
      ...healthData,
    };
    
    const options = session ? { session } : {};
    const [createdHealth] = await UserHealth.create([healthRecord], options);
    

    return createdHealth;
  } catch (error) {
    console.error(`(userHealth.service.js) Error creating health record for user ${firebaseUID}:`, error);
    throw error;
  }
};

/**
 * Update health record
 * @param {string} firebaseUID - Firebase UID of the user
 * @param {Object} healthData - Health data to update
 * @param {Object} session - Optional MongoDB session for transactions
 * @returns {Promise<Object>} Updated UserHealth document
 */
export const updateUserHealth = async (firebaseUID, healthData, session = null) => {
  try {

    
    const options = session ? { session, new: true } : { new: true };
    const updatedHealth = await UserHealth.findOneAndUpdate(
      { firebaseUID },
      { $set: healthData },
      options
    );
    
    if (!updatedHealth) {

      return null;
    }
    

    return updatedHealth;
  } catch (error) {
    console.error(`(userHealth.service.js) Error updating health data for user ${firebaseUID}:`, error);
    throw error;
  }
};

/**
 * Get merged user + health data (uses Promise.all for parallel fetching)
 * This is the primary function for retrieving complete user data.
 * 
 * @param {string} firebaseUID - Firebase UID of the user
 * @returns {Promise<Object>} Merged user and health data
 */
export const getMergedUserData = async (firebaseUID) => {
  try {

    
    // Fetch User and UserHealth in parallel for better performance
    const [user, health] = await Promise.all([
      User.findOne({ firebaseUID }),
      UserHealth.findOne({ firebaseUID }),
    ]);
    
    if (!user) {

      return null;
    }
    
    // Convert user to plain object
    const userObject = user.toObject();
    
    // If no health data exists, return user data only
    if (!health) {

      return userObject;
    }
    
    // Destructure to exclude fields that are already in the user object
    // This prevents overwriting user._id, userId, and firebaseUID with health document values
    const { _id, userId, firebaseUID: healthFirebaseUID, ...healthFields } = health.toObject();
    
    // Merge user data with health fields only
    const mergedData = {
      ...userObject,
      ...healthFields,
    };
    

    return mergedData;
  } catch (error) {
    console.error(`(userHealth.service.js) Error fetching merged data for user ${firebaseUID}:`, error);
    throw error;
  }
};

/**
 * Create both User and UserHealth documents in a transaction
 * Ensures atomicity - both succeed or both fail
 * 
 * @param {Object} userData - User profile data
 * @param {Object} healthData - User health data
 * @returns {Promise<Object>} Object containing created user and health documents
 */
export const createUserWithHealth = async (userData, healthData) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {

    
    // Create User document
    const [user] = await User.create([userData], { session });
    
    // Create UserHealth document with references
    const healthRecord = {
      userId: user._id,
      firebaseUID: user.firebaseUID,
      ...healthData,
    };
    const [health] = await UserHealth.create([healthRecord], { session });
    
    await session.commitTransaction();

    
    // Grant initial credits to new users
    try {
      await grantBonusCredits(user._id, 7, 'Welcome gift - 7 free credits to get started!');

    } catch (creditError) {
      console.error(`(userHealth.service.js) Failed to grant initial credits to user ${userData.firebaseUID}:`, creditError);
      // Don't fail the registration if credit grant fails
    }
    
    return { user, health };
  } catch (error) {
    await session.abortTransaction();
    console.error(`(userHealth.service.js) Error creating user with health data:`, error);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Update both User and UserHealth documents in a transaction
 * Ensures atomicity - both succeed or both fail
 * 
 * @param {string} firebaseUID - Firebase UID of the user
 * @param {Object} userData - User profile data to update
 * @param {Object} healthData - User health data to update
 * @returns {Promise<Object>} Object containing updated user and health documents
 */
export const updateUserWithHealth = async (firebaseUID, userData, healthData) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {

    
    // Update User document
    const user = await User.findOneAndUpdate(
      { firebaseUID },
      { $set: userData },
      { session, new: true }
    );
    
    if (!user) {
      throw new Error(`User not found: ${firebaseUID}`);
    }
    
    // Update UserHealth document
    const health = await UserHealth.findOneAndUpdate(
      { firebaseUID },
      { $set: healthData },
      { session, new: true }
    );
    
    // If health document doesn't exist, create it
    if (!health && Object.keys(healthData).length > 0) {
      const [newHealth] = await UserHealth.create([{
        userId: user._id,
        firebaseUID: user.firebaseUID,
        ...healthData,
      }], { session });
      
      await session.commitTransaction();

      return { user, health: newHealth };
    }
    
    await session.commitTransaction();

    
    return { user, health };
  } catch (error) {
    await session.abortTransaction();
    console.error(`(userHealth.service.js) Error updating user with health data:`, error);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Delete health record (for user account deletion)
 * @param {string} firebaseUID - Firebase UID of the user
 * @param {Object} session - Optional MongoDB session for transactions
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
export const deleteUserHealth = async (firebaseUID, session = null) => {
  try {

    
    const options = session ? { session } : {};
    const result = await UserHealth.deleteOne({ firebaseUID }, options);
    
    if (result.deletedCount === 0) {

      return false;
    }
    

    return true;
  } catch (error) {
    console.error(`(userHealth.service.js) Error deleting health data for user ${firebaseUID}:`, error);
    throw error;
  }
};
