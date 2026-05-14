import mongoose from "mongoose";
import { dietCodes } from "./therapeuticDiets.model.js";

const aiMemoryDietStageSchema = new mongoose.Schema(
  {
    value: {
      type: String,
      default: null,
    },
    updatedAt: {
      type: Date,
      default: null,
    },
    source: {
      type: String,
      enum: ["user_reported", "ai_inferred", null],
      default: "user_reported",
    },
  },
  { _id: false }
);

const aiMemoryGoalSchema = new mongoose.Schema(
  {
    goal: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: ["primary", "secondary"],
      required: true,
    },
    category: {
      type: String,
      enum: ["clinical", "behavior", "symptom", "food_expansion", "lifestyle", "other"],
      default: "other",
    },
    status: {
      type: String,
      enum: ["active", "paused", "achieved"],
      default: "active",
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    source: {
      type: String,
      enum: ["user_reported", "ai_inferred", null],
      default: "user_reported",
    },
  },
  { _id: false }
);

const aiMemoryProgressNoteSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["win", "setback", "tolerance", "trigger", "milestone", "adherence"],
      required: true,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
    },
    relatedGoal: {
      type: String,
      default: null,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    source: {
      type: String,
      enum: ["user_reported", "ai_inferred", null],
      default: "user_reported",
    },
  },
  { _id: false }
);

/**
 * UserHealth Model
 * 
 * Stores health-related data separately from user profile data for HIPAA compliance.
 * This collection contains Protected Health Information (PHI) and requires special handling.
 * 
 * One document per user, referenced by userId (User._id) and firebaseUID.
 */
const userHealthSchema = new mongoose.Schema(
  {
    // References to User collection
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
      unique: true, // One health document per user
      index: true,
    },
    firebaseUID: {
      type: String,
      required: [true, "firebaseUID is required"],
      unique: true, // One health document per Firebase user
      index: true,
    },

    // Diet Information
    primaryDiet: {
      type: String,
      required: false,
      enum: dietCodes,
    },
    dietaryRestrictions: {
      type: [String],
      default: [],
    },
    customDietaryRestrictions: {
      type: [String],
      default: [],
    },

    // Medical Information
    conditionTreating: {
      type: String,
      default: "",
    },
    inFlare: {
      type: Boolean,
      default: false,
    },

    // Ephemeral session context (expires after 4 hours)
    sessionContext: {
      energyLevel: {
        type: String,
        enum: ['low', 'medium', 'high', null],
        default: null,
      },
      stressMode: {
        type: Boolean,
        default: null,
      },
      source: {
        type: String,
        enum: ['ui_slider', 'conversation_inference', null],
        default: null,
      },
      updatedAt: {
        type: Date,
        default: null,
      },
      expiresAt: {
        type: Date,
        default: null,
      },
    },

    // Durable Chef Kay memory for cross-session personalization
    aiMemory: {
      dietStage: {
        type: aiMemoryDietStageSchema,
        default: () => ({ value: null, updatedAt: null, source: "user_reported" }),
      },
      activeGoals: {
        type: [aiMemoryGoalSchema],
        default: [],
      },
      progressNotes: {
        type: [aiMemoryProgressNoteSchema],
        default: [],
      },
    },

    // Physical Metrics
    weight: {
      value: {
        type: Number,
        default: null,
      },
      unit: {
        type: String,
        enum: ["kg", "lbs"],
        default: "kg",
      },
    },
    sex: {
      type: String,
      enum: ["Not Specified", "Male", "Female", "Other"],
      default: "Not Specified",
    },
    activity: {
      type: String,
      enum: ["Not Specified", "Sedentary", "Moderately active", "Very active"],
      default: "Not Specified",
    },

    // Historical Tracking (Future-Ready)
    // These fields prepare for future health tracking features
    history: {
      weightLogs: [
        {
          value: Number,
          unit: String,
          recordedAt: Date,
        },
      ],
      flareEvents: [
        {
          startedAt: Date,
          resolvedAt: Date,
          notes: String,
        },
      ],
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    collection: 'user-health',  // Renamed collection
  }
);

// Indexes are defined in the schema fields above (userId: unique + index, firebaseUID: index)
// No need for duplicate schema.index() calls

const UserHealth = mongoose.model("UserHealth", userHealthSchema);

export default UserHealth;
