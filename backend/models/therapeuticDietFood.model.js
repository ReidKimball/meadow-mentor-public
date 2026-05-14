import mongoose from "mongoose";
import { dietCodes } from './therapeuticDiets.model.js';
// this is used to import allowed/not allowed foods for a specific therapeutic diet
// into the collection therapeutic-diet-foods

const therapeuticDietFoodSchema = new mongoose.Schema(
  {
    diet_code: {
      type: String,
      required: [true, "Diet code is required"],
      enum: dietCodes,
      index: true, // Index for filtering by diet
    },
    food_name: {
      type: String,
      required: [true, "Food name is required"],
      trim: true,
    },
    normalized_food_name: {
      type: String,
      required: [true, "Normalized food name is required"],
      trim: true,
      lowercase: true, // Automatically convert to lowercase
      index: true, // Index for searching/matching food
    },
    verification_status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      description: "Admin verification status of the AI-discovered ingredient.",
    },
    allowed: {
      type: Boolean, // Store as true/false, not "true"/"false"
      required: [true, "Allowed status is required"],
    },
    note: {
      type: String,
      trim: true,
      default: null, // Default to null if no note is provided
    },
    source_file: {
      // Optional: track origin
      type: String,
      required: false,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt
  }
);

// --- Indexes ---
// Compound index for the most common query: "Is this food allowed on this diet?"
// Unique constraint prevents duplicate entries for the same food on the same diet.
therapeuticDietFoodSchema.index(
  { diet_code: 1, normalized_food_name: 1 },
  { unique: true }
);

// Optional: Index for searching a food across all diets (if needed later)
// therapeuticDietFoodSchema.index({ normalized_food_name: 1 });

const TherapeuticDietFood = mongoose.model(
  "TherapeuticDietFood",
  therapeuticDietFoodSchema,
  "therapeutic-diet-foods" // Explicit collection name
);

export default TherapeuticDietFood;
