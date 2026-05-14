/**
 * @file bowelMovement.routes.js
 * @description Express router for bowel movement (BM) log endpoints.
 * All routes are protected by `verifyFirebaseToken` middleware (applied at mount in index.js).
 * Maps HTTP methods to controller functions for CRUD, bulk delete, and AI insights.
 *
 * @version 1.0.0
 * @date 2026-02-05
 * @author Cascade
 *
 * @see {@link ../controllers/bowelMovement.controller.js} for business logic
 * @see {@link ../../zFeature_Plans/BM_Logging/API Design for BM Logging.md} for API design
 */

import express from "express";
import {
  createBowelMovement,
  listBowelMovements,
  getBowelMovement,
  updateBowelMovement,
  deleteBowelMovement,
  bulkDeleteBowelMovements,
  generateInsight,
  getInsights,
} from "../controllers/bowelMovement.controller.js";

const router = express.Router();

// --- CRUD ---

/**
 * @route POST /api/bowel-movements
 * @description Create a new BM entry. Supports idempotency via `Idempotency-Key` header.
 * @access Protected (verifyFirebaseToken)
 * @returns {object} 201 - Created entry with linkedTo
 * @returns {object} 400 - Validation error
 * @returns {object} 409 - Idempotency key reused with different body
 */
router.post("/", createBowelMovement);

/**
 * @route GET /api/bowel-movements
 * @description List/filter BM entries (summary shape — no snapshots, no insights).
 * @access Protected (verifyFirebaseToken)
 * @returns {object} 200 - Array of summary entries with count
 */
router.get("/", listBowelMovements);

/**
 * @route GET /api/bowel-movements/:id
 * @description Read one BM entry (full detail — snapshots + insights).
 * @access Protected (verifyFirebaseToken)
 * @returns {object} 200 - Full entry
 * @returns {object} 403 - Not owner
 * @returns {object} 404 - Not found
 */
router.get("/:id", getBowelMovement);

/**
 * @route PATCH /api/bowel-movements/:id
 * @description Partial update. Re-computes linkedTo if occurredAt changes.
 *              Marks existing insights as stale.
 * @access Protected (verifyFirebaseToken)
 * @returns {object} 200 - Updated entry
 * @returns {object} 400 - Validation error
 * @returns {object} 403 - Not owner
 * @returns {object} 404 - Not found
 */
router.patch("/:id", updateBowelMovement);

/**
 * @route DELETE /api/bowel-movements/:id
 * @description Hard-delete one BM entry.
 * @access Protected (verifyFirebaseToken)
 * @returns {object} 200 - Success message
 * @returns {object} 403 - Not owner
 * @returns {object} 404 - Not found
 */
router.delete("/:id", deleteBowelMovement);

/**
 * @route DELETE /api/bowel-movements
 * @description Bulk delete BM entries. IDs passed in request body.
 * @access Protected (verifyFirebaseToken)
 * @returns {object} 200 - Success with deletedCount
 * @returns {object} 400 - Empty or invalid ids
 */
router.delete("/", bulkDeleteBowelMovements);

// --- AI Insights ---

/**
 * @route POST /api/bowel-movements/:id/insights
 * @description Generate AI analysis for a BM entry. Costs credits.
 * @access Protected (verifyFirebaseToken)
 * @returns {object} 201 - Generated insight
 * @returns {object} 402 - Insufficient credits (future)
 * @returns {object} 403 - Not owner
 * @returns {object} 404 - Not found
 */
router.post("/:id/insights", generateInsight);

/**
 * @route GET /api/bowel-movements/:id/insights
 * @description Read existing insights for a BM entry.
 * @access Protected (verifyFirebaseToken)
 * @returns {object} 200 - Insights array
 * @returns {object} 403 - Not owner
 * @returns {object} 404 - Not found
 */
router.get("/:id/insights", getInsights);

export default router;
