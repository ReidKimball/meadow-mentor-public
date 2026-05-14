// backend/routes/aiResponseRoutes.js
import express from "express";
import * as aiResponseController from "../controllers/aiResponseController.js";
import { checkUserLimits } from "../middleware/rateLimiter.js";
import upload from "../middleware/fileUpload.js";
// import { authenticateUser } from '../middleware/auth.js'; // <<-- IMPORTANT: Add Authentication Middleware
import { asyncHandler } from "../utils/errorHandler.js";

const router = express.Router();

// --- AI Interaction Endpoints ---
// These now use the controllers defined in aiResponseController

// POST /api/ai/recipe (Generate recipe from ingredients)
router.post(
  "/recipe",
  // authenticateUser,
  checkUserLimits, // Requires 'apiService: "recipeGeneration"' in body/header
  asyncHandler(aiResponseController.generateRecipe)
);

// POST /api/ai/meal/convert (Convert a meal description)
router.post(
  "/meal/convert", // Grouped under /meal
  // authenticateUser,
  checkUserLimits, // Requires 'apiService: "mealConvert"'
  asyncHandler(aiResponseController.convertMeal)
);

// POST /api/ai/guide/ask (Ask a question)
router.post(
  "/guide/ask", // Changed from /coaching
  // authenticateUser,
  checkUserLimits, // Requires 'apiService: "askKay"'
  asyncHandler(aiResponseController.askGuide)
);

// POST /api/ai/meal/plan (Generate a meal plan)
router.post(
  "/meal/plan", // Grouped under /meal
  // authenticateUser,
  checkUserLimits, // Requires 'apiService: "mealPlanner"'
  asyncHandler(aiResponseController.generateMealPlan)
);

// POST /api/ai/ingredients/check (Analyze ingredient label image)
router.post(
  "/ingredients/check", // Grouped under /ingredients
  // authenticateUser,
  checkUserLimits, // Requires 'apiService: "checkIngredients"'
  upload.single("ingredientsLabel"), // Multer middleware for file upload
  asyncHandler(aiResponseController.checkIngredients)
);

// POST /api/ai/meal/analyze (Analyze meal image)
router.post(
  "/meal/analyze", // Grouped under /meal
  // authenticateUser,
  checkUserLimits, // Requires 'apiService: "analyzeMeal"'
  upload.single("mealImage"), // Multer middleware
  asyncHandler(aiResponseController.analyzeMeal)
);

// POST /api/ai/report/analyze (Analyze medical report PDF)
router.post(
  "/report/analyze", // Grouped under /report
  // authenticateUser,
  checkUserLimits, // Requires 'apiService: "analyzeDoctorReport"'
  upload.single("medicalReportPDF"), // Multer middleware
  asyncHandler(aiResponseController.analyzeReport)
);

// --- Saved Response Management ---

// GET /api/ai/saved-responses[?serviceType=...] (Get saved responses for user)
router.get(
  "/saved-responses/:serviceType?", // Make serviceType optional in path
  // authenticateUser,
  asyncHandler(aiResponseController.getSavedResponses)
);

// POST /api/ai/saved-responses/save (Mark a response as saved)
router.post(
  "/saved-responses/save", // Changed path slightly
  // authenticateUser,
  asyncHandler(aiResponseController.saveResponse)
);

// POST /api/ai/saved-responses/unsave (Mark a response as unsaved)
router.post(
  "/saved-responses/unsave",
  // authenticateUser,
  asyncHandler(aiResponseController.unsaveResponse)
);

export default router;
