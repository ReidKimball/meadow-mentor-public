/**
 * @file bowelMovement.controller.js
 * @description Controller for bowel movement (BM) log endpoints.
 * Implements CRUD operations, bulk delete, and AI insights generation/retrieval.
 * Uses Shape C error responses and Shape 2 auth (token-implied user).
 *
 * @version 1.0.0
 * @date 2026-02-05
 * @author Cascade
 */

import mongoose from "mongoose";
import BowelMovement from "../models/bowelMovement.model.js";
import {
  computeLinkedTo,
  checkIdempotencyKey,
  saveIdempotencyKey,
  hashBody,
  buildListFilter,
} from "../services/bowelMovement.service.js";
import {
  createBowelMovementSchema,
  updateBowelMovementSchema,
  bulkDeleteSchema,
} from "../validation/bowelMovement.schema.js";

// --- Helper: Shape C error response ---

/**
 * @function sendError
 * @description Sends a consistent Shape C error response.
 * @param {import('express').Response} res
 * @param {number} status - HTTP status code
 * @param {string} code - Machine-readable error code
 * @param {string} message - Human-readable message
 * @param {Array} [details] - Optional field-level error details
 */
function sendError(res, status, code, message, details = []) {
  return res.status(status).json({
    success: false,
    error: { code, message, details },
  });
}

// ============================================================
// CREATE
// ============================================================

/**
 * @function createBowelMovement
 * @description Creates a new BM entry for the authenticated user.
 * Handles idempotency key checking, Zod validation, linkedTo computation,
 * and persists the entry to MongoDB.
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export async function createBowelMovement(req, res) {
  const firebaseUID = req.user.uid;
  const TAG = "(bowelMovement.controller.js - create)";

  try {
    // --- Idempotency check ---
    const idempotencyKey = req.headers["idempotency-key"];
    if (idempotencyKey) {
      const existing = await checkIdempotencyKey(firebaseUID, idempotencyKey);
      if (existing) {
        const currentHash = hashBody(req.body);
        if (currentHash === existing.bodyHash) {
          console.log(`${TAG} ♻️ Idempotency key matched — returning cached response`);
          return res.status(existing.statusCode).json(existing.responseBody);
        }
        console.warn(`${TAG} ⚠️ Idempotency key reused with different body`);
        return sendError(
          res,
          409,
          "IDEMPOTENCY_KEY_REUSED",
          "This idempotency key was already used with a different request body."
        );
      }
    }

    // --- Validation ---
    const parsed = createBowelMovementSchema.safeParse({ body: req.body });
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.slice(1).join("."), // Remove "body." prefix
        issue: issue.message,
      }));
      console.warn(`${TAG} ⚠️ Validation failed:`, details);
      return sendError(
        res,
        400,
        "VALIDATION_FAILED",
        "Request body validation failed.",
        details
      );
    }

    const { occurredAt, bristolType, symptoms, tags, notes } =
      parsed.data.body;

    // --- Compute linkedTo ---
    const occurredAtDate = new Date(occurredAt);
    const linkedTo = await computeLinkedTo(firebaseUID, occurredAtDate);

    // --- Create document ---
    const bmEntry = await BowelMovement.create({
      firebaseUID,
      occurredAt: occurredAtDate,
      bristolType,
      symptoms: symptoms || [],
      tags: tags || [],
      notes: notes || null,
      linkedTo,
    });

    const responseBody = {
      success: true,
      message: "Bowel movement entry created.",
      data: bmEntry.toObject(),
    };

    // --- Save idempotency key ---
    if (idempotencyKey) {
      try {
        await saveIdempotencyKey(
          firebaseUID,
          idempotencyKey,
          req.body,
          201,
          responseBody
        );
      } catch (err) {
        // Non-fatal: log but don't fail the request
        console.error(`${TAG} ⚠️ Failed to save idempotency key:`, err.message);
      }
    }

    console.log(`${TAG} ✅ BM entry created: ${bmEntry._id}`);
    return res.status(201).json(responseBody);
  } catch (err) {
    console.error(`${TAG} ❌ Error creating BM entry:`, err.message);
    return sendError(res, 500, "SERVER_ERROR", "Failed to create bowel movement entry.");
  }
}

// ============================================================
// LIST
// ============================================================

/**
 * @function listBowelMovements
 * @description Lists/filters BM entries for the authenticated user.
 * Returns summary shape (linkedTo = IDs + type only, no snapshots, no insights).
 * Default sort: occurredAt descending. Server-side limit=500.
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export async function listBowelMovements(req, res) {
  const firebaseUID = req.user.uid;
  const TAG = "(bowelMovement.controller.js - list)";

  try {
    const filter = buildListFilter(firebaseUID, req.query);

    const entries = await BowelMovement.find(filter)
      .sort({ occurredAt: -1 })
      .limit(500)
      .select("-insights") // Exclude insights from list view
      .lean();

    // Strip snapshots from linkedTo for summary shape
    const summaryEntries = entries.map((entry) => ({
      ...entry,
      linkedTo: (entry.linkedTo || []).map(({ type, id }) => ({ type, id })),
    }));

    console.log(`${TAG} ✅ Returned ${summaryEntries.length} entries`);
    return res.status(200).json({
      success: true,
      count: summaryEntries.length,
      data: summaryEntries,
    });
  } catch (err) {
    console.error(`${TAG} ❌ Error listing BM entries:`, err.message);
    return sendError(res, 500, "SERVER_ERROR", "Failed to list bowel movement entries.");
  }
}

// ============================================================
// READ ONE
// ============================================================

/**
 * @function getBowelMovement
 * @description Returns the full detail view of a single BM entry,
 * including linkedTo snapshots and insights array.
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export async function getBowelMovement(req, res) {
  const firebaseUID = req.user.uid;
  const { id } = req.params;
  const TAG = "(bowelMovement.controller.js - getOne)";

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendError(res, 400, "INVALID_ID", "The provided ID is not a valid format.");
  }

  try {
    const entry = await BowelMovement.findById(id).lean();

    if (!entry) {
      return sendError(res, 404, "NOT_FOUND", "Bowel movement entry not found.");
    }

    if (entry.firebaseUID !== firebaseUID) {
      return sendError(res, 403, "FORBIDDEN", "You do not have access to this entry.");
    }

    console.log(`${TAG} ✅ Returned entry: ${id}`);
    return res.status(200).json({ success: true, data: entry });
  } catch (err) {
    console.error(`${TAG} ❌ Error reading BM entry:`, err.message);
    return sendError(res, 500, "SERVER_ERROR", "Failed to read bowel movement entry.");
  }
}

// ============================================================
// UPDATE
// ============================================================

/**
 * @function updateBowelMovement
 * @description Partial update of a BM entry. If `occurredAt` is changed,
 * linkedTo is re-computed. If any field is changed, existing insights
 * are marked stale.
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export async function updateBowelMovement(req, res) {
  const firebaseUID = req.user.uid;
  const { id } = req.params;
  const TAG = "(bowelMovement.controller.js - update)";

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendError(res, 400, "INVALID_ID", "The provided ID is not a valid format.");
  }

  try {
    // --- Validation ---
    const parsed = updateBowelMovementSchema.safeParse({ body: req.body });
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.slice(1).join("."),
        issue: issue.message,
      }));
      return sendError(
        res,
        400,
        "VALIDATION_FAILED",
        "Request body validation failed.",
        details
      );
    }

    // --- Find existing entry ---
    const entry = await BowelMovement.findById(id);

    if (!entry) {
      return sendError(res, 404, "NOT_FOUND", "Bowel movement entry not found.");
    }

    if (entry.firebaseUID !== firebaseUID) {
      return sendError(res, 403, "FORBIDDEN", "You do not have access to this entry.");
    }

    const updates = parsed.data.body;

    // --- Re-compute linkedTo if occurredAt changed ---
    if (updates.occurredAt) {
      const newOccurredAt = new Date(updates.occurredAt);
      updates.occurredAt = newOccurredAt;
      updates.linkedTo = await computeLinkedTo(firebaseUID, newOccurredAt);
    }

    // --- Mark existing insights as stale ---
    if (entry.insights && entry.insights.length > 0) {
      entry.insights = entry.insights.map((insight) => ({
        ...insight.toObject ? insight.toObject() : insight,
        stale: true,
      }));
      updates.insights = entry.insights;
    }

    // --- Apply updates ---
    Object.assign(entry, updates);
    await entry.save();

    console.log(`${TAG} ✅ Updated entry: ${id}`);
    return res.status(200).json({
      success: true,
      message: "Bowel movement entry updated.",
      data: entry.toObject(),
    });
  } catch (err) {
    console.error(`${TAG} ❌ Error updating BM entry:`, err.message);
    return sendError(res, 500, "SERVER_ERROR", "Failed to update bowel movement entry.");
  }
}

// ============================================================
// DELETE ONE
// ============================================================

/**
 * @function deleteBowelMovement
 * @description Hard-deletes a single BM entry owned by the authenticated user.
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export async function deleteBowelMovement(req, res) {
  const firebaseUID = req.user.uid;
  const { id } = req.params;
  const TAG = "(bowelMovement.controller.js - delete)";

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendError(res, 400, "INVALID_ID", "The provided ID is not a valid format.");
  }

  try {
    const entry = await BowelMovement.findById(id);

    if (!entry) {
      return sendError(res, 404, "NOT_FOUND", "Bowel movement entry not found.");
    }

    if (entry.firebaseUID !== firebaseUID) {
      return sendError(res, 403, "FORBIDDEN", "You do not have access to this entry.");
    }

    await entry.deleteOne();

    console.log(`${TAG} ✅ Deleted entry: ${id}`);
    return res.status(200).json({
      success: true,
      message: "Bowel movement entry deleted.",
    });
  } catch (err) {
    console.error(`${TAG} ❌ Error deleting BM entry:`, err.message);
    return sendError(res, 500, "SERVER_ERROR", "Failed to delete bowel movement entry.");
  }
}

// ============================================================
// BULK DELETE
// ============================================================

/**
 * @function bulkDeleteBowelMovements
 * @description Deletes multiple BM entries by ID. Only deletes entries
 * owned by the authenticated user (silently skips others).
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export async function bulkDeleteBowelMovements(req, res) {
  const firebaseUID = req.user.uid;
  const TAG = "(bowelMovement.controller.js - bulkDelete)";

  try {
    // --- Validation ---
    const parsed = bulkDeleteSchema.safeParse({ body: req.body });
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.slice(1).join("."),
        issue: issue.message,
      }));
      return sendError(
        res,
        400,
        "VALIDATION_FAILED",
        "Request body validation failed.",
        details
      );
    }

    const { ids } = parsed.data.body;

    // Convert string IDs to ObjectIds, filtering out invalid ones
    const validIds = ids
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    if (validIds.length === 0) {
      return sendError(res, 400, "VALIDATION_FAILED", "No valid IDs provided.");
    }

    const result = await BowelMovement.deleteMany({
      _id: { $in: validIds },
      firebaseUID, // Only delete entries owned by this user
    });

    console.log(`${TAG} ✅ Bulk deleted ${result.deletedCount} entries`);
    return res.status(200).json({
      success: true,
      message: `${result.deletedCount} entries deleted.`,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error(`${TAG} ❌ Error bulk deleting BM entries:`, err.message);
    return sendError(res, 500, "SERVER_ERROR", "Failed to delete bowel movement entries.");
  }
}

// ============================================================
// AI INSIGHTS — GENERATE
// ============================================================

/**
 * @function generateInsight
 * @description Generates an AI analysis for a specific BM entry.
 * Costs credits (checked via credit service). Appends a new insight
 * to the entry's insights array.
 *
 * TODO: Wire up actual LLM call and credit deduction when AI service is ready.
 * Currently returns a placeholder to allow frontend development.
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export async function generateInsight(req, res) {
  const firebaseUID = req.user.uid;
  const { id } = req.params;
  const TAG = "(bowelMovement.controller.js - generateInsight)";

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendError(res, 400, "INVALID_ID", "The provided ID is not a valid format.");
  }

  try {
    const entry = await BowelMovement.findById(id);

    if (!entry) {
      return sendError(res, 404, "NOT_FOUND", "Bowel movement entry not found.");
    }

    if (entry.firebaseUID !== firebaseUID) {
      return sendError(res, 403, "FORBIDDEN", "You do not have access to this entry.");
    }

    // TODO: Check credits via credit.service.js
    // TODO: Call LLM with BM data + linkedTo snapshots for analysis
    // TODO: Deduct credits on success

    // Placeholder insight until LLM integration is built
    const newInsight = {
      generatedAt: new Date(),
      stale: false,
      analysis:
        "AI analysis placeholder — LLM integration pending. " +
        `Bristol type ${entry.bristolType} logged at ${entry.occurredAt.toISOString()}` +
        (entry.linkedTo.length > 0
          ? ` with ${entry.linkedTo.length} linked event(s).`
          : " with no linked events."),
    };

    entry.insights.push(newInsight);
    await entry.save();

    console.log(`${TAG} ✅ Insight generated for entry: ${id}`);
    return res.status(201).json({
      success: true,
      message: "Insight generated.",
      data: newInsight,
    });
  } catch (err) {
    console.error(`${TAG} ❌ Error generating insight:`, err.message);
    return sendError(res, 500, "SERVER_ERROR", "Failed to generate insight.");
  }
}

// ============================================================
// AI INSIGHTS — READ
// ============================================================

/**
 * @function getInsights
 * @description Returns the insights array for a specific BM entry.
 *
 * @async
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export async function getInsights(req, res) {
  const firebaseUID = req.user.uid;
  const { id } = req.params;
  const TAG = "(bowelMovement.controller.js - getInsights)";

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return sendError(res, 400, "INVALID_ID", "The provided ID is not a valid format.");
  }

  try {
    const entry = await BowelMovement.findById(id)
      .select("firebaseUID insights")
      .lean();

    if (!entry) {
      return sendError(res, 404, "NOT_FOUND", "Bowel movement entry not found.");
    }

    if (entry.firebaseUID !== firebaseUID) {
      return sendError(res, 403, "FORBIDDEN", "You do not have access to this entry.");
    }

    console.log(`${TAG} ✅ Returned ${entry.insights.length} insights for entry: ${id}`);
    return res.status(200).json({
      success: true,
      data: entry.insights,
    });
  } catch (err) {
    console.error(`${TAG} ❌ Error reading insights:`, err.message);
    return sendError(res, 500, "SERVER_ERROR", "Failed to read insights.");
  }
}
