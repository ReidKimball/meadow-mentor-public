/**
 * @file bowelMovement.service.js
 * @description Service layer for bowel movement business logic.
 * Encapsulates linkedTo computation (auto-linking meals within a 12–72h window)
 * and idempotency key management for duplicate POST prevention.
 *
 * @version 1.0.0
 * @date 2026-02-05
 * @author Cascade
 */

import crypto from "crypto";
import UserMeal from "../models/userMeal.model.js";
import IdempotencyKey from "../models/idempotencyKey.model.js";

/**
 * @function computeLinkedTo
 * @description Finds all UserMeal entries for the given user that fall within
 * the 12–72 hour window before `occurredAt`. Pure UTC duration math.
 * Returns an array of linkedTo objects with type, id, and snapshot.
 *
 * NOTE: Currently only links to UserMeal. Will expand to recipes, sleep,
 * stress, and medication events as those models are built.
 *
 * @param {string} firebaseUID - The user's Firebase UID
 * @param {Date} occurredAt - The BM timestamp
 * @returns {Promise<Array>} Array of linkedTo objects
 */
export async function computeLinkedTo(firebaseUID, occurredAt) {
  const windowEnd = new Date(occurredAt.getTime() - 12 * 60 * 60 * 1000); // -12h
  const windowStart = new Date(occurredAt.getTime() - 72 * 60 * 60 * 1000); // -72h

  const linked = [];

  // Query meals in the time window
  try {
    const meals = await UserMeal.find({
      firebaseUID,
      mealDateTime: { $gte: windowStart, $lte: windowEnd },
    }).lean();

    for (const meal of meals) {
      linked.push({
        type: "meal",
        id: meal._id,
        snapshot: {
          mealName: meal.mealName,
          mealType: meal.mealType,
          ingredients: meal.ingredients,
          mealDateTime: meal.mealDateTime,
        },
      });
    }
  } catch (err) {
    console.error(
      "(bowelMovement.service.js - computeLinkedTo) ❌ Error querying meals:",
      err.message
    );
    // Non-fatal: return whatever we have so far
  }

  // TODO: Add queries for sleep, stress, medication models when built

  return linked;
}

/**
 * @function checkIdempotencyKey
 * @description Checks if an idempotency key already exists for this user.
 * Returns the existing record if found, or null if the key is new.
 *
 * @param {string} firebaseUID - The user's Firebase UID
 * @param {string} key - The client-supplied idempotency key
 * @returns {Promise<object|null>} The existing idempotency record, or null
 */
export async function checkIdempotencyKey(firebaseUID, key) {
  return IdempotencyKey.findOne({ firebaseUID, key }).lean();
}

/**
 * @function saveIdempotencyKey
 * @description Stores an idempotency key with the request body hash and response.
 * The TTL index on `createdAt` auto-deletes the record after 24 hours.
 *
 * @param {string} firebaseUID - The user's Firebase UID
 * @param {string} key - The client-supplied idempotency key
 * @param {object} body - The original request body (hashed for comparison)
 * @param {number} statusCode - The HTTP status code of the original response
 * @param {object} responseBody - The full response body to replay on retry
 * @returns {Promise<void>}
 */
export async function saveIdempotencyKey(
  firebaseUID,
  key,
  body,
  statusCode,
  responseBody
) {
  const bodyHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(body))
    .digest("hex");

  await IdempotencyKey.create({
    firebaseUID,
    key,
    bodyHash,
    statusCode,
    responseBody,
  });
}

/**
 * @function hashBody
 * @description Creates a SHA-256 hash of a request body for idempotency comparison.
 *
 * @param {object} body - The request body to hash
 * @returns {string} Hex-encoded SHA-256 hash
 */
export function hashBody(body) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(body))
    .digest("hex");
}

/**
 * @function buildListFilter
 * @description Builds a MongoDB query filter object from the request query params.
 * Supports all filters defined in the API design (Section 4 — List + Filters).
 *
 * @param {string} firebaseUID - The user's Firebase UID
 * @param {object} query - The express req.query object
 * @returns {object} MongoDB filter object
 */
export function buildListFilter(firebaseUID, query) {
  const filter = { firebaseUID };

  // Date range
  if (query.start || query.end) {
    filter.occurredAt = {};
    if (query.start) {
      const start = new Date(query.start);
      if (!isNaN(start.getTime())) filter.occurredAt.$gte = start;
    }
    if (query.end) {
      const end = new Date(query.end);
      if (!isNaN(end.getTime())) filter.occurredAt.$lte = end;
    }
  }

  // Bristol type — exact or range
  if (query.bristol_type) {
    filter.bristolType = parseInt(query.bristol_type, 10);
  } else {
    if (query.bristol_type_min || query.bristol_type_max) {
      filter.bristolType = {};
      if (query.bristol_type_min)
        filter.bristolType.$gte = parseInt(query.bristol_type_min, 10);
      if (query.bristol_type_max)
        filter.bristolType.$lte = parseInt(query.bristol_type_max, 10);
    }
  }

  // Symptom filters
  if (query.symptoms) {
    const s = query.symptoms;

    if (s.blood !== undefined) {
      filter["symptoms"] = filter["symptoms"] || {};
      filter.$and = filter.$and || [];
      filter.$and.push({
        symptoms: {
          $elemMatch: { type: "blood", present: s.blood === "true" },
        },
      });
    }

    if (s.mucus !== undefined) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        symptoms: {
          $elemMatch: { type: "mucus", present: s.mucus === "true" },
        },
      });
    }

    if (s.urgency !== undefined) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        symptoms: {
          $elemMatch: { type: "urgency", level: parseInt(s.urgency, 10) },
        },
      });
    } else if (s.urgency_min !== undefined || s.urgency_max !== undefined) {
      const urgencyMatch = { type: "urgency" };
      if (s.urgency_min !== undefined)
        urgencyMatch.level = {
          ...urgencyMatch.level,
          $gte: parseInt(s.urgency_min, 10),
        };
      if (s.urgency_max !== undefined)
        urgencyMatch.level = {
          ...urgencyMatch.level,
          $lte: parseInt(s.urgency_max, 10),
        };
      filter.$and = filter.$and || [];
      filter.$and.push({ symptoms: { $elemMatch: urgencyMatch } });
    }

    if (s.pain_loc !== undefined) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        symptoms: { $elemMatch: { type: "pain", location: s.pain_loc } },
      });
    }

    if (s.pain_intensity !== undefined) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        symptoms: {
          $elemMatch: {
            type: "pain",
            intensity: parseInt(s.pain_intensity, 10),
          },
        },
      });
    } else if (
      s.pain_intensity_min !== undefined ||
      s.pain_intensity_max !== undefined
    ) {
      const painMatch = { type: "pain" };
      if (s.pain_intensity_min !== undefined)
        painMatch.intensity = {
          ...painMatch.intensity,
          $gte: parseInt(s.pain_intensity_min, 10),
        };
      if (s.pain_intensity_max !== undefined)
        painMatch.intensity = {
          ...painMatch.intensity,
          $lte: parseInt(s.pain_intensity_max, 10),
        };
      filter.$and = filter.$and || [];
      filter.$and.push({ symptoms: { $elemMatch: painMatch } });
    }

    // Clean up the stale symptoms key if $and was used instead
    delete filter["symptoms"];
  }

  // Tags (AND logic — entry must have ALL specified tags)
  if (query.tags) {
    const tagList = query.tags.split(",").map((t) => t.trim());
    filter.tags = { $all: tagList };
  }

  // Notes keyword search (AND logic)
  if (query.notes) {
    const keywords = query.notes.split(",").map((k) => k.trim());
    filter.$and = filter.$and || [];
    for (const keyword of keywords) {
      filter.$and.push({ notes: { $regex: keyword, $options: "i" } });
    }
  }

  // LinkedTo filter (?linkedTo=recipe:abc123&linkedTo=sleep:def456)
  if (query.linkedTo) {
    const linkedFilters = Array.isArray(query.linkedTo)
      ? query.linkedTo
      : [query.linkedTo];
    filter.$and = filter.$and || [];
    for (const lf of linkedFilters) {
      const [type, id] = lf.split(":");
      if (type && id) {
        filter.$and.push({
          linkedTo: { $elemMatch: { type, id } },
        });
      }
    }
  }

  // Remove empty $and
  if (filter.$and && filter.$and.length === 0) {
    delete filter.$and;
  }

  return filter;
}
