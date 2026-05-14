// backend/routes/mealPlanCredit.routes.js
import express from 'express';
import {
  generateMealPlan,
  convertPlaceholder,
  generateAllRecipes,
  getPlaceholderStatus,
  getCreditInfo
} from '../controllers/mealPlanCreditController.js';
import { verifyFirebaseToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(verifyFirebaseToken);

/**
 * @route   POST /api/meal-plans/generate
 * @desc    Generate a new meal plan with placeholders
 * @access  Private
 * @requires 5 credits
 */
router.post('/generate', generateMealPlan);

/**
 * @route   POST /api/meal-plans/:id/convert-recipe
 * @desc    Convert a placeholder to a full recipe
 * @access  Private
 * @requires 1 credit
 */
router.post('/:id/convert-recipe', convertPlaceholder);

/**
 * @route   POST /api/meal-plans/:id/generate-all
 * @desc    Generate all placeholder recipes in a meal plan
 * @access  Private
 * @requires 1 credit per placeholder
 */
router.post('/:id/generate-all', generateAllRecipes);

/**
 * @route   GET /api/meal-plans/:id/placeholder-status
 * @desc    Get placeholder status and costs for a meal plan
 * @access  Private
 */
router.get('/:id/placeholder-status', getPlaceholderStatus);

/**
 * @route   GET /api/meal-plans/credit-info
 * @desc    Get credit balance and costs for meal plan operations
 * @access  Private
 */
router.get('/credit-info', getCreditInfo);

export default router;
