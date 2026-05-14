import mongoose from "mongoose";

// Define the schema for the detailed ingredient compliance result within the snapshot
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
); // Don't create separate IDs for subdocuments in the array

// Define the schema for the overall compliance snapshot
const complianceSnapshotSchema = new mongoose.Schema(
  {
    score: {
      // Overall compliance score (0-100) or null
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    compliantCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    nonCompliantCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    notFoundCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    results: {
      // Array of results for each ingredient checked
      type: [complianceResultSchema],
      required: true,
    },
  },
  { _id: false }
); // Don't create a separate ID for the snapshot object

// Define the main schema for a user's meal log entry
const userMealSchema = new mongoose.Schema(
  {
    firebaseUID: {
      type: String,
      required: [true, "Firebase UID is required"],
      index: true, // Index for querying by user
    },
    diet_code: {
      // e.g., "SCD", "GAPS" - the diet context for this meal log
      type: String,
      required: [true, "Diet code is required"],
      index: true, // Index for filtering by diet followed at the time
      trim: true,
      // Consider adding enum validation if you have a fixed list in another model
      // enum: ['SCD', 'GAPS', 'Paleo AIP', ...]
    },
    mealDateTime: {
      // Date and time the meal was consumed/logged for
      type: Date,
      required: [true, "Meal date and time are required"],
      index: true, // Index for date-range queries
    },
    mealType: {
      type: String,
      required: [true, "Meal type is required"],
      enum: ["breakfast", "lunch", "dinner", "snack"],
      trim: true,
    },
    mealName: {
      // User-defined name/description for the meal
      type: String,
      required: [true, "Meal name is required"],
      trim: true,
    },
    ingredients: {
      // Raw list of ingredients entered by the user
      type: [String],
      required: [true, "At least one ingredient is required"],
      validate: [
        (v) => Array.isArray(v) && v.length > 0,
        "Ingredients array cannot be empty",
      ],
    },
    complianceSnapshot: {
      // The result of the compliance check at time of logging
      type: complianceSnapshotSchema,
      required: true,
    },
    mealNotes: {
      // Optional user notes about this specific meal
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Optional: Compound index if you often query user, date range, and diet together
userMealSchema.index({ firebaseUID: 1, diet_code: 1, mealDateTime: -1 });

const UserMeal = mongoose.model(
  "UserMeal", // Model name
  userMealSchema, // Schema definition
  "user-meals" // Explicit collection name in MongoDB
);

export default UserMeal;
