/**
 * @file idempotencyKey.model.js
 * @description Mongoose model for storing idempotency keys used to prevent
 * duplicate POST requests (e.g., creating duplicate BM entries).
 *
 * Each key is scoped to a user (`firebaseUID` + `key`) and automatically
 * expires after 24 hours via a MongoDB TTL index. If a client retries a
 * POST with the same idempotency key and same body, the server returns
 * the original response. If the body differs, it returns 409 Conflict.
 *
 * @version 1.0.0
 * @date 2026-02-05
 * @author Cascade
 */

import mongoose from "mongoose";

const idempotencyKeySchema = new mongoose.Schema({
  firebaseUID: {
    type: String,
    required: true,
  },
  key: {
    type: String,
    required: true,
  },
  bodyHash: {
    type: String,
    required: true,
  },
  responseBody: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  statusCode: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // TTL: 24 hours (in seconds)
  },
});

// Compound unique index: one key per user
idempotencyKeySchema.index({ firebaseUID: 1, key: 1 }, { unique: true });

const IdempotencyKey = mongoose.model(
  "IdempotencyKey",
  idempotencyKeySchema,
  "idempotency-keys"
);

export default IdempotencyKey;
