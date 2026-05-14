import mongoose from "mongoose";

// Define and export the diet codes for use in other models
export const dietCodes = [
  "SCD",
  "GAPS",
  "Paleo AIP",
  "Gluten Free",
  "Dairy Free",
  "Nut Free",
  "Mediterranean",
  "Keto",
  "Low Fiber"
];

// Define the schema for therapeutic diets based on Therapeutic-Diets.json structure
const therapeuticDietsSchema = new mongoose.Schema(
  {
    diet_name: {
      type: String,
      required: [true, "Diet name is required"],
      unique: true, // Assuming diet names should be unique
      trim: true,
    },
    diet_code: {
      type: String,
      required: [true, "Diet code is required"],
      unique: true,
      trim: true,
      enum: dietCodes, // Use the exported constant here
    },
    conditions_treated: {
      type: [String],
      required: [true, "Conditions treated list cannot be empty"],
      // You might want to add validation to ensure it's not an empty array if needed
      // validate: [arrayMinLength, '{PATH} needs at least one condition listed']
      // function arrayMinLength(val) {
      //   return val.length > 0;
      // }
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    general_guidelines: {
      type: [String], // Array of strings
      default: [], // Good practice to default to an empty array
    },
    diet_type: {
      type: String,
      required: [true, "Diet type is required"],
      enum: ["primary", "restriction"],
    },
    supported: {
      type: Boolean,
      required: [true, "Supported is required"],
      default: false,
    },
  },
  { timestamps: true } // Add timestamps for createdAt and updatedAt
);

// Create and export the model
// The third argument explicitly sets the collection name in MongoDB (usually plural and lowercase)
const TherapeuticDiet = mongoose.model(
  "TherapeuticDiet",
  therapeuticDietsSchema,
  "therapeutic-diets" // Collection name
);

export default TherapeuticDiet;
