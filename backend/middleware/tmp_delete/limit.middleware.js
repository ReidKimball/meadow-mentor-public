// backend/middleware/limit.middleware.js
import User from '../models/user.model.js';
import ShoppingList from '../models/shoppingList.model.js';

const FREE_PLAN_LIMITS = {
  RECIPES: 5,
  SHOPPING_LIST_ITEMS: 5,
};

/**
 * @description Middleware to check if a user on a 'basic' plan has reached their saved recipe limit.
 * @param {object} req - Express request object. Expects req.user.uid to be populated by a preceding auth middleware.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
export const checkRecipeLimit = async (req, res, next) => {
  try {
    const firebaseUID = req.user.uid;
    if (!firebaseUID) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const user = await User.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Premium users are not subject to limits
    if (user.paymentStatus.plan !== 'basic') {
      return next();
    }

    // Check the number of saved recipes
    if (user.savedRecipes && user.savedRecipes.length >= FREE_PLAN_LIMITS.RECIPES) {
      return res.status(403).json({
        message: 'You have reached the limit for saved recipes (5) on the Basic plan.',
        errorCode: 'LIMIT_EXCEEDED_RECIPES',
      });
    }

    next();
  } catch (error) {
    console.error('Error in checkRecipeLimit middleware:', error);
    res.status(500).json({ message: 'Internal server error while checking usage limits.' });
  }
};

/**
 * @description Middleware to check if a user on a 'basic' plan has reached their shopping list item limit.
 * @param {object} req - Express request object. Expects req.user.uid to be populated by a preceding auth middleware.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
export const checkShoppingListLimit = async (req, res, next) => {
  try {
    const firebaseUID = req.user.uid;
    if (!firebaseUID) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const user = await User.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Premium users are not subject to limits
    if (user.paymentStatus.plan !== 'basic') {
      return next();
    }

    const shoppingList = await ShoppingList.findOne({ firebaseUID });
    // If they don't have a shopping list yet, they are under the limit
    if (!shoppingList) {
      return next();
    }

    // Check the number of items in the shopping list
    if (shoppingList.items && shoppingList.items.length >= FREE_PLAN_LIMITS.SHOPPING_LIST_ITEMS) {
      return res.status(403).json({
        message: 'You have reached the limit for shopping list items on the Basic plan. Please upgrade for unlimited items.',
        errorCode: 'LIMIT_EXCEEDED_SHOPPING_LIST',
      });
    }

    next();
  } catch (error) {
    console.error('Error in checkShoppingListLimit middleware:', error);
    res.status(500).json({ message: 'Internal server error while checking usage limits.' });
  }
};
