// backend/services/credit.service.js
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import CreditTransaction from '../models/creditTransaction.model.js';
import { CREDIT_COSTS } from '../config/creditCosts.js';

/**
 * Credit Service - Handles all credit operations with atomic transactions
 * 
 * This service provides safe, atomic operations for credit management.
 * All credit operations must go through this service to ensure consistency.
 */

/**
 * Deduct credits from a user's account
 * Uses atomic findOneAndUpdate to prevent race conditions
 * 
 * @param {string} userId - User ID
 * @param {number} amount - Amount of credits to deduct
 * @param {string} actionType - Type of action (from CreditTransaction enum)
 * @param {string} referenceId - Optional reference to related entity
 * @param {object} metadata - Optional additional metadata
 * @returns {Promise<number>} New credit balance
 */
export const deductCredits = async (userId, amount, actionType, referenceId = null, metadata = {}) => {
  if (amount <= 0) {
    throw new Error('Credit deduction amount must be positive');
  }

  if (!CREDIT_COSTS[actionType] && actionType !== 'REFUND') {
    throw new Error(`Invalid action type: ${actionType}`);
  }

  const session = await mongoose.startSession();

  try {
    // Start transaction
    session.startTransaction();

    // Atomically check and deduct credits
    const user = await User.findOneAndUpdate(
      {
        _id: userId,
        creditBalance: { $gte: amount }
      },
      {
        $inc: { creditBalance: -amount }
      },
      {
        new: true,
        session
      }
    );

    if (!user) {
      await session.abortTransaction();
      throw new Error('Insufficient credits');
    }

    // Record the transaction
    const transaction = new CreditTransaction({
      user: userId,
      amount: -amount,
      actionType,
      referenceId,
      description: `${actionType} - ${amount} credits`,
      metadata,
      balanceAfter: user.creditBalance
    });

    await transaction.save({ session });

    // Commit transaction
    await session.commitTransaction();
    
    console.log(`(credit.service) Deducted ${amount} credits from user ${userId}. New balance: ${user.creditBalance}`);
    
    return user.creditBalance;

  } catch (error) {
    await session.abortTransaction();
    console.error(`(credit.service) Failed to deduct credits:`, error);
    throw error;
  } finally {
    await session.endSession();
  }
};

/**
 * Add credits to a user's account
 * Used for purchases, refunds, and bonuses
 * 
 * @param {string} userId - User ID
 * @param {number} amount - Amount of credits to add
 * @param {string} actionType - Type of action (PURCHASE, REFUND, BONUS)
 * @param {string} referenceId - Optional reference (e.g., Stripe session ID)
 * @param {object} metadata - Optional additional metadata
 * @returns {Promise<number>} New credit balance
 */
export const addCredits = async (userId, amount, actionType, referenceId = null, metadata = {}) => {
  if (amount <= 0) {
    throw new Error('Credit addition amount must be positive');
  }

  console.log('(credit.service) addCredits() start:', {
    userId: userId?.toString?.() ?? userId,
    amount,
    actionType,
    referenceId,
  });
 
  const session = await mongoose.startSession();
 
  try {
    // Start transaction
    session.startTransaction();

    // Atomically add credits
    const user = await User.findOneAndUpdate(
      { _id: userId },
      {
        $inc: { creditBalance: amount }
      },
      {
        new: true,
        session
      }
    );

    if (!user) {
      await session.abortTransaction();
      throw new Error('User not found');
    }

    console.log('(credit.service) addCredits() user updated:', {
      userId: user._id?.toString(),
      creditBalanceAfter: user.creditBalance,
    });

    // Record the transaction
    const transaction = new CreditTransaction({
      user: userId,
      amount: amount,
      actionType,
      referenceId,
      description: `${actionType} - ${amount} credits`,
      metadata,
      balanceAfter: user.creditBalance
    });

    await transaction.save({ session });

    console.log('(credit.service) addCredits() transaction saved:', {
      transactionId: transaction._id?.toString(),
      userId: user._id?.toString(),
      amount,
      actionType,
      referenceId,
    });
 
    // Commit transaction
    await session.commitTransaction();

    console.log('(credit.service) addCredits() transaction committed:', {
      userId: user._id?.toString(),
      creditBalanceAfter: user.creditBalance,
    });
     
    console.log(`(credit.service) Added ${amount} credits to user ${userId}. New balance: ${user.creditBalance}`);
     
    return user.creditBalance;

  } catch (error) {
    await session.abortTransaction();
    console.error(`(credit.service) Failed to add credits:`, error);
    throw error;
  } finally {
    await session.endSession();
  }
};

/**
 * Check if a user has sufficient credits for an action
 * 
 * @param {string} userId - User ID
 * @param {number} requiredCredits - Credits needed
 * @returns {Promise<boolean>} True if user has sufficient credits
 */
export const hasSufficientCredits = async (userId, requiredCredits) => {
  const user = await User.findById(userId).select('creditBalance');
  
  if (!user) {
    return false;
  }
  
  return user.creditBalance >= requiredCredits;
};

/**
 * Get a user's current credit balance
 * 
 * @param {string} userId - User ID
 * @returns {Promise<number>} Current credit balance
 */
export const getCreditBalance = async (userId) => {
  const user = await User.findById(userId).select('creditBalance');
  
  if (!user) {
    throw new Error('User not found');
  }
  
  return user.creditBalance;
};

/**
 * Get credit transaction history for a user
 * 
 * @param {string} userId - User ID
 * @param {number} limit - Number of transactions to return
 * @param {number} offset - Number of transactions to skip
 * @returns {Promise<Array>} Array of transactions
 */
export const getCreditHistory = async (userId, limit = 50, offset = 0) => {
  return await CreditTransaction.getUserHistory(userId, limit, offset);
};

/**
 * Get credit summary for analytics
 * 
 * @param {string} userId - User ID
 * @param {Date} startDate - Optional start date
 * @param {Date} endDate - Optional end date
 * @returns {Promise<object>} Credit usage summary
 */
export const getCreditSummary = async (userId, startDate = null, endDate = null) => {
  const summary = await CreditTransaction.getCreditSummary(userId, startDate, endDate);
  
  if (summary.length === 0) {
    return {
      creditsEarned: 0,
      creditsSpent: 0,
      netCredits: 0,
      breakdown: []
    };
  }
  
  const result = summary[0];
  result.netCredits = result.creditsEarned - result.creditsSpent;
  
  return result;
};

/**
 * Grant bonus credits (for promotions, transitions, etc.)
 * 
 * @param {string} userId - User ID
 * @param {number} amount - Bonus credits to grant
 * @param {string} reason - Reason for bonus
 * @returns {Promise<number>} New credit balance
 */
export const grantBonusCredits = async (userId, amount, reason = 'Bonus credits') => {
  return await addCredits(
    userId,
    amount,
    'BONUS',
    null,
    { reason, grantedAt: new Date().toISOString() }
  );
};

/**
 * Refund credits for a failed operation
 * 
 * @param {string} userId - User ID
 * @param {number} amount - Credits to refund
 * @param {string} originalActionType - The action that failed
 * @param {string} reason - Reason for refund
 * @returns {Promise<number>} New credit balance
 */
export const refundCredits = async (userId, amount, originalActionType, reason = 'Operation failed') => {
  return await addCredits(
    userId,
    amount,
    'REFUND',
    null,
    { 
      originalActionType,
      reason,
      refundedAt: new Date().toISOString()
    }
  );
};

export default {
  deductCredits,
  addCredits,
  hasSufficientCredits,
  getCreditBalance,
  getCreditHistory,
  getCreditSummary,
  grantBonusCredits,
  refundCredits
};
