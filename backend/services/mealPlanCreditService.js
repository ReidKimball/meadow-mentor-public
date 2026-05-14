// backend/services/mealPlanCreditService.js
/**
 * Meal Plan Credit Service - Handles credit deduction for meal plan operations
 * 
 * This service wraps meal plan generation with credit deduction.
 * It implements the placeholder concept where meal plans use placeholders
 * that can be converted to full recipes with additional credits.
 */

import { deductCredits, refundCredits } from './credit.service.js';
import { CREDIT_COSTS } from '../config/creditCosts.js';
import MealPlan from '../models/mealPlan.model.js';
import Recipe from '../models/recipe.model.js';
import User from '../models/user.model.js';
import { GoogleGenAI } from "@google/genai";
import { getSystemPromptForDiet } from "./aiPromptUtils.js";

const ai = new GoogleGenAI(process.env.GOOGLE_API_KEY);

/**
 * Generate meal plan with credit deduction
 * Creates placeholders for meals that can be converted to full recipes later
 * 
 * @param {string} userId - User ID
 * @param {object} params - Meal plan parameters
 * @returns {Promise<object>} Generated meal plan and remaining credits
 */
export const generateMealPlanWithCredits = async (userId, params) => {
  const { 
    duration, 
    includedMealTypes, 
    dynamicPreferences,
    therapeuticDiet,
    conditionTreating,
    firstName
  } = params;
  
  try {
    // 1. Deduct credits for meal plan creation
    const newBalance = await deductCredits(
      userId, 
      CREDIT_COSTS.CREATE_MEAL_PLAN, 
      'CREATE_MEAL_PLAN'
    );
    
    // 2. Generate the meal plan with placeholders
    const mealPlan = await generateMealPlan(userId, {
      duration,
      includedMealTypes,
      dynamicPreferences,
      therapeuticDiet,
      conditionTreating,
      firstName,
      usePlaceholders: true // Use placeholder concept
    });
    
    // 3. Return result with credit balance
    return {
      ...mealPlan,
      creditsRemaining: newBalance,
      creditsInfo: {
        planCost: CREDIT_COSTS.CREATE_MEAL_PLAN,
        recipeGenerationCost: CREDIT_COSTS.CREATE_RECIPE,
        totalRecipes: mealPlan.placeholderCount,
        maxAdditionalCost: mealPlan.placeholderCount * CREDIT_COSTS.CREATE_RECIPE
      }
    };
    
  } catch (error) {
    // 4. Refund credits on failure
    console.error(`Meal plan generation failed for user ${userId}, refunding credits:`, error);
    await refundCredits(
      userId, 
      CREDIT_COSTS.CREATE_MEAL_PLAN, 
      'CREATE_MEAL_PLAN',
      'Meal plan generation failed'
    );
    throw error;
  }
};

/**
 * Convert a placeholder meal to a full recipe
 * 
 * @param {string} userId - User ID
 * @param {string} mealPlanId - Meal plan ID
 * @param {string} dayNumber - Day number in plan
 * @param {string} mealType - Type of meal (breakfast, lunch, dinner, snack)
 * @returns {Promise<object>} Generated recipe and updated meal plan
 */
export const convertPlaceholderToRecipe = async (userId, mealPlanId, dayNumber, mealType) => {
  try {
    // 1. Deduct credits for recipe generation
    const newBalance = await deductCredits(
      userId, 
      CREDIT_COSTS.CREATE_RECIPE, 
      'CREATE_RECIPE',
      `${mealPlanId}-${dayNumber}-${mealType}`
    );
    
    // 2. Generate the full recipe
    const result = await generateRecipeForPlaceholder(userId, mealPlanId, dayNumber, mealType);
    
    // 3. Update meal plan with the recipe
    const updatedPlan = await updateMealPlanWithRecipe(mealPlanId, dayNumber, mealType, result.recipe);
    
    // 4. Return result with credit balance
    return {
      recipe: result.recipe,
      mealPlan: updatedPlan,
      creditsRemaining: newBalance
    };
    
  } catch (error) {
    // 5. Refund credits on failure
    await refundCredits(
      userId, 
      CREDIT_COSTS.CREATE_RECIPE, 
      'CREATE_RECIPE',
      'Recipe generation from placeholder failed'
    );
    throw error;
  }
};

/**
 * Generate all placeholder recipes in a meal plan
 * 
 * @param {string} userId - User ID
 * @param {string} mealPlanId - Meal plan ID
 * @returns {Promise<object>} Updated meal plan with all recipes
 */
export const generateAllRecipesInPlan = async (userId, mealPlanId) => {
  try {
    // 1. Get the meal plan and count placeholders
    const mealPlan = await MealPlan.findById(mealPlanId);
    if (!mealPlan) {
      throw new Error('Meal plan not found');
    }
    
    const placeholders = [];
    mealPlan.days.forEach((day, index) => {
      ['breakfast', 'lunch', 'dinner', 'snack'].forEach(mealType => {
        if (day.meals[mealType] && day.meals[mealType].isPlaceholder) {
          placeholders.push({
            dayNumber: day.dayNumber,
            mealType
          });
        }
      });
    });
    
    const totalCost = placeholders.length * CREDIT_COSTS.CREATE_RECIPE;
    
    // 2. Check if user has enough credits
    const user = await User.findById(userId);
    if (user.creditBalance < totalCost) {
      throw new Error(`Insufficient credits. Need ${totalCost} credits to generate all recipes.`);
    }
    
    // 3. Deduct all credits upfront
    const newBalance = await deductCredits(
      userId, 
      totalCost, 
      'CREATE_RECIPE',
      `bulk-${mealPlanId}`
    );
    
    // 4. Generate all recipes
    const results = [];
    for (const placeholder of placeholders) {
      try {
        const result = await generateRecipeForPlaceholder(
          userId, 
          mealPlanId, 
          placeholder.dayNumber, 
          placeholder.mealType
        );
        
        await updateMealPlanWithRecipe(
          mealPlanId, 
          placeholder.dayNumber, 
          placeholder.mealType, 
          result.recipe
        );
        
        results.push({
          ...placeholder,
          recipe: result.recipe
        });
        
      } catch (error) {
        console.error(`Failed to generate recipe for ${placeholder.dayNumber}-${placeholder.mealType}:`, error);
        // Continue with other recipes
      }
    }
    
    // 5. Return updated meal plan
    const updatedPlan = await MealPlan.findById(mealPlanId);
    
    return {
      mealPlan: updatedPlan,
      generatedRecipes: results,
      creditsRemaining: newBalance,
      totalCost
    };
    
  } catch (error) {
    // Refund on failure
    if (error.message.includes('Insufficient credits')) {
      throw error; // No refund needed, credits weren't deducted
    }
    
    // Calculate refund amount
    const mealPlan = await MealPlan.findById(mealPlanId);
    const placeholderCount = mealPlan.days.reduce((count, day) => {
      return count + Object.values(day.meals).filter(m => m.isPlaceholder).length;
    }, 0);
    
    await refundCredits(
      userId, 
      placeholderCount * CREDIT_COSTS.CREATE_RECIPE, 
      'CREATE_RECIPE',
      'Bulk recipe generation failed'
    );
    
    throw error;
  }
};

/**
 * Core meal plan generation logic
 */
async function generateMealPlan(userId, params) {
  const {
    duration,
    includedMealTypes,
    dynamicPreferences,
    therapeuticDiet,
    conditionTreating,
    firstName,
    usePlaceholders = false
  } = params;

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Get AI model configuration
  const modelConfig = await getGeminiModel(
    "MEAL_PLAN_GENERATION",
    therapeuticDiet,
    "friendly",
    0.7
  );

  const prompt = createMealPlanPrompt({
    firstName,
    conditionTreating,
    therapeuticDiet,
    duration,
    includedMealTypes,
    dynamicPreferences,
    usePlaceholders
  });

  const requestParams = {
    model: modelConfig.modelName,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    systemInstruction: modelConfig.systemInstruction,
    generationConfig: modelConfig.generationConfig
  };

  // Generate meal plan
  const result = await ai.models.generateContent(requestParams);
  
  if (!result || !result.response) {
    throw new Error('Failed to generate meal plan');
  }

  const generatedText = result.response.text();
  
  // Parse and save meal plan
  const mealPlanData = parseMealPlanFromText(generatedText, userId, params);
  const mealPlan = new MealPlan(mealPlanData);
  await mealPlan.save();

  return {
    mealPlan: mealPlan.toObject(),
    placeholderCount: usePlaceholders ? countPlaceholders(mealPlan) : 0
  };
}

/**
 * Generate recipe for a specific placeholder
 */
async function generateRecipeForPlaceholder(userId, mealPlanId, dayNumber, mealType) {
  const mealPlan = await MealPlan.findById(mealPlanId);
  if (!mealPlan) {
    throw new Error('Meal plan not found');
  }

  const placeholder = mealPlan.days[dayNumber - 1]?.meals[mealType];
  if (!placeholder || !placeholder.isPlaceholder) {
    throw new Error('Placeholder not found');
  }

  const user = await User.findById(userId);
  
  // Generate recipe based on placeholder description
  const prompt = `${user.firstName} has ${user.conditionTreating} and follows the ${user.therapeuticDiet} diet. 
  Create a detailed recipe for: ${placeholder.description || placeholder.title}`;

  const modelConfig = await getGeminiModel(
    "RECIPE_GENERATION",
    user.therapeuticDiet,
    "friendly",
    0.7
  );

  const requestParams = {
    model: modelConfig.modelName,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    systemInstruction: modelConfig.systemInstruction,
    generationConfig: modelConfig.generationConfig
  };

  const result = await ai.models.generateContent(requestParams);
  
  if (!result || !result.response) {
    throw new Error('Failed to generate recipe');
  }

  const generatedText = result.response.text();
  
  // Parse and save recipe
  const recipeData = parseRecipeFromText(generatedText, userId, placeholder);
  const recipe = new Recipe(recipeData);
  await recipe.save();

  return { recipe: recipe.toObject() };
}

/**
 * Update meal plan with generated recipe
 */
async function updateMealPlanWithRecipe(mealPlanId, dayNumber, mealType, recipe) {
  const mealPlan = await MealPlan.findById(mealPlanId);
  if (!mealPlan) {
    throw new Error('Meal plan not found');
  }

  const dayIndex = dayNumber - 1;
  if (dayIndex < 0 || dayIndex >= mealPlan.days.length) {
    throw new Error('Invalid day number');
  }

  // Replace placeholder with recipe
  mealPlan.days[dayIndex].meals[mealType] = {
    recipeId: recipe._id,
    recipeTitle: recipe.recipeTitle,
    recipeDescription: recipe.recipeDescription,
    recipeDiet: recipe.recipeDiet,
    recipeImage: recipe.recipeImage,
    recipeImageVersion: recipe.imageVersion || 0,
    mealType: mealType,
    isPlaceholder: false
  };

  await mealPlan.save();
  return mealPlan.toObject();
}

/**
 * Helper functions
 */
function createMealPlanPrompt(params) {
  const { firstName, conditionTreating, therapeuticDiet, duration, includedMealTypes, dynamicPreferences, usePlaceholders } = params;
  
  let prompt = `Create a ${duration}-day meal plan for ${firstName} who has ${conditionTreating} and follows the ${therapeuticDiet} diet.`;
  
  if (dynamicPreferences) {
    prompt += ` Preferences: ${dynamicPreferences}.`;
  }
  
  prompt += ` Include meals: ${Object.keys(includedMealTypes).filter(type => includedMealTypes[type]).join(', ')}.`;
  
  if (usePlaceholders) {
    prompt += ` For each meal, provide a brief description instead of a full recipe. Focus on meal ideas and concepts rather than detailed recipes.`;
  } else {
    prompt += ` Provide complete recipes for each meal.`;
  }
  
  prompt += ` Format as JSON with days array containing meals objects.`;
  
  return prompt;
}

function parseMealPlanFromText(text, userId, params) {
  // TODO: Implement proper parsing logic
  const { duration, includedMealTypes } = params;
  
  const days = [];
  for (let i = 1; i <= duration; i++) {
    const dayMeals = {};
    
    if (includedMealTypes.breakfast) {
      dayMeals.breakfast = {
        title: `Day ${i} Breakfast`,
        description: `Breakfast idea for day ${i}`,
        isPlaceholder: true
      };
    }
    
    if (includedMealTypes.lunch) {
      dayMeals.lunch = {
        title: `Day ${i} Lunch`,
        description: `Lunch idea for day ${i}`,
        isPlaceholder: true
      };
    }
    
    if (includedMealTypes.dinner) {
      dayMeals.dinner = {
        title: `Day ${i} Dinner`,
        description: `Dinner idea for day ${i}`,
        isPlaceholder: true
      };
    }
    
    if (includedMealTypes.snack) {
      dayMeals.snack = {
        title: `Day ${i} Snack`,
        description: `Snack idea for day ${i}`,
        isPlaceholder: true
      };
    }
    
    days.push({
      dayNumber: i,
      meals: dayMeals
    });
  }
  
  return {
    user: userId,
    planName: `${duration}-Day Meal Plan`,
    primaryDiet: params.therapeuticDiet,
    duration,
    days,
    settings: {
      includedMealTypes,
      dynamicPreferences: params.dynamicPreferences || ''
    }
  };
}

function parseRecipeFromText(text, userId, placeholder) {
  // TODO: Implement proper parsing logic
  
  return {
    generatedBy: userId,
    userPrompt: placeholder.description,
    recipeTitle: placeholder.title || 'Generated Recipe',
    recipeDescription: text.substring(0, 500),
    ingredients: [],
    steps: [],
    recipeDiet: "SCD",
    mealType: placeholder.mealType || "dinner"
  };
}

function countPlaceholders(mealPlan) {
  return mealPlan.days.reduce((count, day) => {
    return count + Object.values(day.meals).filter(m => m.isPlaceholder).length;
  }, 0);
}

async function getGeminiModel(serviceType, diet_code, convo_style, temperature) {
  const systemInstructionText = await getSystemPromptForDiet(serviceType, diet_code, convo_style, temperature);
  if (!systemInstructionText) {
    throw new Error("Failed to generate system instruction for AI model.");
  }

  return {
    modelName: process.env.GEMINI_MODEL_NAME,
    systemInstruction: { parts: [{ text: systemInstructionText }] },
    generationConfig: {
      temperature: temperature,
      maxOutputTokens: 8192,
    },
  };
}

export default {
  generateMealPlanWithCredits,
  convertPlaceholderToRecipe,
  generateAllRecipesInPlan
};
