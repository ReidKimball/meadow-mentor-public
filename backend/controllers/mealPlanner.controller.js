// mealPlanner.controller.js

/**
 * @fileoverview Controller for Weekly Meal Planner feature.
 * Handles meal plan generation using the LangGraph agent and manages
 * meal plan CRUD operations.
 */

import User from "../models/user.model.js";
import UserHealth from "../models/userHealth.model.js";
import Recipe from "../models/recipe.model.js";
import TherapeuticDiet from "../models/therapeuticDiets.model.js";
import MealPlan from "../models/mealPlan.model.js";
import CalendarAssignment from "../models/calendarAssignment.model.js";
import mongoose from "mongoose";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { runMealPlannerAgent } from "../langgraph/mealPlannerAgent.js";
import { askKayAgent, initialAgentState } from "../langgraph/askKayAgent.js";
import * as userHealthService from "../services/userHealth.service.js";
import { deductCredits, getCreditBalance, refundCredits } from "../services/credit.service.js";
import { CREDIT_FEATURES } from "../config/creditCosts.js";

/**
 * Refreshes meal plan recipe image snapshots using current Recipe image data.
 *
 * This helper compares stored `recipeImageVersion` on meal slots with
 * `Recipe.imageVersion`. When stale or missing, it updates the snapshot and
 * optionally persists the refreshed data back to the meal plan.
 *
 * @param {import("../models/mealPlan.model.js").default} mealPlan - Meal plan document to refresh.
 * @param {object} options - Refresh options.
 * @param {boolean} [options.persist=false] - When true, saves refreshed snapshots to the database.
 * @returns {Promise<object>} The updated meal plan as a plain object.
 */
const refreshMealPlanRecipeImages = async (mealPlan, { persist = false } = {}) => {
  if (!mealPlan?.days?.length) {
    return mealPlan?.toObject ? mealPlan.toObject() : mealPlan;
  }

  const recipeIdSet = new Set();
  for (const day of mealPlan.days) {
    for (const mealType of ["breakfast", "lunch", "dinner", "snack"]) {
      const meal = day?.meals?.[mealType];
      if (meal?.recipeId) {
        recipeIdSet.add(meal.recipeId.toString());
      }
    }
  }

  const recipeIds = Array.from(recipeIdSet);
  if (recipeIds.length === 0) {
    return mealPlan?.toObject ? mealPlan.toObject() : mealPlan;
  }

  const recipes = await Recipe.find(
    { _id: { $in: recipeIds } },
    { recipeImage: 1, imageVersion: 1 }
  ).lean();
  const recipeDataById = new Map(
    recipes.map((recipe) => [
      recipe._id.toString(),
      {
        recipeImage: recipe.recipeImage,
        imageVersion: recipe.imageVersion || 0,
      },
    ])
  );

  let updated = false;
  mealPlan.days.forEach((day) => {
    ["breakfast", "lunch", "dinner", "snack"].forEach((mealType) => {
      const meal = day?.meals?.[mealType];
      if (!meal?.recipeId) return;

      const recipeData = recipeDataById.get(meal.recipeId.toString());
      if (!recipeData) return;

      const snapshotVersion = meal.recipeImageVersion || 0;
      const latestVersion = recipeData.imageVersion || 0;
      const snapshotHasImage =
        meal.recipeImage?.thumbnail ||
        meal.recipeImage?.display ||
        meal.recipeImage?.original;
      const shouldRefresh = latestVersion !== snapshotVersion || !snapshotHasImage;

      if (shouldRefresh) {
        meal.recipeImage = recipeData.recipeImage;
        meal.recipeImageVersion = latestVersion;
        updated = true;
      }
    });
  });

  if (updated && persist && mealPlan?.markModified) {
    mealPlan.markModified("days");
    await mealPlan.save();
  }

  return mealPlan?.toObject ? mealPlan.toObject() : mealPlan;
};

/**
 * Generates a new meal plan template using the LangGraph agent
 * NO LONGER REQUIRES startDate - creates a reusable template
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
export const generateMealPlan = async (req, res) => {
  try {
    console.log("=== Generate Meal Plan Template Request ===");
    const firebaseUID = req.user.uid; // From verifyFirebaseToken middleware
    const { settings, confirm } = req.body;

    // Validate required fields
    if (!settings) {
      return res.status(400).json({
        error: "Missing required field: settings is required.",
      });
    }

    console.log("Settings:", settings);
    console.log("Creating template (no specific dates)");

    // Get merged user data (User + UserHealth) using centralized service
    const mergedUser = await userHealthService.getMergedUserData(firebaseUID);
    if (!mergedUser) {
      return res.status(404).json({ error: "User not found." });
    }

    const shouldShowCreditSpendConfirmations =
      typeof mergedUser?.preferences?.showCreditSpendConfirmations === "boolean"
        ? mergedUser.preferences.showCreditSpendConfirmations
        : true;
    const shouldAutoConfirmCredits = shouldShowCreditSpendConfirmations === false;

    // Fetch therapeutic diet guidelines
    const diet = await TherapeuticDiet.findOne({ diet_code: mergedUser.primaryDiet });
    const formattedGuidelines =
      diet && diet.general_guidelines.length > 0
        ? diet.general_guidelines.map((line) => `- ${line}`).join("\n")
        : "No specific dietary guidelines were found.";

    // Prepare user profile for agent
    const userProfile = {
      userId: mergedUser._id,
      firstName: mergedUser.firstName,
      primaryDiet: mergedUser.primaryDiet,
      dietaryRestrictions: mergedUser.dietaryRestrictions || [],
      customDietaryRestrictions: mergedUser.customDietaryRestrictions || [],
      conditionTreating: mergedUser.conditionTreating || 'Not specified',
      inFlare: mergedUser.inFlare || false,
      formattedGuidelines,
    };

    console.log("User Profile:", userProfile);

    // Fetch user's saved recipes AND public community recipes matching their diet
    const savedRecipes = await Recipe.find({
      $or: [
        { savedBy: mergedUser._id }, // User's saved recipes
        { 
          visibility: 'public',
          recipeDiet: mergedUser.primaryDiet // Public recipes matching user's diet
        }
      ]
    }).lean();

    console.log(`Found ${savedRecipes.length} total recipes (saved + public) for user`);

    // --- Credit System Integration ---
    const ACTION_TYPE = 'CREATE_MEAL_PLAN';
    const featureConfig = CREDIT_FEATURES[ACTION_TYPE];
    let creditDeducted = false;

    if (featureConfig) {
      const creditBalance = await getCreditBalance(mergedUser._id);
      const isConfirmed = !!confirm || shouldAutoConfirmCredits;
      
      if (!isConfirmed) {
        // Pre-flight check
        if (creditBalance < featureConfig.cost) {
          return res.status(200).json({
            insufficientCredits: true,
            cost: featureConfig.cost,
            balance: creditBalance,
            featureName: featureConfig.displayName
          });
        } else {
          return res.status(200).json({
            requiresConfirmation: true,
            cost: featureConfig.cost,
            balance: creditBalance,
            featureName: featureConfig.displayName
          });
        }
      }

      // User confirmed, proceed to deduct
      // deductCredits throws error if insufficient, so we just await it.
      // It returns the new balance.
      try {
        await deductCredits(mergedUser._id, featureConfig.cost, ACTION_TYPE);
        creditDeducted = true;
        console.log(`Deducted ${featureConfig.cost} credits for meal plan generation`);
      } catch (deductionError) {
        return res.status(402).json({
          error: "Insufficient credits",
          details: deductionError.message
        });
      }
    }
    // -------------------------------

    // Run the meal planner agent
    // Pass null for startDate since we're creating a template
    const result = await runMealPlannerAgent(
      userProfile,
      settings,
      null, // No start date for templates
      savedRecipes
    );

    if (!result.success) {
      console.error("Agent failed:", result.error);
      throw new Error(result.error); // Throw to trigger catch block and refund
    }

    console.log("Meal plan generated successfully");

    // Save meal plan template to database
    const mealPlanData = {
      user: mergedUser._id,
      planName: result.mealPlan.planName,
      primaryDiet: mergedUser.primaryDiet,
      duration: settings.planDuration,
      days: result.mealPlan.days, // Should have dayNumber, not date
      settings: result.mealPlan.settings,
      timesUsed: 0,
      lastUsedDate: null,
    };

    const savedMealPlan = await MealPlan.create(mealPlanData);
    console.log("Meal plan template saved to database with ID:", savedMealPlan._id);
    console.log("Template duration:", savedMealPlan.duration, "days");

    return res.status(200).json({
      success: true,
      mealPlan: {
        ...result.mealPlan,
        _id: savedMealPlan._id,
      },
      statusUpdates: result.statusUpdates,
    });
  } catch (error) {
    console.error("Error in generateMealPlan:", error);

    // Credit System: Refund if generation failed after deduction
    try {
      if (typeof creditDeducted !== 'undefined' && creditDeducted === true) {
        const firebaseUID = req.user.uid;
        const userForRefund = await User.findOne({ firebaseUID });
        if (userForRefund) {
          const ACTION_TYPE = 'CREATE_MEAL_PLAN';
          const featureConfig = CREDIT_FEATURES[ACTION_TYPE];
          await refundCredits(userForRefund._id, featureConfig.cost, ACTION_TYPE);
          console.log(`Refunded ${featureConfig.cost} credits due to generation failure`);
        }
      }
    } catch (refundErr) {
      console.error("CRITICAL: Failed to refund credits after error:", refundErr);
    }

    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

/**
 * @function getPublicMealPlans
 * @description Returns a list of **public** meal plan templates for SEO/marketing pages.
 *
 * This endpoint is intentionally **unauthenticated** and should only return meal plans
 * that are safe for public rendering.
 *
 * @route GET /api/public-meal-plans
 * @access Public
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @returns {Promise<void>} Sends a JSON response.
 */
export const getPublicMealPlans = async (req, res) => {
  try {
    const mealPlans = await MealPlan.find(
      { visibility: "public", slug: { $exists: true, $type: "string", $ne: "" } },
      { planName: 1, slug: 1, duration: 1, createdAt: 1, updatedAt: 1 }
    ).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: mealPlans });
  } catch (error) {
    console.error("Error fetching public meal plans:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching public meal plans",
      error: error.message,
    });
  }
};

/**
 * @function getPublicMealPlanBySlug
 * @description Returns a single **public or unlisted** meal plan template by slug.
 *
 * Privacy & safety rules:
 * - Only returns plans where `visibility` is `public` or `unlisted`.
 * - For meals that reference a `recipeId`, the response only includes a `recipeSlug`
 *   when the linked recipe is actually public (`isPublic: true`).
 *
 * @route GET /api/public-meal-plans/slug/:slug
 * @access Public
 * @param {object} req - Express request object.
 * @param {object} req.params - Route params.
 * @param {string} req.params.slug - The meal plan slug.
 * @param {object} res - Express response object.
 * @returns {Promise<void>} Sends a JSON response.
 */
export const getPublicMealPlanBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const mealPlan = await MealPlan.findOne({
      slug,
      visibility: { $in: ["public", "unlisted"] },
    });

    if (!mealPlan) {
      return res.status(404).json({ success: false, message: "Public meal plan not found." });
    }

    const refreshedMealPlan = await refreshMealPlanRecipeImages(mealPlan, { persist: true });

    const recipeIdSet = new Set();
    for (const day of refreshedMealPlan.days || []) {
      for (const mealType of ["breakfast", "lunch", "dinner", "snack"]) {
        const meal = day?.meals?.[mealType];
        if (meal?.recipeId) {
          recipeIdSet.add(meal.recipeId.toString());
        }
      }
    }

    const recipeIds = Array.from(recipeIdSet);
    const publicRecipes = recipeIds.length
      ? await Recipe.find(
          {
            _id: { $in: recipeIds },
            $or: [
              { visibility: { $in: ['public', 'unlisted'] } },
              { isPublic: true },
            ],
          },
          { slug: 1 }
        ).lean()
      : [];
    const recipeSlugById = new Map(
      publicRecipes.map((recipe) => [recipe._id.toString(), recipe.slug])
    );

    const safeDays = (refreshedMealPlan.days || []).map((day) => {
      const nextMeals = { ...day.meals };
      for (const mealType of ["breakfast", "lunch", "dinner", "snack"]) {
        const meal = nextMeals?.[mealType];
        if (meal?.recipeId) {
          nextMeals[mealType] = {
            ...meal,
            recipeSlug: recipeSlugById.get(meal.recipeId.toString()) || null,
          };
        }
      }

      return {
        ...day,
        meals: nextMeals,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        ...refreshedMealPlan,
        days: safeDays,
      },
    });
  } catch (error) {
    console.error("Error fetching public meal plan by slug:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching public meal plan",
      error: error.message,
    });
  }
};

/**
 * Gets publish readiness info for a meal plan template.
 *
 * Admin-only endpoint used by the client UI to determine whether a meal plan contains
 * any non-public recipes that must be made public before publishing the meal plan.
 *
 * @param {object} req - Express request object.
 * @param {object} req.params - Route params.
 * @param {string} req.params.planId - MongoDB ObjectId for the meal plan template.
 * @param {object} res - Express response object.
 * @returns {Promise<void>} Sends a JSON response.
 */
export const getMealPlanPublishCheck = async (req, res) => {
  try {
    const firebaseUID = req.user.uid;
    const { planId } = req.params;

    const user = await User.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (!user.isAdmin) {
      return res.status(403).json({ error: "Forbidden - Admin access required" });
    }

    const mealPlan = await MealPlan.findOne({ _id: planId, user: user._id });
    if (!mealPlan) {
      return res.status(404).json({ error: "Meal plan not found." });
    }

    const recipeIdSet = new Set();
    for (const day of mealPlan.days || []) {
      for (const mealType of ["breakfast", "lunch", "dinner", "snack"]) {
        const meal = day?.meals?.[mealType];
        if (meal?.recipeId) {
          recipeIdSet.add(meal.recipeId.toString());
        }
      }
    }

    const recipeIds = Array.from(recipeIdSet);
    if (recipeIds.length === 0) {
      return res.status(200).json({
        success: true,
        nonPublicRecipes: [],
      });
    }

    const nonPublicRecipes = await Recipe.find(
      {
        _id: { $in: recipeIds },
        $or: [
          { visibility: 'private' },
          { visibility: { $exists: false }, isPublic: false },
        ],
      },
      { recipeTitle: 1, slug: 1, visibility: 1, isPublic: 1 }
    );

    return res.status(200).json({
      success: true,
      nonPublicRecipes,
    });
  } catch (error) {
    console.error("Error in getMealPlanPublishCheck:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

/**
 * Publishes a meal plan template for sharing.
 *
 * Admin-only endpoint that can optionally set any *private* recipes used in the plan to
 * `visibility: "unlisted"` or `visibility: "public"` before setting the meal plan visibility
 * to `public` or `unlisted`.
 *
 * @param {object} req - Express request object.
 * @param {object} req.params - Route params.
 * @param {string} req.params.planId - MongoDB ObjectId for the meal plan template.
 * @param {object} req.body - Request body.
 * @param {string} req.body.visibility - Target visibility: `public` or `unlisted`.
 * @param {string} req.body.slug - Slug to use for the plan.
 * @param {('public'|'unlisted')} [req.body.recipesVisibility] - If provided, any private recipes in the plan will be updated to this visibility.
 * @param {boolean} [req.body.makeRecipesPublic] - Legacy flag. If true, equivalent to `recipesVisibility: "public"`.
 * @param {object} res - Express response object.
 * @returns {Promise<void>} Sends a JSON response.
 */
export const publishMealPlan = async (req, res) => {
  try {
    const firebaseUID = req.user.uid;
    const { planId } = req.params;
    const { visibility, slug, makeRecipesPublic, recipesVisibility } = req.body || {};

    const user = await User.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (!user.isAdmin) {
      return res.status(403).json({ error: "Forbidden - Admin access required" });
    }

    if (!["public", "unlisted"].includes(visibility)) {
      return res.status(400).json({ error: "Invalid visibility value." });
    }

    const normalizedSlug = typeof slug === "string" ? slug.trim() : "";

    const mealPlan = await MealPlan.findOne({ _id: planId, user: user._id });
    if (!mealPlan) {
      return res.status(404).json({ error: "Meal plan not found." });
    }

    const recipeIdSet = new Set();
    for (const day of mealPlan.days || []) {
      for (const mealType of ["breakfast", "lunch", "dinner", "snack"]) {
        const meal = day?.meals?.[mealType];
        if (meal?.recipeId) {
          recipeIdSet.add(meal.recipeId.toString());
        }
      }
    }

    const recipeIds = Array.from(recipeIdSet);
    const privateRecipes = recipeIds.length
      ? await Recipe.find(
          { _id: { $in: recipeIds }, visibility: 'private' },
          { recipeTitle: 1, slug: 1, visibility: 1, isPublic: 1 }
        )
      : [];

    const targetRecipesVisibility = (() => {
      if (typeof recipesVisibility === 'string' && ['public', 'unlisted'].includes(recipesVisibility)) {
        return recipesVisibility;
      }

      if (makeRecipesPublic === true) return 'public';
      return null;
    })();

    if (privateRecipes.length > 0 && !targetRecipesVisibility) {
      return res.status(409).json({
        error: "Meal plan contains private recipes.",
        privateRecipes,
      });
    }

    if (privateRecipes.length > 0 && targetRecipesVisibility) {
      await Recipe.updateMany(
        { _id: { $in: privateRecipes.map((r) => r._id) } },
        { $set: { visibility: targetRecipesVisibility, isPublic: targetRecipesVisibility === 'public' } }
      );
    }

    // Ensure any externally visible recipes used in this plan have a slug.
    // Note: `updateMany` bypasses Mongoose hooks, so we explicitly save recipes missing slugs.
    if (recipeIds.length > 0) {
      const recipesMissingSlugs = await Recipe.find({
        _id: { $in: recipeIds },
        visibility: { $in: ['public', 'unlisted'] },
        $or: [
          { slug: { $exists: false } },
          { slug: null },
          { slug: '' },
        ],
      });

      for (const recipe of recipesMissingSlugs) {
        await recipe.save();
      }
    }

    mealPlan.visibility = visibility;
    if (normalizedSlug) {
      mealPlan.slug = normalizedSlug;
    } else {
      mealPlan.slug = undefined;
    }

    await mealPlan.save();

    return res.status(200).json({
      success: true,
      mealPlan,
    });
  } catch (error) {
    if (error?.code === 11000 && error?.keyPattern?.slug) {
      return res.status(409).json({
        error: "Slug already exists.",
      });
    }

    console.error("Error in publishMealPlan:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

/**
 * Gets all meal plans for the authenticated user
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
export const getMealPlans = async (req, res) => {
  try {
    console.log("=== Get Meal Plans Request ===");
    const firebaseUID = req.user.uid;

    // Get user from database
    const user = await User.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    console.log("Fetching meal plans for user:", firebaseUID);

    // Fetch all meal plans for this user
    const mealPlans = await MealPlan.getUserPlans(user._id);
    console.log(`Found ${mealPlans.length} meal plans`);

    const refreshedMealPlans = await Promise.all(
      mealPlans.map((mealPlan) => refreshMealPlanRecipeImages(mealPlan, { persist: true }))
    );

    return res.status(200).json({
      success: true,
      count: refreshedMealPlans.length,
      mealPlans: refreshedMealPlans,
    });
  } catch (error) {
    console.error("Error in getMealPlans:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

/**
 * Gets a specific meal plan by ID
 *
 * This is a *template* fetch endpoint (not a calendar assignment fetch). It enforces
 * ownership by resolving the authenticated Firebase UID to the local `User` document
 * and only returning meal plans that belong to that user.
 *
 * @param {object} req - Express request object.
 * @param {object} req.params - Route params.
 * @param {string} req.params.planId - MongoDB ObjectId for the meal plan template.
 * @param {object} res - Express response object.
 * @returns {Promise<void>} Sends a JSON response.
 */
export const getMealPlanById = async (req, res) => {
  try {
    console.log("=== Get Meal Plan By ID Request ===");
    const firebaseUID = req.user.uid;
    const { planId } = req.params;

    console.log("Fetching meal plan:", planId, "for user:", firebaseUID);

    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return res.status(400).json({
        error: "Invalid meal plan id.",
      });
    }

    // Get user from database (ownership enforcement)
    const user = await User.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Fetch the meal plan template owned by this user
    const mealPlan = await MealPlan.findOne({ _id: planId, user: user._id });
    if (!mealPlan) {
      return res.status(404).json({ error: "Meal plan not found." });
    }

    const refreshedMealPlan = await refreshMealPlanRecipeImages(mealPlan, { persist: true });

    return res.status(200).json({
      success: true,
      mealPlan: refreshedMealPlan,
    });
  } catch (error) {
    console.error("Error in getMealPlanById:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

/**
 * Deletes a meal plan by ID
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
export const deleteMealPlan = async (req, res) => {
  try {
    console.log("=== Delete Meal Plan Request ===");
    const firebaseUID = req.user.uid;
    const { planId } = req.params;

    console.log("Deleting meal plan:", planId, "for user:", firebaseUID);

    // Get user from database
    const user = await User.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Find and delete the meal plan
    const mealPlan = await MealPlan.findOneAndDelete({
      _id: planId,
      user: user._id,
    });

    if (!mealPlan) {
      return res.status(404).json({ error: "Meal plan not found." });
    }

    console.log("Meal plan deleted successfully");

    return res.status(200).json({
      success: true,
      message: "Meal plan deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteMealPlan:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

/**
 * Updates a meal plan (e.g., replacing a meal slot, changing isActive status)
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
export const updateMealPlan = async (req, res) => {
  try {
    console.log("=== Update Meal Plan Request ===");
    const firebaseUID = req.user.uid;
    const { planId } = req.params;
    const { dayIndex, mealType, updates, ...otherUpdates } = req.body;

    console.log("Updating meal plan:", planId);
    console.log("Request body:", req.body);

    // Get user from database
    const user = await User.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Admin-only: visibility / slug updates (public & unlisted sharing)
    if (Object.prototype.hasOwnProperty.call(otherUpdates, "visibility")) {
      const { visibility } = otherUpdates;
      const validVisibilityValues = ["private", "unlisted", "public"];

      if (!validVisibilityValues.includes(visibility)) {
        return res.status(400).json({ error: "Invalid visibility value." });
      }

      if (visibility !== "private" && !user.isAdmin) {
        return res.status(403).json({ error: "Forbidden - Admin access required" });
      }
    }

    if (Object.prototype.hasOwnProperty.call(otherUpdates, "slug")) {
      if (!user.isAdmin) {
        return res.status(403).json({ error: "Forbidden - Admin access required" });
      }

      const { slug } = otherUpdates;
      if (slug === null) {
        otherUpdates.slug = undefined;
      } else if (typeof slug === "string") {
        const trimmed = slug.trim();
        otherUpdates.slug = trimmed.length > 0 ? trimmed : undefined;
      } else {
        return res.status(400).json({ error: "Invalid slug value." });
      }
    }

    // Find the meal plan and verify ownership
    const mealPlan = await MealPlan.findOne({ _id: planId, user: user._id });
    if (!mealPlan) {
      return res.status(404).json({ error: "Meal plan not found." });
    }

    console.log("Meal plan found, applying updates...");

    // Check if this is a specific meal update (has dayIndex and mealType)
    // Note: updates can be null (to clear a meal), so check for !== undefined instead of truthiness
    if (dayIndex !== undefined && mealType && updates !== undefined) {
      console.log(`Updating meal at day ${dayIndex}, meal type: ${mealType}`);
      console.log("Meal updates:", updates);

      if (updates && updates.recipeId && updates.recipeImage && updates.recipeImageVersion === undefined) {
        const recipeSnapshot = await Recipe.findById(updates.recipeId, { imageVersion: 1 }).lean();
        updates.recipeImageVersion = recipeSnapshot?.imageVersion || 0;
      }

      // Verify day exists
      if (!mealPlan.days[dayIndex]) {
        return res.status(400).json({ error: "Invalid day index." });
      }

      // Verify meal type is valid
      const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
      if (!validMealTypes.includes(mealType)) {
        return res.status(400).json({ error: "Invalid meal type." });
      }

      // If updates is null, clear the meal slot
      if (updates === null) {
        console.log(`Clearing meal slot for ${mealType}`);
        console.log(`Before clear:`, mealPlan.days[dayIndex].meals[mealType]);
        mealPlan.days[dayIndex].meals[mealType] = null;
        console.log(`After clear:`, mealPlan.days[dayIndex].meals[mealType]);
      } else if (!mealPlan.days[dayIndex].meals[mealType]) {
        // If meal is null (empty slot), initialize it with the updates
        console.log(`Meal slot is empty, creating new meal for ${mealType}`);
        mealPlan.days[dayIndex].meals[mealType] = updates;
      } else {
        // Apply updates to the existing meal
        Object.keys(updates).forEach((key) => {
          mealPlan.days[dayIndex].meals[mealType][key] = updates[key];
        });
      }

      // Mark the path as modified for Mongoose to detect the change
      mealPlan.markModified('days');
      console.log(`Marked 'days' as modified for Mongoose`);
    } else {
      // General plan updates (e.g., planName, settings, etc.)
      console.log("Applying general plan updates");
      Object.keys(otherUpdates).forEach((key) => {
        mealPlan[key] = otherUpdates[key];
      });
    }

    console.log("Saving meal plan to database...");
    await mealPlan.save();

    console.log("Meal plan updated successfully");
    console.log("Updated meal plan ID:", mealPlan._id);

    return res.status(200).json({
      success: true,
      message: "Meal plan updated successfully",
      mealPlan: {
        ...mealPlan.toObject(),
        _id: mealPlan._id.toString(),
      },
    });
  } catch (error) {
    if (error?.code === 11000 && error?.keyPattern?.slug) {
      return res.status(409).json({
        error: "Slug already exists.",
      });
    }
    console.error("Error in updateMealPlan:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

/**
 * Saves meal plan settings to user profile
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
export const saveMealPlanSettings = async (req, res) => {
  try {
    console.log("=== Save Meal Plan Settings Request ===");
    const firebaseUID = req.user.uid;
    const { settings } = req.body;

    console.log("Settings:", settings);

    // Get user from database
    const user = await User.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Update settings
    user.weeklyMealPlanSettings = settings;
    await user.save();

    console.log("Settings saved successfully");

    return res.status(200).json({
      success: true,
      settings: user.weeklyMealPlanSettings,
      message: "Settings saved successfully",
    });
  } catch (error) {
    console.error("Error in saveMealPlanSettings:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

/**
 * Gets meal plan settings from user profile
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
export const getMealPlanSettings = async (req, res) => {
  try {
    console.log("=== Get Meal Plan Settings Request ===");
    const firebaseUID = req.user.uid;

    // Get user from database
    const user = await User.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    console.log("Settings retrieved:", user.weeklyMealPlanSettings);

    return res.status(200).json({
      success: true,
      settings: user.weeklyMealPlanSettings,
    });
  } catch (error) {
    console.error("Error in getMealPlanSettings:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

/**
 * DEPRECATED: Use assignMealPlan instead
 * Old method for activating plans (kept for backward compatibility)
 */
export const activateMealPlan = async (req, res) => {
  console.warn("activateMealPlan is DEPRECATED - use assignMealPlan instead");
  return res.status(400).json({
    error: "This endpoint is deprecated. Use POST /api/meal-planner/:planId/assign instead",
  });
};

/**
 * Assigns a meal plan template to specific dates
 * Creates a CalendarAssignment and optionally deactivates overlapping plans
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
export const assignMealPlan = async (req, res) => {
  try {
    console.log("=== Assign Meal Plan Request ===");
    const firebaseUID = req.user.uid;
    const { planId } = req.params;
    const { startDate, makeActive } = req.body;

    console.log("Plan ID:", planId);
    console.log("Start Date:", startDate);
    console.log("Make Active:", makeActive);

    // Validate required fields
    if (!startDate) {
      return res.status(400).json({
        error: "Missing required field: startDate is required.",
      });
    }

    // Get user from database
    const user = await User.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Find the meal plan template
    const mealPlan = await MealPlan.findOne({ _id: planId, user: user._id });
    if (!mealPlan) {
      return res.status(404).json({ error: "Meal plan not found." });
    }

    console.log("Meal plan template found:", mealPlan.planName);
    console.log("Duration:", mealPlan.duration, "days");

    // Normalize dates to start of day (UTC midnight)
    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + mealPlan.duration - 1);
    end.setUTCHours(23, 59, 59, 999);

    console.log("Assignment date range (normalized):", start, "to", end);

    // If makeActive is true, deactivate overlapping assignments
    if (makeActive) {
      console.log("Deactivating overlapping assignments...");
      await CalendarAssignment.deactivateOverlapping(user._id, start, end);
    }

    // Create the calendar assignment
    const assignment = new CalendarAssignment({
      user: user._id,
      mealPlanId: mealPlan._id,
      startDate: start,
      endDate: end,
      isActive: makeActive !== false, // Default to true
    });

    // Generate day mappings
    assignment.dayMappings = assignment.generateDayMappings(mealPlan.duration);
    await assignment.save();

    console.log("Calendar assignment created:", assignment._id);

    // Update meal plan usage tracking
    await mealPlan.recordUsage(start);

    console.log("Meal plan assigned successfully");

    return res.status(201).json({
      success: true,
      message: "Meal plan assigned successfully",
      assignment,
      mealPlan: {
        _id: mealPlan._id,
        planName: mealPlan.planName,
        duration: mealPlan.duration,
        timesUsed: mealPlan.timesUsed,
        lastUsedDate: mealPlan.lastUsedDate,
      },
    });
  } catch (error) {
    console.error("Error in assignMealPlan:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

/**
 * Checks for overlapping active meal plans
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
export const checkMealPlanConflicts = async (req, res) => {
  try {
    console.log("=== Check Meal Plan Conflicts Request ===");
    const firebaseUID = req.user.uid;
    const { startDate, endDate } = req.body;

    console.log("Checking conflicts for date range:", startDate, "to", endDate);

    // Get user from database
    const user = await User.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Find overlapping active plans
    const overlappingPlans = await MealPlan.findOverlappingActivePlans(
      user._id,
      new Date(startDate),
      new Date(endDate)
    );

    console.log("Found", overlappingPlans.length, "overlapping plans");

    return res.status(200).json({
      success: true,
      hasConflicts: overlappingPlans.length > 0,
      overlappingPlans: overlappingPlans.map(plan => ({
        _id: plan._id,
        planName: plan.planName,
        startDate: plan.startDate,
        endDate: plan.endDate,
      })),
    });
  } catch (error) {
    console.error("Error in checkMealPlanConflicts:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

/**
 * Gets the active meal plan for a specific date (NEW: uses CalendarAssignment)
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
export const getActivePlanForDate = async (req, res) => {
  try {
    console.log("=== Get Active Plan For Date Request ===");
    const firebaseUID = req.user.uid;
    const { date } = req.query;

    console.log("Getting active plan for date:", date);

    // Get user from database
    const user = await User.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Find active assignment for the date
    const activeAssignment = await CalendarAssignment.getActiveAssignmentForDate(
      user._id,
      new Date(date)
    );

    if (!activeAssignment) {
      console.log("No active assignment for this date");
      return res.status(200).json({
        success: true,
        mealPlan: null,
        message: "No active plan for this date",
      });
    }

    console.log("Found active assignment:", activeAssignment._id);
    
    // The assignment should have populated mealPlanId
    const mealPlan = activeAssignment.mealPlanId;
    
    if (!mealPlan) {
      console.error("Assignment found but meal plan was deleted (orphaned assignment)");
      console.log("Deleting orphaned assignment:", activeAssignment._id);
      
      // Delete the orphaned assignment
      await CalendarAssignment.findByIdAndDelete(activeAssignment._id);
      
      return res.status(200).json({
        success: true,
        mealPlan: null,
        message: "No active plan for this date (orphaned assignment cleaned up)",
      });
    }
    
    console.log("Meal plan ID:", mealPlan._id);

    // Return the meal plan with assignment info
    const refreshedMealPlan = await refreshMealPlanRecipeImages(mealPlan, { persist: true });

    return res.status(200).json({
      success: true,
      mealPlan: {
        ...refreshedMealPlan,
        assignmentId: activeAssignment._id,
        assignmentStartDate: activeAssignment.startDate,
        assignmentEndDate: activeAssignment.endDate,
      },
    });
  } catch (error) {
    console.error("Error in getActivePlanForDate:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

/**
 * Duplicates a meal plan template (creates a new template, no dates)
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
export const duplicateMealPlan = async (req, res) => {
  try {
    console.log("=== Duplicate Meal Plan Template Request ===");
    const firebaseUID = req.user.uid;
    const { planId } = req.params;

    console.log("Plan ID:", planId);

    // Get user from database
    const user = await User.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Find the original meal plan template
    const originalPlan = await MealPlan.findOne({ _id: planId, user: user._id });
    if (!originalPlan) {
      return res.status(404).json({ error: "Meal plan not found." });
    }

    console.log("Original plan found:", originalPlan.planName);
    console.log("Duration:", originalPlan.duration, "days");

    // Deep copy the days array (with dayNumber, not dates)
    const newDays = originalPlan.days.map((day) => ({
      dayNumber: day.dayNumber,
      meals: {
        breakfast: day.meals.breakfast ? { ...day.meals.breakfast.toObject() } : null,
        lunch: day.meals.lunch ? { ...day.meals.lunch.toObject() } : null,
        dinner: day.meals.dinner ? { ...day.meals.dinner.toObject() } : null,
        snack: day.meals.snack ? { ...day.meals.snack.toObject() } : null,
      }
    }));

    // Create the duplicated template
    const duplicatedPlan = new MealPlan({
      user: user._id,
      planName: `${originalPlan.planName} (Copy)`,
      duration: originalPlan.duration,
      days: newDays,
      settings: originalPlan.settings,
      timesUsed: 0,
      lastUsedDate: null,
    });

    await duplicatedPlan.save();

    console.log("Duplicated template created:", duplicatedPlan._id);

    return res.status(201).json({
      success: true,
      message: "Meal plan template duplicated successfully",
      mealPlan: duplicatedPlan,
    });
  } catch (error) {
    console.error("Error in duplicateMealPlan:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

/**
 * Generates a full recipe from a placeholder in a meal plan
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
/**
 * Generate a single AI placeholder meal for Surprise Me feature
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
export const generateSurpriseMeal = async (req, res) => {
  try {
    console.log("=== Generate Surprise Meal Request ===");
    const firebaseUID = req.user.uid;
    const { planId } = req.params;
    const { dayIndex, mealType } = req.body;

    console.log("Plan ID:", planId);
    console.log("Day Index:", dayIndex);
    console.log("Meal Type:", mealType);
    console.log("Request body:", req.body);
    
    if (dayIndex === undefined || !mealType) {
      console.error("Missing required fields");
      return res.status(400).json({ 
        error: "Missing required fields",
        details: "dayIndex and mealType are required"
      });
    }

    // Get merged user data (User + UserHealth) using centralized service
    const mergedUser = await userHealthService.getMergedUserData(firebaseUID);
    if (!mergedUser) {
      return res.status(404).json({ error: "User not found." });
    }

    // Get meal plan to access settings
    const mealPlan = await MealPlan.findOne({ _id: planId, user: mergedUser._id });
    if (!mealPlan) {
      return res.status(404).json({ error: "Meal plan not found." });
    }

    // Get user's saved recipes AND public community recipes matching their diet
    const savedRecipes = await Recipe.find({
      $or: [
        { savedBy: mergedUser._id }, // User's saved recipes
        { 
          isPublic: true, 
          recipeDiet: mergedUser.primaryDiet // Public recipes matching user's diet
        }
      ]
    });

    // Filter recipes by mealType and diet
    const eligibleRecipes = savedRecipes.filter((recipe) => {
      const matchesMealType = recipe.mealType?.toLowerCase() === mealType.toLowerCase();
      const matchesDiet = recipe.recipeDiet === mergedUser.primaryDiet;
      return matchesMealType && matchesDiet;
    });

    console.log(`Found ${eligibleRecipes.length} eligible recipes (saved + public) for ${mealType}`);

    if (eligibleRecipes.length > 0) {
      // Randomly select a recipe
      const selectedRecipe = eligibleRecipes[Math.floor(Math.random() * eligibleRecipes.length)];
      console.log("Selected random recipe:", selectedRecipe.recipeTitle);

      // Update the meal plan
      const day = mealPlan.days[dayIndex];
      day.meals[mealType] = {
        recipeId: selectedRecipe._id,
        recipeTitle: selectedRecipe.recipeTitle,
        recipeDescription: selectedRecipe.recipeDescription,
        recipeDiet: selectedRecipe.recipeDiet,
        recipeImage: selectedRecipe.recipeImage,
        recipeImageVersion: selectedRecipe.imageVersion || 0,
        mealType: selectedRecipe.mealType,
        isPlaceholder: false,
      };

      await mealPlan.save();

      return res.status(200).json({
        success: true,
        meal: day.meals[mealType],
        message: "Surprise meal selected",
      });
    } else {
      // No recipes found, generate AI placeholder using meal planner agent
      console.log("No eligible recipes, checking API limits before AI generation");
      
      // Check mealPlanner limits before generating AI placeholder
      const serviceLimitInfo = user.apiUsage?.limits?.mealPlanner;
      
      if (!serviceLimitInfo || serviceLimitInfo.remaining <= 0) {
        console.log("Meal planner API limit reached");
        return res.status(429).json({
          message: "Meal planner limit reached. Please try again later or upgrade your plan.",
          error: "API limit reached for mealPlanner",
          remainingRequests: serviceLimitInfo?.remaining || 0,
        });
      }
      
      // Decrement the limit
      await User.findByIdAndUpdate(
        user._id,
        { $inc: { 'apiUsage.limits.mealPlanner.remaining': -1 } }
      );
      
      console.log("API limit checked and decremented. Generating AI placeholder...");

      // Get therapeutic diet guidelines
      const diet = await TherapeuticDiet.findOne({ diet_code: mergedUser.primaryDiet });
      const formattedGuidelines =
        diet && diet.general_guidelines.length > 0
          ? diet.general_guidelines.map((line) => `- ${line}`).join("\n")
          : "No specific dietary guidelines were found.";

      // Prepare user profile for agent
      const userProfile = {
        firstName: mergedUser.firstName,
        primaryDiet: mergedUser.primaryDiet,
        dietaryRestrictions: mergedUser.dietaryRestrictions || [],
        customDietaryRestrictions: mergedUser.customDietaryRestrictions || [],
        conditionTreating: mergedUser.conditionTreating || 'Not specified',
        inFlare: mergedUser.inFlare || false,
        formattedGuidelines,
      };

      // Use meal planner agent to generate placeholder
      const agentInput = {
        userProfile,
        settings: mealPlan.settings,
        savedRecipes: [],
        duration: 1,
        mealTypesToGenerate: [mealType],
      };

      const result = await runMealPlannerAgent(agentInput);
      
      if (result.mealPlan && result.mealPlan.days[0]?.meals[mealType]) {
        const generatedMeal = result.mealPlan.days[0].meals[mealType];
        
        // Update the meal plan
        const day = mealPlan.days[dayIndex];
        day.meals[mealType] = generatedMeal;
        
        await mealPlan.save();

        return res.status(200).json({
          success: true,
          meal: generatedMeal,
          message: "AI placeholder generated",
        });
      } else {
        throw new Error("Failed to generate placeholder");
      }
    }
  } catch (error) {
    console.error("Error in generateSurpriseMeal:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

export const generatePlaceholderRecipe = async (req, res) => {
  let mergedUser = null;
  let creditDeducted = false;
  const ACTION_TYPE = 'CREATE_RECIPE';
  const featureConfig = CREDIT_FEATURES[ACTION_TYPE];
  try {
    console.log("=== Generate Placeholder Recipe Request ===");
    const firebaseUID = req.user.uid;
    const { planId } = req.params;
    const { dayIndex, mealType } = req.body;

    console.log("Plan ID:", planId);
    console.log("Day Index:", dayIndex);
    console.log("Meal Type (original):", mealType);
    
    // Convert meal type to lowercase to match database schema
    const mealTypeKey = mealType.toLowerCase();
    console.log("Meal Type (lowercase):", mealTypeKey);

    // Get merged user data (User + UserHealth) using centralized service
    mergedUser = await userHealthService.getMergedUserData(firebaseUID);
    if (!mergedUser) {
      return res.status(404).json({ error: "User not found." });
    }

    const shouldShowCreditSpendConfirmations =
      typeof mergedUser?.preferences?.showCreditSpendConfirmations === "boolean"
        ? mergedUser.preferences.showCreditSpendConfirmations
        : true;
    const shouldAutoConfirmCredits = shouldShowCreditSpendConfirmations === false;

    // Get meal plan
    const mealPlan = await MealPlan.findOne({ _id: planId, user: mergedUser._id });
    if (!mealPlan) {
      return res.status(404).json({ error: "Meal plan not found." });
    }

    // Get the placeholder meal
    const day = mealPlan.days[dayIndex];
    if (!day) {
      return res.status(404).json({ error: "Day not found in meal plan." });
    }

    const placeholder = day.meals[mealTypeKey];
    console.log("Meal data from database:", placeholder);
    console.log("Is placeholder?", placeholder?.isPlaceholder);
    console.log("Placeholder check:", !placeholder || !placeholder.isPlaceholder);
    
    if (!placeholder || !placeholder.isPlaceholder) {
      console.error("Not a placeholder meal. Meal data:", placeholder);
      return res.status(400).json({ 
        error: "Not a placeholder meal.",
        mealData: placeholder,
      });
    }

    console.log("Placeholder:", placeholder);

    // Get user's therapeutic diet guidelines
    const diet = await TherapeuticDiet.findOne({ diet_code: mergedUser.primaryDiet });
    const formattedGuidelines =
      diet && diet.general_guidelines.length > 0
        ? diet.general_guidelines.map((line) => `- ${line}`).join("\n")
        : "No specific dietary guidelines were found.";

    // Prepare user profile for agent
    const userProfile = {
      firstName: mergedUser.firstName,
      primaryDiet: mergedUser.primaryDiet,
      dietaryRestrictions: mergedUser.dietaryRestrictions || [],
      customDietaryRestrictions: mergedUser.customDietaryRestrictions || [],
      conditionTreating: mergedUser.conditionTreating || 'Not specified',
      inFlare: mergedUser.inFlare || false,
      formattedGuidelines,
    };

    // --- Credit System Integration ---
    const { confirm } = req.body;

    if (featureConfig) {
      const creditBalance = await getCreditBalance(mergedUser._id);
      const isConfirmed = !!confirm || shouldAutoConfirmCredits;
      
      if (!isConfirmed) {
        // Pre-flight check
        if (creditBalance < featureConfig.cost) {
          return res.status(200).json({
            insufficientCredits: true,
            cost: featureConfig.cost,
            balance: creditBalance,
            featureName: featureConfig.displayName
          });
        } else {
          return res.status(200).json({
            requiresConfirmation: true,
            cost: featureConfig.cost,
            balance: creditBalance,
            featureName: featureConfig.displayName
          });
        }
      }

      // User confirmed, proceed to deduct
      // deductCredits throws error if insufficient
      try {
        await deductCredits(mergedUser._id, featureConfig.cost, ACTION_TYPE);
        creditDeducted = true;
        console.log(`Deducted ${featureConfig.cost} credits for recipe generation`);
      } catch (deductionError) {
        return res.status(402).json({
          error: "Insufficient credits",
          details: deductionError.message
        });
      }
    }
    // -------------------------------

    // Create prompt from placeholder
    const userPrompt = `Create a full recipe for: ${placeholder.title}. ${placeholder.description}`;
    console.log("User prompt:", userPrompt);

    // Prepare initial state for askKayAgent
    const initialState = {
      ...initialAgentState,
      messages: [new HumanMessage(userPrompt)],
      userInput: userPrompt,
      userProfile,
      userId: mergedUser._id.toString(),
      firebaseUID,
      chatHistory: [],
      isConfirmed: true,
    };

    // Run the askKayAgent to generate the recipe
    console.log("Calling askKayAgent to generate recipe...");
    const thread_id = `meal_plan_placeholder:${mergedUser._id.toString()}:${Date.now()}`;
    const agentConfig = {
      configurable: { thread_id },
    };
    
    // Bypass the LLM "agent" and the interrupt before "create_recipe_logic"
    // by pretending "create_recipe_logic" just finished successfully.
    await askKayAgent.updateState(agentConfig, initialState);
    
    await askKayAgent.updateState(agentConfig, {
      recipeRequirements: {
        dishDescription: placeholder.title,
        specialRequirements: placeholder.description,
        mealType: mealTypeKey
      },
      promptTemplateName: "generate_recipe_prompt",
      isConfirmed: true,
    }, "create_recipe_logic");

    let agentResult = await askKayAgent.invoke(null, agentConfig);

    if (!agentResult.finalResponse?.recipe && !agentResult.currentRecipe) {
      console.error("Agent failed to generate recipe or returned an error.");

      try {
        const debugState = await askKayAgent.getState(agentConfig);
        console.log("[generatePlaceholderRecipe] Agent next:", debugState?.next);
        console.log("[generatePlaceholderRecipe] Has recipeRequirements:", !!debugState?.values?.recipeRequirements);
        console.log("[generatePlaceholderRecipe] Has currentRecipe:", !!debugState?.values?.currentRecipe);
        console.log("[generatePlaceholderRecipe] Has finalResponse:", !!debugState?.values?.finalResponse);

        const nextNode = debugState?.next?.[0] || null;
        const isInterruptNode =
          nextNode === "create_recipe_logic" ||
          nextNode === "edit_recipe_logic" ||
          nextNode === "add_to_shopping_list_logic";

        if (isInterruptNode) {
          await askKayAgent.updateState(agentConfig, { isConfirmed: true });
          agentResult = await askKayAgent.invoke(null, agentConfig);
        }
      } catch (debugError) {
        console.error("[generatePlaceholderRecipe] Failed to read agent state for debugging:", debugError);
      }

      // If we still don't have a recipe, refund and bail out
      if (!agentResult.finalResponse?.recipe && !agentResult.currentRecipe) {
        if (creditDeducted) {
          await refundCredits(mergedUser._id, featureConfig.cost, ACTION_TYPE, "Agent failure");
          console.log("Credits refunded due to agent failure");
          creditDeducted = false;
        }
        
        const errorMessage = agentResult.finalResponse?.error || "Agent did not return a recipe";

        return res.status(500).json({
          error: "Failed to generate recipe",
          details: errorMessage,
        });
      }
    }

    console.log("Recipe generated successfully");
    const generatedRecipe = agentResult.currentRecipe || agentResult.finalResponse.recipe;

    // Save the recipe to database
    const recipeData = {
      ...generatedRecipe,
      generatedBy: mergedUser._id,
      savedBy: [mergedUser._id], // Auto-save for the user
      userPrompt,
    };

    const savedRecipe = await Recipe.create(recipeData);
    console.log("Recipe saved with ID:", savedRecipe._id);

    // Update the meal plan to replace placeholder with recipe link
    day.meals[mealTypeKey] = {
      recipeId: savedRecipe._id,
      recipeTitle: savedRecipe.recipeTitle,
      recipeDescription: savedRecipe.recipeDescription,
      recipeDiet: savedRecipe.recipeDiet,
      recipeImage: savedRecipe.recipeImage, // Include recipe image
      recipeImageVersion: savedRecipe.imageVersion || 0,
      mealType: savedRecipe.mealType,
      isPlaceholder: false,
    };

    await mealPlan.save();
    console.log("Meal plan updated with generated recipe");

    return res.status(200).json({
      success: true,
      recipe: savedRecipe,
      message: "Recipe generated and added to meal plan",
    });
  } catch (error) {
    console.error("Error in generatePlaceholderRecipe:", error);

    if (creditDeducted) {
      try {
        if (featureConfig) {
          await refundCredits(mergedUser._id, featureConfig.cost, ACTION_TYPE, "Agent exception");
          console.log("Credits refunded due to agent exception");
        }
      } catch (refundError) {
        console.error("Failed to refund credits after agent exception:", refundError);
      }
    }

    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

/**
 * Generates a placeholder meal idea for an empty meal slot
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
export const generatePlaceholderIdea = async (req, res) => {
  try {
    console.log("=== Generate Placeholder Idea Request ===");
    const firebaseUID = req.user.uid;
    const { planId } = req.params;
    const { dayIndex, mealType } = req.body;

    console.log("Plan ID:", planId);
    console.log("Day Index:", dayIndex);
    console.log("Meal Type:", mealType);

    // Get merged user data
    const mergedUser = await userHealthService.getMergedUserData(firebaseUID);
    if (!mergedUser) {
      return res.status(404).json({ error: "User not found." });
    }

    // Get the meal plan
    const mealPlan = await MealPlan.findById(planId);
    if (!mealPlan) {
      return res.status(404).json({ error: "Meal plan not found." });
    }

    // Verify ownership
    if (mealPlan.user.toString() !== mergedUser._id.toString()) {
      return res.status(403).json({ error: "Unauthorized access to meal plan." });
    }

    // Get therapeutic diet guidelines
    const diet = await TherapeuticDiet.findOne({ diet_code: mergedUser.primaryDiet });
    const formattedGuidelines =
      diet?.general_guidelines?.join("\n") || "No specific guidelines available.";

    const userProfile = {
      userId: mergedUser._id,
      firstName: mergedUser.firstName,
      primaryDiet: mergedUser.primaryDiet,
      dietaryRestrictions: mergedUser.dietaryRestrictions || [],
      customDietaryRestrictions: mergedUser.customDietaryRestrictions || [],
      conditionTreating: mergedUser.conditionTreating,
      inFlare: mergedUser.inFlare,
      formattedGuidelines,
    };

    const settings = {
      planDuration: 1, // Just one day
      includedMealTypes: {
        breakfast: false,
        lunch: false,
        dinner: false,
        snack: false,
        [mealType]: true, // Only the requested meal type
      },
      dynamicPreferences: mealPlan.settings?.dynamicPreferences || '',
    };

    console.log("Running meal planner agent for single placeholder...");
    // Pass parameters separately, not as a single object
    const result = await runMealPlannerAgent(userProfile, settings, null, []);

    console.log("Agent result structure:", JSON.stringify(result, null, 2));
    console.log("Looking for meal type:", mealType);
    console.log("mealPlan exists?", !!result.mealPlan);
    console.log("days exists?", !!result.mealPlan?.days);
    console.log("day[0] exists?", !!result.mealPlan?.days?.[0]);
    console.log("meals exists?", !!result.mealPlan?.days?.[0]?.meals);
    console.log("meals object:", result.mealPlan?.days?.[0]?.meals);

    if (result.mealPlan?.days?.[0]?.meals?.[mealType]) {
      const generatedMeal = result.mealPlan.days[0].meals[mealType];
      console.log("Generated placeholder:", generatedMeal);

      // Update the meal plan with the placeholder
      const mealTypeKey = mealType.toLowerCase();
      const day = mealPlan.days[dayIndex];
      
      if (!day) {
        return res.status(404).json({ error: "Day not found in meal plan." });
      }

      day.meals[mealTypeKey] = {
        title: generatedMeal.title,
        description: generatedMeal.description,
        mealType: mealType,
        isPlaceholder: true,
      };

      await mealPlan.save();
      console.log("Meal plan updated with placeholder");

      return res.status(200).json({
        success: true,
        placeholder: {
          title: generatedMeal.title,
          description: generatedMeal.description,
          mealType: mealType,
          isPlaceholder: true,
        },
        message: "Placeholder meal idea generated",
      });
    } else {
      throw new Error("Failed to generate placeholder");
    }
  } catch (error) {
    console.error("Error in generatePlaceholderIdea:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

/**
 * Unassigns (deactivates) the active meal plan for a specific date
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {Promise<void>}
 */
export const unassignMealPlanForDate = async (req, res) => {
  try {
    console.log("=== Unassign Meal Plan For Date Request ===");
    const firebaseUID = req.user.uid;
    const { date } = req.query;

    console.log("Date:", date);

    if (!date) {
      return res.status(400).json({
        error: "Missing required query parameter: date",
      });
    }

    // Get user from database
    const user = await User.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Find the active assignment for this date
    const assignment = await CalendarAssignment.getActiveAssignmentForDate(
      user._id,
      new Date(date)
    );

    if (!assignment) {
      return res.status(404).json({
        error: "No active meal plan assignment found for this date.",
      });
    }

    console.log("Found assignment:", assignment._id);
    console.log("Deactivating assignment...");

    // Deactivate the assignment
    assignment.isActive = false;
    await assignment.save();

    console.log("Assignment deactivated successfully");

    return res.status(200).json({
      success: true,
      message: "Meal plan unassigned successfully",
      assignment: {
        _id: assignment._id,
        startDate: assignment.startDate,
        endDate: assignment.endDate,
        isActive: assignment.isActive,
      },
    });
  } catch (error) {
    console.error("Error in unassignMealPlanForDate:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};
