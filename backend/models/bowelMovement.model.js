/**
 * @file bowelMovement.model.js
 * @description Defines the Mongoose schema and model for bowel movement (BM) log entries.
 * Each document represents a single BM event logged by a user, including Bristol type,
 * symptoms, tags, notes, auto-linked context (meals), and AI-generated insights.
 *
 * This collection contains Protected Health Information (PHI).
 * TODO: Implement field-level encryption for sensitive fields (notes, symptoms)
 * when clinician-sharing feature is built. Currently relies on MongoDB Atlas
 * storage-level encryption at rest.
 *
 * @version 1.0.0
 * @date 2026-02-05
 * @author Cascade
 */

import mongoose from "mongoose";

// --- Sub-schemas (no _id on embedded docs) ---

/**
 * @description Symptom sub-document schema.
 * Supports four symptom types, each with type-specific fields:
 * - blood/mucus: boolean `present`
 * - urgency: integer `level` (0–3)
 * - pain: string `location` + integer `intensity` (1–10)
 */
const symptomSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, "Symptom type is required"],
      enum: {
        values: ["blood", "mucus", "urgency", "pain"],
        message: "Unknown symptom type: {VALUE}",
      },
    },
    // blood / mucus
    present: {
      type: Boolean,
      default: undefined, // Only set for blood/mucus
    },
    // urgency
    level: {
      type: Number,
      min: [0, "Urgency level must be 0-3"],
      max: [3, "Urgency level must be 0-3"],
      default: undefined, // Only set for urgency
    },
    // pain
    location: {
      type: String,
      trim: true,
      default: undefined, // Only set for pain
    },
    intensity: {
      type: Number,
      min: [1, "Pain intensity must be 1-10"],
      max: [10, "Pain intensity must be 1-10"],
      default: undefined, // Only set for pain
    },
  },
  { _id: false }
);

/**
 * @description Snapshot sub-document for linked context items.
 * Stores an immutable copy of linked data at the time the BM was created,
 * so the BM record remains meaningful even if the source record is deleted.
 */
const linkedToSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["recipe", "meal", "sleep", "stress", "medication"],
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    snapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false }
);

/**
 * @description AI-generated insight sub-document.
 * Each analysis is appended to the insights array; only the most recent
 * is displayed on the frontend. Marked stale if the parent BM is edited.
 */
const insightSchema = new mongoose.Schema(
  {
    generatedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    stale: {
      type: Boolean,
      default: false,
    },
    analysis: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

// --- Main BM Schema ---

/**
 * @class BowelMovement
 * @description Main schema for a user's bowel movement log entry.
 * Ownership is determined by `firebaseUID` (Shape 2 auth — no userId in URLs).
 */
const bowelMovementSchema = new mongoose.Schema(
  {
    firebaseUID: {
      type: String,
      required: [true, "Firebase UID is required"],
      index: true,
    },
    occurredAt: {
      type: Date,
      required: [true, "occurredAt is required"],
      index: true,
    },
    bristolType: {
      type: Number,
      required: [true, "bristolType is required"],
      min: [1, "bristolType must be between 1 and 7"],
      max: [7, "bristolType must be between 1 and 7"],
    },
    symptoms: {
      type: [symptomSchema],
      default: [],
    },
    tags: {
      type: [String],
      validate: {
        validator: (v) => !v || v.length <= 10,
        message: "Maximum 10 tags allowed",
      },
      default: [],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "notes must be 1000 characters or less"],
      default: null,
    },
    linkedTo: {
      type: [linkedToSchema],
      default: [],
    },
    insights: {
      type: [insightSchema],
      default: [],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: "bowel-movements",
  }
);

// --- Indexes ---

// Primary query: user's entries sorted by time (newest first)
bowelMovementSchema.index({ firebaseUID: 1, occurredAt: -1 });

// Filter by bristol type for a user
bowelMovementSchema.index({ firebaseUID: 1, bristolType: 1 });

// --- Model ---

const BowelMovement = mongoose.model("BowelMovement", bowelMovementSchema);

export default BowelMovement;
