// backend/routes/recipeCredit.routes.js
import express from 'express';
import {
  generateRecipeImage,
  getCreditInfo
} from '../controllers/recipeCreditController.js';
import { verifyFirebaseToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(verifyFirebaseToken);

/**
 * @route   POST /api/recipes/:id/generate-image
 * @desc    Generate an image for a recipe with credit deduction
 * @access  Private
 * @requires 2 credits
 */
router.post('/:id/generate-image', generateRecipeImage);

/**
 * @route   GET /api/recipes/credit-info
 * @desc    Get credit balance and costs for recipe operations
 * @access  Private
 */
router.get('/credit-info', getCreditInfo);

export default router;
