// routes/recipeCard.routes.js
//console.log('--- Loading recipeCard.routes.js ---'); // Diagnostic log
// does need verifyFirebaseToken middleware
import express from 'express';
import {
  createRecipeCard,
  getRecipeCard,
  listGeneratedRecipes,
  listSavedRecipes,
  deleteRecipeCard,
  saveRecipe,
  unsaveRecipe,
  togglePublicStatus,
  getRecipeBySlug,
  uploadRecipeImage,
  getRecipeImageVersions,
  deleteRecipeImage,
  setRecipeCoverImage,
  rotateRecipeImage,
  updateRecipeIngredients,
  updateRecipeSteps,
  updateRecipeNotes,
  updateRecipeMetadata,
  duplicateRecipe,
  generateRecipeImageController,
} from '../controllers/recipeCard.controller.js';
import { validate } from '../middleware/validateSchema.js';
import { createRecipeSchema } from '../validation/recipe.schema.js';
import { verifyFirebaseToken } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.middleware.js';

const router = express.Router();

// --- Private, User-Specific Routes ---

// Route definitions
router.route('/')
  .post(validate(createRecipeSchema), createRecipeCard);

router.get('/generated', verifyFirebaseToken, listGeneratedRecipes);
router.get('/saved', verifyFirebaseToken, listSavedRecipes);
router.get('/slug/:slug', verifyFirebaseToken, getRecipeBySlug);

router.route('/:id')
  .get(verifyFirebaseToken, getRecipeCard)
  .delete(verifyFirebaseToken, deleteRecipeCard); // Add 'protect' middleware later

router.route('/:id/save')
  .post(verifyFirebaseToken, saveRecipe)
  .delete(verifyFirebaseToken, unsaveRecipe);

router.patch('/:id/toggle-public', verifyFirebaseToken, togglePublicStatus);

// Route for uploading a recipe image
router.post('/:id/image', verifyFirebaseToken, upload.single('recipeImage'), uploadRecipeImage);

// Route for getting all image versions for a recipe
router.get('/:id/images', verifyFirebaseToken, getRecipeImageVersions);

// Route for deleting a recipe image
router.delete('/:id/images', verifyFirebaseToken, deleteRecipeImage);

// Route for setting a recipe's cover image
router.patch('/:id/images/cover', verifyFirebaseToken, setRecipeCoverImage);

// Route for rotating a recipe image
router.post('/:id/image/rotate', verifyFirebaseToken, rotateRecipeImage);

// Route for generating an AI image
router.post('/:id/generate-image', verifyFirebaseToken, generateRecipeImageController);

router.patch('/:id/ingredients', verifyFirebaseToken, updateRecipeIngredients);

router.patch('/:id/steps', verifyFirebaseToken, updateRecipeSteps);

router.patch('/:id/notes', verifyFirebaseToken, updateRecipeNotes);

router.patch('/:id/metadata', verifyFirebaseToken, updateRecipeMetadata);

router.post('/:id/duplicate', verifyFirebaseToken, duplicateRecipe);

export default router;
