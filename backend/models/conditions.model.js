import mongoose from "mongoose";

// Define the schema for conditions
const conditionsSchema = new mongoose.Schema(
  {
    condition_name: {
      type: String,
      required: true,
      unique: true, // Assuming condition names should be unique
      trim: true,
    },
    diets_recommended: {
      type: [String],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    supported: {
      type: Boolean,
      default: false,
      description: "Controls whether the condition is exposed to client experiences.",
    },
  },
  { timestamps: true }
); // Add timestamps for createdAt and updatedAt

// Create and export the model
const Condition = mongoose.model(
  "Condition",
  conditionsSchema,
  "conditions-diets"
);

export default Condition;
