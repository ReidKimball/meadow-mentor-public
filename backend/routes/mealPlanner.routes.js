// mealPlanner.routes.js
import express from "express";
import {
  generateMealPlan,
  getMealPlans,
  getMealPlanById,
  getMealPlanPublishCheck,
  publishMealPlan,
  deleteMealPlan,
  updateMealPlan,
  generatePlaceholderRecipe,
  generatePlaceholderIdea,
  generateSurpriseMeal,
  saveMealPlanSettings,
  getMealPlanSettings,
  activateMealPlan,
  getActivePlanForDate,
  assignMealPlan,
  duplicateMealPlan,
  unassignMealPlanForDate,
  checkMealPlanConflicts,
} from "../controllers/mealPlanner.controller.js";
import { checkUserLimits } from "../middleware/checkUserLimits.middleware.js";

const router = express.Router();

// @route   POST /api/meal-planner/generate
// @desc    Generate a new meal plan using the LangGraph agent
// @access  Private
router.post("/generate", generateMealPlan);

// @route   POST /api/meal-planner/settings
// @desc    Save meal plan settings to user profile
// @access  Private
// NOTE: Must be before /:planId routes to avoid conflict
router.post("/settings", saveMealPlanSettings);

// @route   GET /api/meal-planner/settings
// @desc    Get meal plan settings from user profile
// @access  Private
// NOTE: Must be before /:planId routes to avoid conflict
router.get("/settings", getMealPlanSettings);

// @route   POST /api/meal-planner/check-conflicts
// @desc    Check for overlapping active meal plans
// @access  Private
// NOTE: Must be before /:planId routes to avoid conflict
router.post("/check-conflicts", checkMealPlanConflicts);

// @route   GET /api/meal-planner/active
// @desc    Get active meal plan for a specific date
// @access  Private
// NOTE: Must be before /:planId routes to avoid conflict
router.get("/active", getActivePlanForDate);

// @route   DELETE /api/meal-planner/active
// @desc    Unassign (deactivate) the active meal plan for a specific date
// @access  Private
// NOTE: Must be before /:planId routes to avoid conflict
router.delete("/active", unassignMealPlanForDate);

// @route   GET /api/meal-planner
// @desc    Get all meal plans for the authenticated user
// @access  Private
router.get("/", getMealPlans);

// @route   POST /api/meal-planner/:planId/generate-recipe
// @desc    Generate a full recipe from a placeholder meal
// @access  Private
// NOTE: Must be before /:planId routes to avoid conflict
router.post("/:planId/generate-recipe", generatePlaceholderRecipe);

// @route   POST /api/meal-planner/:planId/generate-placeholder
// @desc    Generate a placeholder meal idea for an empty meal slot
// @access  Private
// NOTE: Must be before /:planId routes to avoid conflict
router.post("/:planId/generate-placeholder", checkUserLimits, generatePlaceholderIdea);

// @route   POST /api/meal-planner/:planId/surprise-me
// @desc    Generate a surprise meal (random recipe or AI placeholder)
// @access  Private
// NOTE: Checks mealPlanner limits in controller only when AI generation is needed (not when selecting existing recipes)
router.post("/:planId/surprise-me", generateSurpriseMeal);

// @route   GET /api/meal-planner/:planId/publish-check
// @desc    Admin-only: Check if a plan contains any non-public recipes before publishing
// @access  Private (Admin only)
// NOTE: Must be before /:planId routes to avoid conflict
router.get("/:planId/publish-check", getMealPlanPublishCheck);

// @route   POST /api/meal-planner/:planId/publish
// @desc    Admin-only: Publish a plan (public/unlisted) and optionally make contained recipes public
// @access  Private (Admin only)
// NOTE: Must be before /:planId routes to avoid conflict
router.post("/:planId/publish", publishMealPlan);

// @route   GET /api/meal-planner/:planId
// @desc    Get a specific meal plan by ID
// @access  Private
router.get("/:planId", getMealPlanById);

// @route   DELETE /api/meal-planner/:planId
// @desc    Delete a meal plan by ID
// @access  Private
router.delete("/:planId", deleteMealPlan);

// @route   POST /api/meal-planner/:planId/activate
// @desc    DEPRECATED - Use /assign instead
// @access  Private
router.post("/:planId/activate", activateMealPlan);

// @route   POST /api/meal-planner/:planId/assign
// @desc    Assign a meal plan template to specific dates
// @access  Private
router.post("/:planId/assign", assignMealPlan);

// @route   POST /api/meal-planner/:planId/duplicate
// @desc    Duplicate a meal plan template (creates new template, no dates)
// @access  Private
router.post("/:planId/duplicate", duplicateMealPlan);

// @route   PATCH /api/meal-planner/:planId
// @desc    Update a meal plan (e.g., replace a meal slot)
// @access  Private
router.patch("/:planId", updateMealPlan);

export default router;
