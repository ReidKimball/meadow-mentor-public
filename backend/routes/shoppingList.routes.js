import express from 'express';
import {
  getShoppingList,
  addIngredients,
  updateIngredient,
  deleteIngredient,
  clearChecked,
} from '../controllers/shoppingList.controller.js';
import { verifyFirebaseToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes in this file are protected and require a valid Firebase token
router.use(verifyFirebaseToken);

router.route('/').get(getShoppingList);
router.route('/ingredients').post(addIngredients);
router.route('/ingredients/:id').patch(updateIngredient).delete(deleteIngredient);
router.route('/clear-checked').post(clearChecked);

export default router;
