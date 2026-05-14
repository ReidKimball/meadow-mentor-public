/**
 * @file aiMemory.service.js
 * @description Provides the durable Chef Kay memory helpers used to validate, persist,
 * summarize, and normalize cross-session AI memory stored on the UserHealth document.
 * This service is intentionally narrow in scope for the MVP: it manages only diet stage,
 * active goals, and recent progress notes.
 * @version 1.0.0
 * @requires ../models/userHealth.model.js
 * @date 2026-03-10
 * @author Cascade
 */

import UserHealth from "../models/userHealth.model.js";

/**
 * @constant {number} MAX_ACTIVE_PRIMARY_GOALS
 * @description The maximum number of active primary goals that may exist at one time.
 */
export const MAX_ACTIVE_PRIMARY_GOALS = 1;

/**
 * @constant {number} MAX_ACTIVE_SECONDARY_GOALS
 * @description The maximum number of active secondary goals that may exist at one time.
 */
export const MAX_ACTIVE_SECONDARY_GOALS = 2;

/**
 * @constant {number} MAX_PROGRESS_NOTES
 * @description The maximum number of recent progress notes retained in durable memory.
 */
export const MAX_PROGRESS_NOTES = 10;

/**
 * @constant {Readonly<Record<string, string[]>>} SUPPORTED_DIET_STAGES
 * @description App-supported stage labels for the MVP diets that require structured stage tracking.
 * The labels are intentionally constrained to avoid muddy, food-specific pseudo-stages.
 */
export const SUPPORTED_DIET_STAGES = Object.freeze({
  GAPS: ["Stage 1", "Stage 2", "Stage 3", "Stage 4", "Stage 5", "Stage 6", "Full GAPS", "Reintroduction"],
  SCD: ["Intro Diet", "Stage 1", "Stage 2", "Stage 3", "Stage 4", "Stage 5", "Maintenance"],
  "Paleo AIP": ["Elimination", "Reintroduction", "Maintenance"],
  Mediterranean: ["Introduction", "Maintenance"],
});

/**
 * @constant {string[]}
 * @description Allowed goal categories for Chef Kay memory.
 */
export const AI_MEMORY_GOAL_CATEGORIES = [
  "clinical",
  "behavior",
  "symptom",
  "food_expansion",
  "lifestyle",
  "other",
];

/**
 * @constant {string[]}
 * @description Allowed progress note types for Chef Kay memory.
 */
export const AI_MEMORY_PROGRESS_TYPES = [
  "win",
  "setback",
  "tolerance",
  "trigger",
  "milestone",
  "adherence",
];

/**
 * @constant {string[]}
 * @description Allowed AI memory sources.
 */
export const AI_MEMORY_SOURCES = ["user_reported", "ai_inferred"];

/**
 * @function normalizeText
 * @description Normalizes comparison text for goal and note matching without mutating the saved display value.
 * @param {string | null | undefined} value - The raw text value to normalize.
 * @returns {string} Lowercased, trimmed text suitable for equality comparisons.
 */
function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

/**
 * @function toDateValue
 * @description Converts a value into a Date instance when possible, otherwise returns null.
 * @param {Date | string | number | null | undefined} value - Value to coerce.
 * @returns {Date | null} Parsed date or null.
 */
function toDateValue(value) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * @function sortByUpdatedAtAscending
 * @description Sorts items oldest-first using updatedAt or createdAt timestamps.
 * @param {Array<object>} items - Collection to sort.
 * @returns {Array<object>} Sorted copy of the input array.
 */
function sortByUpdatedAtAscending(items) {
  return [...items].sort((left, right) => {
    const leftDate = toDateValue(left.updatedAt || left.createdAt)?.getTime() || 0;
    const rightDate = toDateValue(right.updatedAt || right.createdAt)?.getTime() || 0;
    return leftDate - rightDate;
  });
}

/**
 * @function getAllowedDietStages
 * @description Returns the app-supported diet stages for the provided primary diet.
 * @param {string | null | undefined} primaryDiet - The user's top-level primary diet.
 * @returns {string[]} Supported stages for the diet, or an empty array when staging is not supported.
 */
export function getAllowedDietStages(primaryDiet) {
  return SUPPORTED_DIET_STAGES[primaryDiet] || [];
}

/**
 * @function normalizeAiMemory
 * @description Produces a safe, bounded, and UI/prompt-friendly aiMemory object.
 * This function does not infer new facts; it only validates shape, applies deterministic caps,
 * and normalizes timestamp fields.
 * @param {string | null | undefined} primaryDiet - The user's top-level primary diet.
 * @param {object | null | undefined} aiMemory - Raw aiMemory object from persistence.
 * @returns {{dietStage: {value: string | null, updatedAt: Date | null, source: string}, activeGoals: Array<object>, progressNotes: Array<object>}} Normalized memory object.
 */
export function normalizeAiMemory(primaryDiet, aiMemory = {}) {
  const allowedStages = getAllowedDietStages(primaryDiet);
  const rawDietStage = aiMemory?.dietStage || {};
  const stageValue = typeof rawDietStage?.value === "string" ? rawDietStage.value.trim() : null;
  const stageIsAllowed = !stageValue || allowedStages.includes(stageValue);

  const activeGoals = Array.isArray(aiMemory?.activeGoals)
    ? aiMemory.activeGoals
        .filter((goal) => goal && typeof goal.goal === "string" && goal.goal.trim())
        .map((goal) => ({
          goal: goal.goal.trim(),
          priority: goal.priority === "primary" ? "primary" : "secondary",
          category: AI_MEMORY_GOAL_CATEGORIES.includes(goal.category) ? goal.category : "other",
          status: ["active", "paused", "achieved"].includes(goal.status) ? goal.status : "active",
          updatedAt: toDateValue(goal.updatedAt) || new Date(),
          source: AI_MEMORY_SOURCES.includes(goal.source) ? goal.source : "user_reported",
        }))
    : [];

  const progressNotes = Array.isArray(aiMemory?.progressNotes)
    ? aiMemory.progressNotes
        .filter((note) => note && typeof note.summary === "string" && note.summary.trim())
        .map((note) => ({
          type: AI_MEMORY_PROGRESS_TYPES.includes(note.type) ? note.type : "milestone",
          summary: note.summary.trim(),
          relatedGoal: typeof note.relatedGoal === "string" && note.relatedGoal.trim() ? note.relatedGoal.trim() : null,
          createdAt: toDateValue(note.createdAt) || new Date(),
          source: AI_MEMORY_SOURCES.includes(note.source) ? note.source : "user_reported",
        }))
    : [];

  return {
    dietStage: {
      value: stageIsAllowed ? stageValue : null,
      updatedAt: toDateValue(rawDietStage?.updatedAt),
      source: AI_MEMORY_SOURCES.includes(rawDietStage?.source) ? rawDietStage.source : "user_reported",
    },
    activeGoals,
    progressNotes: sortByUpdatedAtAscending(progressNotes).slice(-MAX_PROGRESS_NOTES),
  };
}

/**
 * @function buildAiMemorySummary
 * @description Builds a compact prompt-ready summary string for Chef Kay long-term memory.
 * @param {string | null | undefined} primaryDiet - The user's top-level primary diet.
 * @param {object | null | undefined} aiMemory - Raw or normalized aiMemory object.
 * @returns {string} Summary text injected into the Ask Kay system prompt.
 */
export function buildAiMemorySummary(primaryDiet, aiMemory = {}) {
  const normalized = normalizeAiMemory(primaryDiet, aiMemory);
  const activeGoals = normalized.activeGoals.filter((goal) => goal.status === "active");
  const primaryGoal = activeGoals.find((goal) => goal.priority === "primary");
  const secondaryGoals = activeGoals.filter((goal) => goal.priority === "secondary");
  const recentProgress = [...normalized.progressNotes].reverse().slice(0, 5);

  const lines = [
    `Current Diet Stage: ${normalized.dietStage.value || "None recorded"}`,
    `Primary Goal: ${primaryGoal ? primaryGoal.goal : "None recorded"}`,
    `Secondary Goals: ${secondaryGoals.length > 0 ? secondaryGoals.map((goal) => goal.goal).join("; ") : "None recorded"}`,
    "Recent Progress:",
  ];

  if (recentProgress.length === 0) {
    lines.push("- None recorded");
  } else {
    recentProgress.forEach((note) => {
      const relatedGoal = note.relatedGoal ? ` (related goal: ${note.relatedGoal})` : "";
      lines.push(`- ${note.type}: ${note.summary}${relatedGoal}`);
    });
  }

  return lines.join("\n");
}

/**
 * @function findGoalIndex
 * @description Finds a goal by normalized goal text.
 * @param {Array<object>} goals - Existing goal collection.
 * @param {string} goalText - Goal text to match.
 * @returns {number} Matching index or -1 when not found.
 */
function findGoalIndex(goals, goalText) {
  const normalizedTarget = normalizeText(goalText);
  return goals.findIndex((goal) => normalizeText(goal.goal) === normalizedTarget);
}

/**
 * @function enforceSecondaryGoalCap
 * @description Applies the active secondary-goal limit. When the cap is exceeded,
 * the function drops an explicitly requested goal if available; otherwise it evicts the oldest
 * active secondary goal deterministically.
 * @param {Array<object>} goals - Full goal collection.
 * @param {string | undefined} dropGoal - Optional goal text to remove after clarification.
 * @returns {Array<object>} Goal collection with the secondary cap enforced.
 */
function enforceSecondaryGoalCap(goals, dropGoal) {
  let mutableGoals = [...goals];

  // If a specific goal is targeted for removal, remove it first.
  if (dropGoal) {
    const dropIndex = mutableGoals.findIndex(
      (goal) => goal.priority === "secondary" && goal.status === "active" && normalizeText(goal.goal) === normalizeText(dropGoal)
    );
    if (dropIndex >= 0) {
      mutableGoals.splice(dropIndex, 1);
    }
  }

  const activeSecondaryGoals = mutableGoals.filter((goal) => goal.priority === "secondary" && goal.status === "active");

  // If we are now within the cap, no further action is needed.
  if (activeSecondaryGoals.length <= MAX_ACTIVE_SECONDARY_GOALS) {
    return mutableGoals;
  }

  // Determine which oldest goals to evict via a single sort + slice.
  const sortedActiveSecondary = sortByUpdatedAtAscending(activeSecondaryGoals);
  const goalsToEvictCount = sortedActiveSecondary.length - MAX_ACTIVE_SECONDARY_GOALS;
  const goalsToEvict = new Set(
    sortedActiveSecondary.slice(0, goalsToEvictCount).map((g) => normalizeText(g.goal))
  );

  // Filter out the evicted goals from the main list in one pass.
  return mutableGoals.filter((goal) => {
    // Only apply eviction logic to active secondary goals.
    if (goal.priority === "secondary" && goal.status === "active") {
      return !goalsToEvict.has(normalizeText(goal.goal));
    }
    return true;
  });
}

/**
 * @function upsertGoalMemory
 * @description Applies goal insertion or update semantics, including primary-goal clarification rules.
 * @param {Array<object>} existingGoals - Current normalized goals.
 * @param {object} memory - Goal save payload from the tool.
 * @param {Date} now - Timestamp for the mutation.
 * @returns {Array<object>} Updated goal collection.
 * @throws {Error} Thrown when a new primary goal would replace an existing primary goal without explicit behavior.
 */
function upsertGoalMemory(existingGoals, memory, now) {
  const nextGoals = [...existingGoals];
  const goalIndex = findGoalIndex(nextGoals, memory.goal);
  const activePrimaryIndex = nextGoals.findIndex((goal) => goal.priority === "primary" && goal.status === "active");
  const normalizedSource = AI_MEMORY_SOURCES.includes(memory.source) ? memory.source : "user_reported";
  const goalEntry = {
    goal: memory.goal.trim(),
    priority: memory.priority,
    category: AI_MEMORY_GOAL_CATEGORIES.includes(memory.category) ? memory.category : "other",
    status: ["active", "paused", "achieved"].includes(memory.status) ? memory.status : "active",
    updatedAt: now,
    source: normalizedSource,
  };

  if (memory.priority === "primary") {
    const currentPrimary = activePrimaryIndex >= 0 ? nextGoals[activePrimaryIndex] : null;
    const isChangingPrimary = currentPrimary && normalizeText(currentPrimary.goal) !== normalizeText(memory.goal);

    if (isChangingPrimary && !memory.existingPrimaryBehavior) {
      throw new Error("Clarification required before replacing the current primary goal.");
    }

    if (isChangingPrimary && memory.existingPrimaryBehavior === "demote_to_secondary") {
      nextGoals[activePrimaryIndex] = {
        ...currentPrimary,
        priority: "secondary",
        updatedAt: now,
      };
    }

    if (isChangingPrimary && memory.existingPrimaryBehavior === "pause_old_primary") {
      nextGoals[activePrimaryIndex] = {
        ...currentPrimary,
        status: "paused",
        updatedAt: now,
      };
    }
  }

  if (goalIndex >= 0) {
    nextGoals[goalIndex] = {
      ...nextGoals[goalIndex],
      ...goalEntry,
    };
  } else {
    nextGoals.push(goalEntry);
  }

  return enforceSecondaryGoalCap(nextGoals, memory.dropGoal);
}

/**
 * @function appendProgressNote
 * @description Appends a new progress note and applies deterministic FIFO eviction.
 * @param {Array<object>} existingNotes - Current normalized progress notes.
 * @param {object} memory - Progress-note payload from the tool.
 * @param {Date} now - Timestamp for the mutation.
 * @returns {Array<object>} Updated progress-note collection.
 */
function appendProgressNote(existingNotes, memory, now) {
  const nextNotes = [
    ...sortByUpdatedAtAscending(existingNotes),
    {
      type: memory.noteType,
      summary: memory.summary.trim(),
      relatedGoal: typeof memory.relatedGoal === "string" && memory.relatedGoal.trim() ? memory.relatedGoal.trim() : null,
      createdAt: now,
      source: AI_MEMORY_SOURCES.includes(memory.source) ? memory.source : "user_reported",
    },
  ];

  return nextNotes.slice(-MAX_PROGRESS_NOTES);
}

/**
 * @function validateMemoryPayload
 * @description Enforces the required fields for each supported durable memory type.
 * This keeps backend validation strict even when the provider-facing tool schema must stay flat
 * for Gemini compatibility.
 * @param {object} memory - Tool payload to validate.
 * @throws {Error} Thrown when the payload is missing required fields or uses an unsupported type.
 */
function validateMemoryPayload(memory) {
  if (!memory || typeof memory !== "object") {
    throw new Error("Chef Kay memory save requires a memory payload.");
  }

  if (!["diet_stage", "goal", "progress_note"].includes(memory.type)) {
    throw new Error("Chef Kay memory save requires a supported memory type.");
  }

  if (memory.type === "diet_stage" && !memory.dietStage) {
    throw new Error("Diet stage memory requires a dietStage value.");
  }

  if (memory.type === "goal") {
    if (!memory.goal || !String(memory.goal).trim()) {
      throw new Error("Goal memory requires goal text.");
    }

    if (!["primary", "secondary"].includes(memory.priority)) {
      throw new Error("Goal memory requires a valid priority.");
    }

    if (!AI_MEMORY_GOAL_CATEGORIES.includes(memory.category)) {
      throw new Error("Goal memory requires a valid category.");
    }
  }

  if (memory.type === "progress_note") {
    if (!AI_MEMORY_PROGRESS_TYPES.includes(memory.noteType)) {
      throw new Error("Progress-note memory requires a valid noteType.");
    }

    if (!memory.summary || !String(memory.summary).trim()) {
      throw new Error("Progress-note memory requires summary text.");
    }
  }
}

/**
 * @function saveUserMemory
 * @description Validates and persists one typed Chef Kay memory mutation.
 * @param {{userId: string, firebaseUID: string, primaryDiet: string | null | undefined, memory: object}} params - Save context and typed payload.
 * @returns {Promise<{aiMemory: object, aiMemorySummary: string, savedItemSummary: string}>} Persisted memory payload plus prompt summary.
 * @throws {Error} Thrown when the memory payload is incompatible with the current primary diet or goal rules.
 */
export async function saveUserMemory({ userId, firebaseUID, primaryDiet, memory }) {
  if (!userId || !firebaseUID) {
    throw new Error("Chef Kay memory save requires both userId and firebaseUID.");
  }

  validateMemoryPayload(memory);

  const now = new Date();
  const health = await UserHealth.findOne({ firebaseUID }, { aiMemory: 1 });

  const existingAiMemory = health?.aiMemory?.toObject ? health.aiMemory.toObject() : health?.aiMemory;
  const nextAiMemory = normalizeAiMemory(primaryDiet, existingAiMemory);
  let savedItemSummary = "";

  if (memory.type === "diet_stage") {
    const allowedStages = getAllowedDietStages(primaryDiet);

    if (allowedStages.length === 0) {
      throw new Error(`Diet stages are not supported for primary diet \"${primaryDiet || "unknown"}\".`);
    }

    if (!allowedStages.includes(memory.dietStage)) {
      throw new Error(`Diet stage \"${memory.dietStage}\" is not valid for primary diet \"${primaryDiet}\".`);
    }

    nextAiMemory.dietStage = {
      value: memory.dietStage,
      updatedAt: now,
      source: AI_MEMORY_SOURCES.includes(memory.source) ? memory.source : "user_reported",
    };
    savedItemSummary = `Saved current diet stage as ${memory.dietStage}.`;
  }

  if (memory.type === "goal") {
    nextAiMemory.activeGoals = upsertGoalMemory(nextAiMemory.activeGoals, memory, now);
    savedItemSummary = `Saved ${memory.priority} goal: ${memory.goal.trim()}.`;
  }

  if (memory.type === "progress_note") {
    nextAiMemory.progressNotes = appendProgressNote(nextAiMemory.progressNotes, memory, now);
    savedItemSummary = `Saved ${memory.noteType} progress note.`;
  }

  const writeResult = await UserHealth.updateOne(
    { firebaseUID },
    {
      $set: {
        aiMemory: nextAiMemory,
      },
      $setOnInsert: {
        userId,
        firebaseUID,
      },
    },
    {
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: false,
    }
  );

  if (writeResult.matchedCount === 0 && !writeResult.upsertedId) {
    console.error(
      `[saveUserMemory] updateOne was a no-op for firebaseUID=${firebaseUID}. ` +
      `matched=${writeResult.matchedCount}, modified=${writeResult.modifiedCount}, upserted=${!!writeResult.upsertedId}`
    );
    throw new Error("Chef Kay memory save did not persist. No document was matched or created.");
  }

  return {
    aiMemory: nextAiMemory,
    aiMemorySummary: buildAiMemorySummary(primaryDiet, nextAiMemory),
    savedItemSummary,
  };
}

export default {
  AI_MEMORY_GOAL_CATEGORIES,
  AI_MEMORY_PROGRESS_TYPES,
  AI_MEMORY_SOURCES,
  MAX_ACTIVE_PRIMARY_GOALS,
  MAX_ACTIVE_SECONDARY_GOALS,
  MAX_PROGRESS_NOTES,
  SUPPORTED_DIET_STAGES,
  buildAiMemorySummary,
  getAllowedDietStages,
  normalizeAiMemory,
  saveUserMemory,
};
