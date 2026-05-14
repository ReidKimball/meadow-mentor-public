import express from "express";
import {
  getRecipe,
  convertMeal,
  askKay,
  getMealPlan,
  analyzeImage, // Assuming these exist or will be created
  analyzeReport, // Assuming these exist or will be created
  analyzeJournal,
} from "../controllers/ai.controller.js";
// Assuming verifyFirebaseToken is applied globally in index.js before this router
// import { verifyFirebaseToken } from "../middleware/auth.middleware.js"; // Or apply here if needed per-route

// Import checkUserLimits from its new location
import { checkUserLimits } from "../middleware/checkUserLimits.middleware.js"; // <-- CORRECT PATH

import upload from "../middleware/multer.middleware.js"; // Make sure multer is configured correctly

const router = express.Router();

// Apply checkUserLimits middleware to routes that consume API credits
router.post("/recipe", checkUserLimits, getRecipe);
router.post("/meal_convert", checkUserLimits, convertMeal);
router.post("/askKay", checkUserLimits, askKay);
router.post("/meal_plan", checkUserLimits, getMealPlan);

// Example for image/report analysis routes (assuming they exist)

router.post(
  "/analyze-image",
  // Use a generic field name like 'image'. Frontend needs to send the file with this field name.
  upload.single("image"), // Apply multer first if needed
  checkUserLimits,
  analyzeImage // Route to the unified analyzeImage controller
);
router.post(
  "/analyze-report",
  // Assuming PDF upload middleware uses field name 'pdf' or similar
  upload.single("pdf"), // Apply multer first if needed
  checkUserLimits,
  analyzeReport
);

// Apply checkUserLimits to the new journal analysis route
router.post("/analyze-journal", checkUserLimits, analyzeJournal);

export default router;
