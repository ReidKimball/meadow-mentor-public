/**
 * @file ipBlacklist.model.js
 * @description Mongoose model for tracking IP addresses that have triggered
 * malicious input detection or repeated attacks. Used by the IP blocking
 * middleware to deny further access.
 */

import mongoose from "mongoose";

const ipBlacklistSchema = new mongoose.Schema(
  {
    ipAddress: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      enum: ["MALICIOUS_INPUT", "REPEATED_ATTACKS", "MANUAL_BLOCK"],
    },
    attempts: {
      type: Number,
      default: 1,
    },
    detectedPatterns: {
      type: [String],
      default: [],
    },
    blockedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      // Default to 24 hours from creation for non-permanent blocks.
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    permanent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index for automatic expiration of non-permanent blocks.
ipBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const IpBlacklist = mongoose.model("IpBlacklist", ipBlacklistSchema);

export default IpBlacklist;
