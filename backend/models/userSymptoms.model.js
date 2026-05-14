// Defines the structure for storing individual symptom instances logged by users.

import mongoose from "mongoose";
const Schema = mongoose.Schema;

/*
User Link: firebaseUID connects the symptom to the user.
Master Symptom Link: symptomMasterId references the definition in symptoms-master. This is preferred over just storing the code as it uses Mongoose's population features effectively. Includes logic to handle custom symptoms (symptomName: 'Other').
Custom Fields: customSymptomName and customLocation capture user input when 'Other' is selected. Required validation ensures these are filled when needed.
Detailed Metrics: Captures severity, timingRelativeToMeal (nullable), duration (nullable), and location (nullable) using enums for consistency.
Meal Association: associatedMealId links back to the UserMeal document if applicable (null otherwise).
Source Tracking: source clearly indicates if the symptom was logged via a meal or as a standalone event.
Timing: Includes occurredAt (when the symptom happened, potentially set by the user) and createdAt (when the record was saved, automatic).
Indexes: Provides several indexes optimized for common query patterns like fetching symptoms for a user, for a specific meal, or analyzing specific symptom types.
*/
// Define the schema for individual user symptom log entries
const userSymptomsSchema = new mongoose.Schema(
  {
    firebaseUID: {
      type: String,
      required: [true, "Firebase UID is required"],
      index: true, // Index for querying by user
    },
    // Option 1: Link using the ObjectId of the master symptom entry
    symptomMasterId: {
      type: Schema.Types.ObjectId,
      ref: "SymptomsMaster", // Reference to the SymptomsMaster model
      required: function () {
        // Required only if it's not a custom 'Other' symptom
        return this.symptomName !== "Other";
      },
      index: true,
    },
    // Option 2: Store the code directly (can be redundant if using ID, but useful for some queries)
    // symptomCode: {
    //   type: String,
    //   trim: true,
    //   uppercase: true,
    //   index: true,
    //   required: function() { return this.symptomName !== 'Other'; }
    // },
    symptomName: {
      // The display name shown to user, or 'Other'
      type: String,
      required: true,
      trim: true,
    },
    customSymptomName: {
      // Populated only if symptomName is 'Other'
      type: String,
      trim: true,
      default: null,
      required: function () {
        // Make sure custom name is provided if 'Other' is selected
        return this.symptomName === "Other";
      },
    },
    severity: {
      // Example: 1-5 scale. Adapt type/enum based on your chosen scale.
      type: Number,
      min: 1,
      max: 5, // Adjust max based on your scale (e.g., 10)
      required: [true, "Severity rating is required"],
    },
    // --- Fields relevant primarily when logged with a meal ---
    timingRelativeToMeal: {
      // Only applicable if source is 'meal'
      type: String,
      enum: [
        null, // Use null if source is 'event' or timing not specified
        "during",
        "within_30m",
        "30m_to_1h",
        "1h_to_3h",
        "3h_to_6h",
        "6h_to_12h",
        "12h_to_24h",
        "over_24h",
      ],
      default: null,
    },
    // --- General symptom details ---
    duration: {
      // Optional duration
      type: String,
      enum: [
        null, // Default if not specified
        "under_1h",
        "1h_to_3h",
        "3h_to_6h",
        "half_day", // Approx 6-12h
        "full_day", // Approx 12-24h
        "ongoing", // Persists beyond a day or is continuous
      ],
      default: null,
    },
    location: {
      // Optional location, especially relevant for pain
      type: String,
      enum: [
        null, // Default if not specified or not applicable
        "upper_abdomen",
        "lower_abdomen",
        "left_side_abdomen",
        "right_side_abdomen",
        "general_abdomen",
        "chest",
        "head",
        "joints",
        "skin",
        "other",
      ],
      default: null,
    },
    customLocation: {
      // Populated only if location is 'other'
      type: String,
      trim: true,
      default: null,
      required: function () {
        // Make sure custom location is provided if 'other' is selected
        return this.location === "other";
      },
    },
    notes: {
      // Optional free-text notes from the user about this specific symptom instance
      type: String,
      trim: true,
      default: null,
    },
    // --- Linking and Context ---
    associatedMealId: {
      // Link to the UserMeal document if logged via meal entry
      type: Schema.Types.ObjectId,
      ref: "UserMeal", // Reference to the UserMeal model
      default: null, // Null if logged as a standalone event
      index: true,
    },
    source: {
      // How was this symptom logged?
      type: String,
      required: true,
      enum: ["meal", "event"], // 'meal' = via food journal, 'event' = direct symptom log
      index: true,
    },
    occurredAt: {
      // Timestamp representing when the symptom actually occurred or started
      // This might differ from createdAt (when it was logged)
      // Allow user to set this, default to Date.now if not provided
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true, // Adds `createdAt` (when logged) and `updatedAt`
  }
);

// --- Indexes ---
// Essential index for fetching a user's symptoms over time
userSymptomsSchema.index({ firebaseUID: 1, occurredAt: -1 });

// Index useful for analyzing specific symptom types for a user
userSymptomsSchema.index({ firebaseUID: 1, symptomMasterId: 1 });
userSymptomsSchema.index({ firebaseUID: 1, symptomName: 1 }); // Also index name if querying custom symptoms

// Index useful for analyzing symptoms by source
userSymptomsSchema.index({ firebaseUID: 1, source: 1 });

// --- Model Definition ---
const UserSymptoms = mongoose.model(
  "UserSymptoms", // Model name
  userSymptomsSchema, // Schema definition
  "user-symptoms" // Explicit collection name in MongoDB
);

export default UserSymptoms;
