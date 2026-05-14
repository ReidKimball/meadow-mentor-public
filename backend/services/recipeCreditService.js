// backend/services/recipeCreditService.js
/**
 * Recipe Credit Service - Handles credit deduction for recipe generation
 * 
 * This service wraps the recipe generation logic with credit deduction.
 * It ensures credits are deducted before generation and refunded on failure.
 */

import { deductCredits, refundCredits } from './credit.service.js';
import { CREDIT_COSTS } from '../config/creditCosts.js';
import User from "../models/user.model.js";
import Recipe from "../models/recipe.model.js";

/**
 * Generate recipe image with credit deduction
 * 
 * @param {string} userId - User ID
 * @param {string} recipeId - Recipe ID
 * @returns {Promise<object>} Generated image info and remaining credits
 */
export const generateRecipeImageWithCredits = async (userId, recipeId) => {
  try {
    // 1. Deduct credits first
    const newBalance = await deductCredits(
      userId, 
      CREDIT_COSTS.GENERATE_IMAGE, 
      'GENERATE_IMAGE',
      recipeId
    );
    
    // 2. Generate the image
    const imageInfo = await generateRecipeImage(userId, recipeId);
    
    // 3. Return result with credit balance
    return {
      ...imageInfo,
      creditsRemaining: newBalance
    };
    
  } catch (error) {
    // 4. Refund credits on failure
    await refundCredits(
      userId, 
      CREDIT_COSTS.GENERATE_IMAGE, 
      'GENERATE_IMAGE',
      'Image generation failed'
    );
    throw error;
  }
};

/**
 * Generate recipe image
 */
async function generateRecipeImage(userId, recipeId) {
  // TODO: Implement image generation logic
  // This would call your image generation service (DALL-E, Midjourney, etc.)
  
  const recipe = await Recipe.findById(recipeId);
  if (!recipe) {
    throw new Error("Recipe not found");
  }

  // Placeholder for image generation
  const imageUrl = `https://example.com/generated-images/${recipeId}.jpg`;
  
  // Update recipe with image
  recipe.recipeImage = {
    thumbnail: imageUrl,
    display: imageUrl,
    original: imageUrl
  };
  recipe.imageVersion = (recipe.imageVersion || 0) + 1;
  await recipe.save();

  return {
    imageUrl,
    recipe: recipe.toObject()
  };
}

export default {
  generateRecipeImageWithCredits
};
