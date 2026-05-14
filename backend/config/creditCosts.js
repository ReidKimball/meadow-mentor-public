// backend/config/creditCosts.js

/**
 * Credit Costs Configuration
 * 
 * This file defines how many credits each feature costs.
 * Update these values to adjust pricing across the application.
 */

export const CREDIT_COSTS = {
  // Recipe Features
  CREATE_RECIPE: 2,
  MODIFY_RECIPE: 2,
  GENERATE_IMAGE: 2,
  
  // Meal Planning
  CREATE_MEAL_PLAN: 5,
  
  // Shopping List Features
  GENERATE_SHOPPING_LIST: 1,
  OPTIMIZE_SHOPPING_LIST: 1,
  
  // Analysis Features
  ANALYZE_MEAL: 1,
  ANALYZE_DOCTOR_REPORT: 1,
  JOURNAL_ANALYSIS: 1,
  CHECK_INGREDIENTS: 1,
};

/**
 * Feature-level configuration for credits
 */
export const CREDIT_FEATURES = {
  CREATE_RECIPE: {
    cost: CREDIT_COSTS.CREATE_RECIPE,
    displayName: 'Recipe Generation',
    description: 'Generate a personalized recipe',
    requiresConfirmation: true,
  },
  CHECK_INGREDIENTS: {
    cost: CREDIT_COSTS.CHECK_INGREDIENTS,
    displayName: 'Ingredient Analysis',
    description: 'Analyze an ingredient label',
    requiresConfirmation: false,
  },
  CREATE_MEAL_PLAN: {
    cost: CREDIT_COSTS.CREATE_MEAL_PLAN,
    displayName: 'Meal Plan Generation',
    description: 'Generate a weekly meal plan',
    requiresConfirmation: true,
  },
  MODIFY_RECIPE: {
    cost: CREDIT_COSTS.MODIFY_RECIPE,
    displayName: "Recipe Modification",
    description: "Modify an existing recipe",
    requiresConfirmation: true,
  },
  GENERATE_SHOPPING_LIST: {
    cost: CREDIT_COSTS.GENERATE_SHOPPING_LIST,
    displayName: 'Shopping List Update',
    description: 'Add ingredients to your shopping list',
    requiresConfirmation: true,
  },
};

/**
 * Human-readable descriptions for UI display
 */
export const CREDIT_DESCRIPTIONS = {
  CREATE_RECIPE: 'Generate a new recipe',
  MODIFY_RECIPE: 'Modify an existing recipe',
  GENERATE_IMAGE: 'Generate a recipe photo',
  CREATE_MEAL_PLAN: 'Create a weekly meal plan',
  GENERATE_SHOPPING_LIST: 'Generate AI shopping list',
  OPTIMIZE_SHOPPING_LIST: 'Optimize shopping list by store',
  ANALYZE_MEAL: 'Analyze meal for nutritional info',
  ANALYZE_DOCTOR_REPORT: 'Analyze doctor report',
  JOURNAL_ANALYSIS: 'Analyze food journal patterns',
  CHECK_INGREDIENTS: 'Check ingredient safety',
};

/**
 * Credit packages available for purchase
 */
export const CREDIT_PACKAGES = {
  SAMPLER: {
    id: 'sampler',
    name: 'The Sampler',
    credits: 10,
    price: 2.50,
    productId: 'prod_TffLDJwdGaZkU0',
    priceId: 'price_1SiK1FEK9nhVGtg7NTOHECgM',
    description: 'Perfect for trying out the app'
  },
  STARTER: {
    id: 'starter',
    name: 'The Starter',
    credits: 25,
    price: 5.00,
    productId: 'prod_TffN56X804XfiP',
    priceId: 'price_1SiK2nEK9nhVGtg73Tu1DMUR',
    description: 'Great for regular use'
  },
  HEALER: {
    id: 'healer',
    name: 'The Healer',
    credits: 100,
    price: 15.00,
    productId: 'prod_TffON11uSOL4oc',
    priceId: 'price_1SiK3QEK9nhVGtg7lNkUrqmi',
    description: 'Best value for committed users',
    popular: true
  },
  HEALTHSTYLE: {
    id: 'healthstyle',
    name: 'The Healthstyle',
    credits: 250,
    price: 30.00,
    productId: 'prod_TffPF7vCW4mUx0',
    priceId: 'price_1SiK4NEK9nhVGtg726J49XDi',
    description: 'For power users and long-term management'
  }
};

/**
 * Helper function to get cost by action type
 */
export const getCreditCost = (actionType) => {
  return CREDIT_COSTS[actionType] || 0;
};

/**
 * Helper function to get package by ID
 */
export const getCreditPackage = (packageId) => {
  if (!packageId) return null;
  return CREDIT_PACKAGES[packageId.toUpperCase()] || null;
};

/**
 * Calculate per-credit value for a package
 */
export const getCreditValue = (packageId) => {
  const pkg = getCreditPackage(packageId);
  if (!pkg) return 0;
  return pkg.price / pkg.credits;
};

export default {
  CREDIT_COSTS,
  CREDIT_DESCRIPTIONS,
  CREDIT_PACKAGES,
  getCreditCost,
  getCreditPackage,
  getCreditValue
};
