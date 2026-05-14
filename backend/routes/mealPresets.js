import express from 'express';
import {
  createMealPreset,
  getMealPresets,
  updateMealPreset,
  deleteMealPreset
} from '../controllers/mealPresetController.js';

const router = express.Router();

// Note: The verifyFirebaseToken middleware will be applied in index.js for the base '/api/meal-presets' route

// GET /api/meal-presets - Get all presets for the user (can filter by dietCode query param)
// POST /api/meal-presets - Create a new preset
router.route('/')
  .get(getMealPresets)
  .post(createMealPreset);

// PUT /api/meal-presets/:presetId - Update a specific preset
// DELETE /api/meal-presets/:presetId - Delete a specific preset
router.route('/:presetId')
  .put(updateMealPreset)
  .delete(deleteMealPreset);

export default router;
