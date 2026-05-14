// backend/controllers/mealPlanCreditController.js
/**
 * Meal Plan Credit Controller - Handles meal plan operations with credit deduction
 * 
 * This controller provides endpoints for meal plan generation that automatically
 * deduct credits and implements the placeholder concept for flexible recipe generation.
 */

import { 
  generateMealPlanWithCredits, 
  convertPlaceholderToRecipe, 
  generateAllRecipesInPlan 
} from '../services/mealPlanCreditService.js';
import { hasSufficientCredits } from '../services/credit.service.js';
import { CREDIT_COSTS } from '../config/creditCosts.js';
import User from '../models/user.model.js';
import MealPlan from '../models/mealPlan.model.js';

/**
 * Generate meal plan with placeholders
 * 
 * @route POST /api/meal-plans/generate
 * @access Private
 * @requires 5 credits
 */
export const generateMealPlan = async (req, res) => {
  const firebaseUID = req.user?.uid;

  try {
    const user = await User.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // does this need to be expanded to all mealTypes supported by recipe.model.js?
    const { 
      duration = 7, 
      includedMealTypes = { breakfast: true, lunch: true, dinner: true, snack: true },
      dynamicPreferences = ''
    } = req.body;

    // Check if user has sufficient credits
    const hasCredits = await hasSufficientCredits(user._id, CREDIT_COSTS.CREATE_MEAL_PLAN);
    if (!hasCredits) {
      return res.status(402).json({
        error: "Insufficient credits",
        message: `You need ${CREDIT_COSTS.CREATE_MEAL_PLAN} credit(s) to create a meal plan`,
        requiredCredits: CREDIT_COSTS.CREATE_MEAL_PLAN,
        currentBalance: user.creditBalance
      });
    }

    console.log(`(mealPlanCreditController) User: ${firebaseUID}, generating ${duration}-day meal plan`);

    // Generate meal plan with placeholders
    const result = await generateMealPlanWithCredits(user._id, {
      duration,
      includedMealTypes,
      dynamicPreferences,
      therapeuticDiet: user.therapeuticDiet,
      conditionTreating: user.conditionTreating,
      firstName: user.firstName
    });

    res.json({
      success: true,
      mealPlan: result.mealPlan,
      placeholderCount: result.placeholderCount,
      creditsRemaining: result.creditsRemaining,
      creditsInfo: result.creditsInfo
    });

  } catch (error) {
    console.error("(mealPlanCreditController) Error:", error);
    res.status(500).json({ 
      error: "Failed to generate meal plan",
      message: error.message 
    });
  }
};

/**
 * Convert a placeholder to a full recipe
 * 
 * @route POST /api/meal-plans/:id/convert-recipe
 * @access Private
 * @requires 1 credit per recipe
 */
export const convertPlaceholder = async (req, res) => {
  const firebaseUID = req.user?.uid;

  try {
    const user = await User.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { id: mealPlanId } = req.params;
    const { dayNumber, mealType } = req.body;

    // Validate inputs
    if (!dayNumber || !mealType) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "dayNumber and mealType are required"
      });
    }

    // Check if user has sufficient credits
    const hasCredits = await hasSufficientCredits(user._id, CREDIT_COSTS.CREATE_RECIPE);
    if (!hasCredits) {
      return res.status(402).json({
        error: "Insufficient credits",
        message: `You need ${CREDIT_COSTS.CREATE_RECIPE} credit(s) to generate a recipe`,
        requiredCredits: CREDIT_COSTS.CREATE_RECIPE,
        currentBalance: user.creditBalance
      });
    }

    console.log(`(mealPlanCreditController) User: ${firebaseUID}, converting placeholder for day ${dayNumber}, ${mealType}`);

    // Convert placeholder to recipe
    const result = await convertPlaceholderToRecipe(user._id, mealPlanId, dayNumber, mealType);

    res.json({
      success: true,
      recipe: result.recipe,
      mealPlan: result.mealPlan,
      creditsRemaining: result.creditsRemaining
    });

  } catch (error) {
    console.error("(mealPlanCreditController) Error converting placeholder:", error);
    
    if (error.message === 'Meal plan not found' || error.message === 'Placeholder not found') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: "Failed to convert placeholder",
      message: error.message 
    });
  }
};

/**
 * Generate all recipes in a meal plan
 * 
 * @route POST /api/meal-plans/:id/generate-all
 * @access Private
 * @requires 1 credit per placeholder
 */
export const generateAllRecipes = async (req, res) => {
  const firebaseUID = req.user?.uid;

  try {
    const user = await User.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { id: mealPlanId } = req.params;

    console.log(`(mealPlanCreditController) User: ${firebaseUID}, generating all recipes for plan: ${mealPlanId}`);

    // Generate all recipes
    const result = await generateAllRecipesInPlan(user._id, mealPlanId);

    res.json({
      success: true,
      mealPlan: result.mealPlan,
      generatedRecipes: result.generatedRecipes,
      creditsRemaining: result.creditsRemaining,
      totalCost: result.totalCost
    });

  } catch (error) {
    console.error("(mealPlanCreditController) Error generating all recipes:", error);
    
    if (error.message.includes('Insufficient credits')) {
      return res.status(402).json({
        error: "Insufficient credits",
        message: error.message
      });
    }
    
    if (error.message === 'Meal plan not found') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: "Failed to generate recipes",
      message: error.message 
    });
  }
};

/**
 * Get meal plan with placeholder status
 * 
 * @route GET /api/meal-plans/:id/placeholder-status
 * @access Private
 */
export const getPlaceholderStatus = async (req, res) => {
  const firebaseUID = req.user?.uid;

  try {
    const user = await User.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { id: mealPlanId } = req.params;
    
    const mealPlan = await MealPlan.findById(mealPlanId);
    if (!mealPlan) {
      return res.status(404).json({ error: "Meal plan not found" });
    }

    // Check ownership
    if (!mealPlan.user.equals(user._id)) {
      return res.status(403).json({ error: "Not authorized to view this meal plan" });
    }

    // Count placeholders and calculate costs
    const placeholders = [];
    let placeholderCount = 0;

    mealPlan.days.forEach((day) => {
      ['breakfast', 'lunch', 'dinner', 'snack'].forEach(mealType => {
        if (day.meals[mealType] && day.meals[mealType].isPlaceholder) {
          placeholderCount++;
          placeholders.push({
            dayNumber: day.dayNumber,
            mealType,
            title: day.meals[mealType].title,
            description: day.meals[mealType].description
          });
        }
      });
    });

    const totalCost = placeholderCount * CREDIT_COSTS.CREATE_RECIPE;
    const canAffordAll = user.creditBalance >= totalCost;

    res.json({
      mealPlanId,
      placeholderCount,
      placeholders,
      costs: {
        perRecipe: CREDIT_COSTS.CREATE_RECIPE,
        totalToGenerateAll: totalCost
      },
      credits: {
        currentBalance: user.creditBalance,
        canAffordAll,
        canAffordOne: user.creditBalance >= CREDIT_COSTS.CREATE_RECIPE
      }
    });

  } catch (error) {
    console.error("(mealPlanCreditController) Error getting placeholder status:", error);
    res.status(500).json({ error: "Failed to get placeholder status" });
  }
};

/**
 * Get meal plan credit info
 * 
 * @route GET /api/meal-plans/credit-info
 * @access Private
 */
export const getCreditInfo = async (req, res) => {
  const firebaseUID = req.user?.uid;

  try {
    const user = await User.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      creditBalance: user.creditBalance,
      costs: {
        createMealPlan: CREDIT_COSTS.CREATE_MEAL_PLAN,
        generateRecipe: CREDIT_COSTS.CREATE_RECIPE
      },
      canCreateMealPlan: user.creditBalance >= CREDIT_COSTS.CREATE_MEAL_PLAN,
      canGenerateRecipe: user.creditBalance >= CREDIT_COSTS.CREATE_RECIPE
    });

  } catch (error) {
    console.error("(mealPlanCreditController) Error getting credit info:", error);
    res.status(500).json({ error: "Failed to get credit info" });
  }
};

export default {
  generateMealPlan,
  convertPlaceholder,
  generateAllRecipes,
  getPlaceholderStatus,
  getCreditInfo
};
