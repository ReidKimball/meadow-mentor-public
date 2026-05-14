/**
 * @file publicMealPlan.routes.js
 * @description Defines **public (no-auth)** routes for retrieving SEO-safe meal plan templates.
 *
 * These endpoints are designed for the marketing/SEO frontend to render `/plans/*` pages.
 * The router is mounted at `/api/public-meal-plans` and intentionally **does not** apply
 * `verifyFirebaseToken`.
 *
 * @version 1.0.0
 * @requires express - Express router.
 * @requires ../controllers/mealPlanner.controller.js - Public meal plan controller handlers.
 * @date 2025-12-17
 * @author Cascade
 */

// does not need verifyFirebaseToken middleware
import express from 'express';
import {
  getPublicMealPlans,
  getPublicMealPlanBySlug,
} from '../controllers/mealPlanner.controller.js';

const router = express.Router();

// --- Public Meal Plan Routes ---
// Mounted at /api/public-meal-plans

/**
 * @route GET /api/public-meal-plans
 * @description Returns a list of **public** meal plans that can be rendered as marketing pages.
 * @access Public
 */
router.get('/', getPublicMealPlans);

/**
 * @route GET /api/public-meal-plans/slug/:slug
 * @description Returns a single meal plan by slug when `visibility` is `public` or `unlisted`.
 * This endpoint is designed for direct-link access and SEO rendering.
 * @access Public
 * @param {string} slug - The meal plan slug.
 */
router.get('/slug/:slug', getPublicMealPlanBySlug);

export default router;
