import mongoose from "mongoose";

const userFoodNoteSchema = new mongoose.Schema(
  {
    firebaseUID: {
      type: String,
      required: [true, "firebaseUID is required"],
      index: true, // Index this for user-specific lookups
    },
    diet_code: {
      type: String,
      enum: [
        "SCD",
        "GAPS",
        "Paleo AIP",
        "Gluten Free",
        "Dairy Free",
        "Nut Free",
        "Mediterranean",
        "Keto",
      ],
      required: [true, "Diet code is required"],
    },
    food_name: {
      type: String,
      required: [true, "Food name is required"],
      trim: true,
    },
    normalized_food_name: {
      type: String,
      required: [true, "Normalized food name is required"],
      index: true, // Indexed for joining with food rules if needed
      trim: true,
      lowercase: true, // Automatically convert to lowercase
    },
    note: {
      type: String,
      required: [true, "Note text is required"],
      trim: true,
    },
    tags: [String],
    reaction: {
      type: String,
      enum: ["positive", "neutral", "negative", "unknown"],
      default: "unknown",
    },
  },
  { timestamps: true }
); // Add timestamps for createdAt and updatedAt

// Create compound indexes for common queries
userFoodNoteSchema.index({ firebaseUID: 1, normalized_food_name: 1 });
userFoodNoteSchema.index({ firebaseUID: 1, reaction: 1 });
userFoodNoteSchema.index({ firebaseUID: 1, updatedAt: -1 });

const UserFoodNote = mongoose.model(
  "UserFoodNote",
  userFoodNoteSchema,
  "user-food-notes"
);
export default UserFoodNote;
