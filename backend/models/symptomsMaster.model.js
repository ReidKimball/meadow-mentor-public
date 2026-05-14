// Defines the structure for the master list of all possible symptoms

import mongoose from "mongoose";

/*
symptomCode: A unique, machine-readable identifier for the symptom. Using uppercase helps ensure consistency.
displayName: The user-friendly name shown in the UI.
description: Optional text to provide more context to the user about the symptom.
relevantConditions: An array of strings that links the symptom to specific conditions (like "IBD") or makes it universally available ("GENERAL"). This is key for filtering the list shown to the user.
bodySystems: Optional categorization that could be useful for future filtering or analysis.
requiresLocation: A simple flag to indicate if the UI should prompt for location input when this symptom is selected (e.g., for pain).
isActive: A boolean flag to softly "delete" or hide a symptom from the selection list without removing it entirely (important if users have already logged data with this symptom).
timestamps: Adds createdAt and updatedAt automatically.
Indexes: Added indexes on symptomCode, relevantConditions, and isActive for efficient querying. A compound index on relevantConditions and isActive is also included as this will be a very common query pattern (finding active symptoms for a given condition).
Model Definition: Creates the Mongoose model named SymptomsMaster and explicitly maps it to the symptoms-master collection in MongoDB.
*/

// Define the schema for the master list of symptoms
const symptomsMasterSchema = new mongoose.Schema(
  {
    symptomCode: {
      type: String,
      required: [true, "Symptom code is required"],
      unique: true, // Ensures no duplicate codes
      trim: true,
      uppercase: true, // Standardize codes to uppercase
      index: true, // Index for efficient lookups by code
      // Example: "ABD_PAIN", "FATIGUE", "DIARRHEA_MILD", "JOINT_PAIN_KNEE"
    },
    displayName: {
      type: String,
      required: [true, "Display name is required"],
      trim: true,
      // Example: "Abdominal Pain", "Fatigue", "Mild Diarrhea", "Knee Joint Pain"
    },
    description: {
      // Optional user-facing explanation of the symptom
      type: String,
      trim: true,
      default: null,
    },
    relevantConditions: {
      // Array of condition identifiers this symptom is relevant for.
      // Use consistent identifiers matching user profiles or a mapping.
      type: [String],
      required: [true, "At least one relevant condition code is required"],
      index: true,
      // Example: ["IBD", "IBS", "GENERAL", "CELIAC", "AUTOIMMUNE", "NEURO"]
      // "GENERAL" applies to all users.
      validate: [
        (val) => val.length > 0,
        "Relevant conditions array cannot be empty",
      ],
    },
    bodySystems: {
      // Optional categorization for filtering or analysis
      type: [String],
      index: true,
      default: [],
      // Example: ["Gastrointestinal", "Systemic", "Neurological", "Musculoskeletal", "Skin"]
    },
    requiresLocation: {
      // Flag indicating if asking for location is typically relevant for this symptom
      type: Boolean,
      default: false,
    },
    // Consider adding fields for typical intensity scales if needed:
    // defaultSeverityScale: { type: String, enum: ['1-5', '1-10', 'mild-moderate-severe'], default: '1-5' },
    isActive: {
      // Allows disabling a symptom from appearing without deleting historical data
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Optional: Compound index if frequently querying by condition and active status
symptomsMasterSchema.index({ relevantConditions: 1, isActive: 1 });

// The third argument explicitly sets the collection name in MongoDB
const SymptomsMaster = mongoose.model(
  "SymptomsMaster", // Model name
  symptomsMasterSchema, // Schema definition
  "symptoms-master" // Explicit collection name in MongoDB
);

export default SymptomsMaster;
