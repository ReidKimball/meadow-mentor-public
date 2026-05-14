// backend/routes/publicRecipe.routes.js
// does not need verifyFirebaseToken middleware
import express from 'express';
import {
  getPublicRecipes,
  getPublicRecipeBySlug,
  getRecentPublicRecipes,
} from '../controllers/recipeCard.controller.js';

const router = express.Router();

// --- Public Recipe Routes ---
// Mounted at /api/public-recipes

// GET /api/public-recipes
router.get('/', getPublicRecipes);

// GET /api/public-recipes/recent
router.get('/recent', getRecentPublicRecipes);

// GET /api/public-recipes/slug/:slug
router.get('/slug/:slug', getPublicRecipeBySlug);

export default router;