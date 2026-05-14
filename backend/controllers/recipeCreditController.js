// backend/controllers/recipeCreditController.js
/**
 * Recipe Credit Controller - Handles recipe generation with credit deduction
 * 
 * This controller provides endpoints for recipe generation that automatically
 * deduct credits before processing and refund on failure.
 */

import { generateRecipeImageWithCredits } from '../services/recipeCreditService.js';
import { hasSufficientCredits } from '../services/credit.service.js';
import { CREDIT_COSTS } from '../config/creditCosts.js';
import User from '../models/user.model.js';

/**
 * Generate recipe image with credit deduction
 * 
 * @route POST /api/recipes/:id/generate-image
 * @access Private
 */
export const generateRecipeImage = async (req, res) => {
  const firebaseUID = req.user?.uid;

  try {
    const user = await User.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { id: recipeId } = req.params;

    // Check if user has sufficient credits
    const hasCredits = await hasSufficientCredits(user._id, CREDIT_COSTS.GENERATE_IMAGE);
    if (!hasCredits) {
      return res.status(402).json({
        error: "Insufficient credits",
        message: `You need ${CREDIT_COSTS.GENERATE_IMAGE} credit(s) to generate an image`,
        requiredCredits: CREDIT_COSTS.GENERATE_IMAGE,
        currentBalance: user.creditBalance
      });
    }

    console.log(`(recipeCreditController) User: ${firebaseUID}, generating image for recipe: ${recipeId}`);

    // Generate image with credit deduction
    const result = await generateRecipeImageWithCredits(user._id, recipeId);

    res.json({
      success: true,
      imageUrl: result.imageUrl,
      recipe: result.recipe,
      creditsRemaining: result.creditsRemaining
    });

  } catch (error) {
    console.error("(recipeCreditController) Error generating image:", error);
    
    res.status(500).json({ 
      error: "Failed to generate image",
      message: error.message 
    });
  }
};

/**
 * Get user's credit balance and recipe generation cost
 * 
 * @route GET /api/recipes/credit-info
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
        generateRecipe: CREDIT_COSTS.CREATE_RECIPE,
        generateImage: CREDIT_COSTS.GENERATE_IMAGE,
        modifyRecipe: CREDIT_COSTS.MODIFY_RECIPE
      },
      canGenerateRecipe: user.creditBalance >= CREDIT_COSTS.CREATE_RECIPE,
      canGenerateImage: user.creditBalance >= CREDIT_COSTS.GENERATE_IMAGE,
      canModifyRecipe: user.creditBalance >= CREDIT_COSTS.MODIFY_RECIPE
    });

  } catch (error) {
    console.error("(recipeCreditController) Error getting credit info:", error);
    res.status(500).json({ error: "Failed to get credit info" });
  }
};

export default {
  generateRecipeImage,
  getCreditInfo
};
