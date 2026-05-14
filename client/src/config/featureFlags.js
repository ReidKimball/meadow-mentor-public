// Feature flags configuration
// Set to true to enable a feature, false to disable it
export const FEATURE_FLAGS = {
  QUICK_START_GUIDE: true,
  HOW_TO_VIDEOS: true,
  SHOPPING_LIST: true,
  ASK_KAY: true,
  FOOD_COMPASS: true, // New feature flag for Food Compass
  RECIPE_CARD: true, // New feature flag for Recipe Card creation
  RECIPE_SERVICE: true,
  FOOD_JOURNAL: false,
  MEAL_SERVICE: false,
  MEAL_PLANNER: true, // Set to false to disable the 7-Day Meal Plan
  CHECK_INGREDIENTS: false,
  MEAL_ANALYSIS: false,
  MEDICAL_REPORT_ANALYSIS: false,
  SAVED_DOCUMENTS: false, // This will still respect premium status check
  SAVED_RECIPES: true,
  SAVED_RECIPES_PAGE: true, // New feature flag for Saved Recipes page
  NEW_FEATURE: false,
};

// For features that are disabled but should show a "Coming Soon" message
export const COMING_SOON_FEATURES = [
  //
];

export const PREMIUM_FEATURES = [
  //"MEAL_PLANNER",
  // Easy to add more premium features here in the future
];
