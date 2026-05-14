// backend/services/aiService.js
/*
DO NOT USE THIS FILE
*/
import * as geminiService from "./geminiService.js";
import * as anthropicService from "./anthropicService.js";
import { PREFERRED_AI_PROVIDER } from "../config/env.js";

const provider = PREFERRED_AI_PROVIDER.toUpperCase(); // Normalize to uppercase

console.log(`AI Service configured to use provider: ${provider}`);

// --- Unified Service Functions ---

const getProviderFunctions = () => {
  if (provider === "GEMINI") {
    // Ensure all expected functions exist in geminiService
    if (typeof geminiService.generateRecipeGemini !== "function")
      throw new Error("Gemini service missing generateRecipeGemini");
    // Add checks for all other functions...
    return {
      generateRecipe: geminiService.generateRecipeGemini,
      convertMeal: geminiService.convertMealGemini,
      askGuide: geminiService.askGuideGemini,
      generateMealPlan: geminiService.generateMealPlanGemini,
      checkIngredients: geminiService.checkIngredientsGemini,
      analyzeMeal: geminiService.analyzeMealGemini,
      analyzeReport: geminiService.analyzeReportGemini,
    };
  } else if (provider === "CLAUDE") {
    // Ensure all expected functions exist in anthropicService (implement them first!)
    if (typeof anthropicService.generateRecipeClaude !== "function")
      throw new Error("Anthropic service missing generateRecipeClaude");
    // Add checks for all other functions...
    // If a function is not yet implemented in Claude, throw an error or potentially fallback to Gemini if desired.
    return {
      generateRecipe: anthropicService.generateRecipeClaude,
      // convertMeal: anthropicService.convertMealClaude, // Uncomment when implemented
      // askGuide: anthropicService.askGuideClaude,       // Uncomment when implemented
      // ... map other implemented functions ...
      // Example of throwing error for unimplemented:
      convertMeal: () => {
        throw new Error(
          "Meal conversion is not yet implemented for Claude provider."
        );
      },
      askGuide: () => {
        throw new Error(
          "Ask Guide is not yet implemented for Claude provider."
        );
      },
      generateMealPlan: () => {
        throw new Error(
          "Meal Plan generation is not yet implemented for Claude provider."
        );
      },
      checkIngredients: () => {
        throw new Error(
          "Ingredient Check is not yet implemented for Claude provider."
        );
      }, // Needs Claude vision implementation
      analyzeMeal: () => {
        throw new Error(
          "Meal Analysis is not yet implemented for Claude provider."
        );
      }, // Needs Claude vision implementation
      analyzeReport: () => {
        throw new Error(
          "Report Analysis is not yet implemented for Claude provider."
        );
      }, // Needs Claude multimodal implementation
    };
  } else {
    throw new Error(
      `Unsupported AI Provider configured: ${provider}. Use 'GEMINI' or 'CLAUDE'.`
    );
  }
};

const aiFunctions = getProviderFunctions();

// Export the chosen provider's functions with unified names
export const generateRecipe = aiFunctions.generateRecipe;
export const convertMeal = aiFunctions.convertMeal;
export const askGuide = aiFunctions.askGuide;
export const generateMealPlan = aiFunctions.generateMealPlan;
export const checkIngredients = aiFunctions.checkIngredients;
export const analyzeMeal = aiFunctions.analyzeMeal;
export const analyzeReport = aiFunctions.analyzeReport;

// You could also export the provider name if needed elsewhere
export const currentProvider = provider;
