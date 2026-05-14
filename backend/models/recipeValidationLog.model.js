/**
 * @file recipeValidationLog.model.js
 * @description Mongoose model for logging AI recipe validation attempts.
 * @version 1.0.0
 * @date 2025-09-13
 * @author Cascade
 */

import mongoose from 'mongoose';

const recipeValidationLogSchema = new mongoose.Schema(
  {
    recipeTitle: {
      type: String,
      required: true,
      trim: true,
    },
    diet: {
      type: String,
      required: true,
    },
    attemptNumber: {
      type: Number,
      required: true,
    },
    isCompliant: {
      type: Boolean,
      required: true,
    },
    validationReport: {
      type: Object, // Stores the full JSON report from checkIngredientCompliance
      required: true,
    },
    originalRecipeJson: {
      type: Object, // The full recipe JSON that was validated
      required: true,
    },
    // Optional: Add user ID to track who triggered the generation
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Index for efficient querying of logs by diet or compliance status
recipeValidationLogSchema.index({ diet: 1 });
recipeValidationLogSchema.index({ isCompliant: 1 });
recipeValidationLogSchema.index({ createdAt: -1 }); // For sorting by most recent

const RecipeValidationLog = mongoose.model(
  'RecipeValidationLog',
  recipeValidationLogSchema,
  'recipe-validation-logs' // Explicit collection name
);

export default RecipeValidationLog;
