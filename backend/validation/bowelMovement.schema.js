/**
 * @file bowelMovement.schema.js
 * @description Zod validation schemas for bowel movement API endpoints.
 * Validates request bodies for create and update operations, plus query
 * filters for the list endpoint. Enforces the rules defined in the
 * API Design doc (Section 6 — Validation Rules).
 *
 * @version 1.0.0
 * @date 2026-02-05
 * @author Cascade
 */

import { z } from "zod";

// --- Symptom sub-schemas (discriminated by type) ---

const bloodSymptom = z.object({
  type: z.literal("blood"),
  present: z.boolean({ required_error: "present must be true or false" }),
});

const mucusSymptom = z.object({
  type: z.literal("mucus"),
  present: z.boolean({ required_error: "present must be true or false" }),
});

const urgencySymptom = z.object({
  type: z.literal("urgency"),
  level: z
    .number({ required_error: "urgency level is required" })
    .int("urgency level must be an integer")
    .min(0, "urgency level must be 0-3")
    .max(3, "urgency level must be 0-3"),
});

const painSymptom = z.object({
  type: z.literal("pain"),
  location: z
    .string({ required_error: "pain location is required" })
    .min(1, "pain location is required"),
  intensity: z
    .number({ required_error: "pain intensity is required" })
    .int("pain intensity must be an integer")
    .min(1, "pain intensity must be 1-10")
    .max(10, "pain intensity must be 1-10"),
});

const symptomSchema = z.discriminatedUnion("type", [
  bloodSymptom,
  mucusSymptom,
  urgencySymptom,
  painSymptom,
]);

// --- Create BM schema ---

export const createBowelMovementSchema = z.object({
  body: z.object({
    occurredAt: z
      .string({ required_error: "occurredAt is required" })
      .refine(
        (val) => {
          const d = new Date(val);
          return !isNaN(d.getTime());
        },
        { message: "occurredAt must be a valid ISO 8601 timestamp" }
      )
      .refine(
        (val) => {
          const d = new Date(val);
          return d <= new Date();
        },
        { message: "occurredAt must not be in the future" }
      ),
    bristolType: z
      .number({ required_error: "bristolType is required" })
      .int("bristolType must be an integer")
      .min(1, "bristolType must be an integer between 1 and 7")
      .max(7, "bristolType must be an integer between 1 and 7"),
    symptoms: z.array(symptomSchema).optional(),
    tags: z
      .array(z.string())
      .max(10, "Maximum 10 tags allowed")
      .optional(),
    notes: z
      .string()
      .max(1000, "notes must be 1000 characters or less")
      .optional(),
  }),
});

// --- Update BM schema (all fields optional, but validated if present) ---

export const updateBowelMovementSchema = z.object({
  body: z.object({
    occurredAt: z
      .string()
      .refine(
        (val) => {
          const d = new Date(val);
          return !isNaN(d.getTime());
        },
        { message: "occurredAt must be a valid ISO 8601 timestamp" }
      )
      .refine(
        (val) => {
          const d = new Date(val);
          return d <= new Date();
        },
        { message: "occurredAt must not be in the future" }
      )
      .optional(),
    bristolType: z
      .number()
      .int("bristolType must be an integer")
      .min(1, "bristolType must be an integer between 1 and 7")
      .max(7, "bristolType must be an integer between 1 and 7")
      .optional(),
    symptoms: z.array(symptomSchema).optional(),
    tags: z
      .array(z.string())
      .max(10, "Maximum 10 tags allowed")
      .optional(),
    notes: z
      .string()
      .max(1000, "notes must be 1000 characters or less")
      .nullable()
      .optional(),
  }),
});

// --- Bulk delete schema ---

export const bulkDeleteSchema = z.object({
  body: z.object({
    ids: z
      .array(z.string().min(1))
      .min(1, "ids array must contain at least one entry"),
  }),
});
