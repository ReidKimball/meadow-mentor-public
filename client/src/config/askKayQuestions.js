/**
 * @file askKayQuestions.js
 * @module config/askKayQuestions
 * @description Centralized configuration for predefined questions shown in the Ask Kay chat interface.
 * These questions are categorized by topic and are displayed to the user to help initiate conversation.
 * The `WelcomeMessage` component consumes this configuration based on the 'topic' URL search parameter.
 */

/**
 * @const {Object<string, string[]>} ASK_KAY_QUESTIONS
 * @description An object containing arrays of predefined questions for the Ask Kay feature, categorized by topic.
 * - `diet`: Questions related to therapeutic diets.
 * - `recipes`: Questions related to recipe generation.
 * - `default`: Fallback questions shown when no specific topic is selected.
 */
export const ASK_KAY_QUESTIONS = {
  diet: [
    "What kind of recipes can you make?",
    "How can I start on my therapeutic diet?",
    "What are the most important foods to avoid?",
    "Can you explain the science behind this diet?",
    "What actions can you take to help me?",
  ],
  recipes: [
    "What kind of recipes can you make?",
    "Can you give me a recipe for breakfast?",
    "Generate a recipe using chicken, broccoli, and carrots.",
  ],
  default: [
    "What kind of recipes can you make?",
    "How can I start on my therapeutic diet?",
    "What are the most important foods to avoid?",
    "Can you explain the science behind this diet?",
    "What actions can you take to help me?",
  ],
};