import mongoose from "mongoose";

// Reuse the compliance result schema from userMeal.model.js
const complianceResultSchema = new mongoose.Schema(
  {
    ingredient: {
      type: String,
      required: true,
      trim: true,
    },
    normalized_ingredient: {
      // The food name matched in the database
      type: String,
      trim: true,
      default: null,
    },
    found: {
      type: Boolean,
      required: true,
    },
    allowed: {
      // true = allowed, false = not allowed, null = not found/error
      type: Boolean,
      default: null,
    },
    note: {
      type: String,
      trim: true,
      default: null,
    },
    isNewlyIntroduced: {
      // Flag specific to this ingredient in this meal
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const mealPresetSchema = new mongoose.Schema(
  {
    firebaseUID: {
      type: String,
      required: [true, "Firebase UID is required"],
      index: true, // For querying by user
    },
    diet_code: {
      // e.g., "SCD", "GAPS" - the diet context for this preset
      type: String,
      required: [true, "Diet code is required"],
      index: true, // For filtering by diet
      trim: true,
    },
    presetName: {
      type: String,
      required: [true, "Preset name is required"],
      trim: true,
    },
    mealName: {
      type: String,
      required: [true, "Meal name is required"],
      trim: true,
    },    
    mealType: {
      type: String,
      required: [true, "Meal type is required"],
      enum: ["breakfast", "lunch", "dinner", "snack"],
      trim: true,
    },
    ingredients: {
      type: [String],
      required: [true, "At least one ingredient is required"],
      validate: [
        (v) => Array.isArray(v) && v.length > 0,
        "Ingredients array cannot be empty",
      ],
    },
    mealNotes: {
      type: String,
      trim: true,
      default: "",
    },
    // Store the compliance snapshot template
    complianceSnapshot: {
      type: {
        score: { type: Number, min: 0, max: 100, default: null },
        compliantCount: { type: Number, default: 0 },
        nonCompliantCount: { type: Number, default: 0 },
        notFoundCount: { type: Number, default: 0 },
        results: [complianceResultSchema],
      },
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Compound index to ensure unique preset names per user
mealPresetSchema.index(
  { firebaseUID: 1, presetName: 1 },
  { unique: true }
);

// Text index for searching presets by name or ingredients
mealPresetSchema.index(
  { presetName: "text", mealName: "text", ingredients: "text" },
  { default_language: "english" }
);

// Create the model
const MealPreset = mongoose.model(
  "MealPreset",
  mealPresetSchema,
  "meal-presets" // Explicit collection name
);

export default MealPreset;