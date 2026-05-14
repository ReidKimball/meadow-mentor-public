/**
 * @file linear.service.js
 * @description Lightweight service for creating Linear issues via the GraphQL API.
 * Currently used to notify the admin when Chef Kay adds a new ingredient to the
 * therapeutic diet food database with `verification_status: 'pending'`.
 * All calls are designed to be fire-and-forget — callers should NOT await the returned
 * promise so that Linear API latency or failures never block the user experience.
 *
 * ## Environment Variables
 * - `CHEF_KAY_PENDING_INGREDIENTS` — Linear API key with issue-create scope.
 * - `LINEAR_TEAM_ID` — The Linear team ID where issues are created.
 *
 * @requires fetch (Node.js 18+ global)
 * @author Cascade
 * @version 1.0.0
 * @date 2026-03-22
 */

// ── Constants ────────────────────────────────────────────────────────────────

/**
 * @constant {string} LINEAR_API_URL
 * @description The Linear GraphQL API endpoint.
 * @access private
 */
const LINEAR_API_URL = "https://api.linear.app/graphql";

/**
 * @var {boolean} missingEnvWarned
 * @description Guards against repeated console warnings when env vars are missing.
 * Ensures the warning is logged only once per process lifetime.
 * @access private
 */
let missingEnvWarned = false;

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * @function getLinearConfig
 * @description Reads and validates the Linear environment variables. Returns null
 * (and logs a one-time warning) if either variable is missing, allowing callers
 * to gracefully no-op in development environments without Linear configured.
 *
 * @returns {{ apiKey: string, teamId: string } | null} Config object or null if unconfigured.
 * @access private
 */
const getLinearConfig = () => {
  const apiKey = process.env.CHEF_KAY_PENDING_INGREDIENTS;
  const teamId = process.env.LINEAR_TEAM_ID;

  if (!apiKey || !teamId) {
    if (!missingEnvWarned) {
      console.warn(
        "[linear.service.js] CHEF_KAY_PENDING_INGREDIENTS or LINEAR_TEAM_ID not set — Linear issue creation disabled."
      );
      missingEnvWarned = true;
    }
    return null;
  }

  return { apiKey, teamId };
};

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * @async
 * @function createPendingIngredientIssue
 * @description Creates a Linear issue notifying the admin that Chef Kay added a new
 * ingredient to the therapeutic diet food database and it needs manual verification.
 *
 * **Important:** This function is designed to be called fire-and-forget. Do NOT await
 * it in hot paths (tool execution, recipe generation). Errors are caught and logged
 * internally — the function never throws to the caller.
 *
 * @param {Object} params - The ingredient details to include in the issue.
 * @param {string} params.diet_code - The therapeutic diet code (e.g., "SCD", "GAPS").
 * @param {string} params.food_name - The human-readable food name.
 * @param {boolean} params.allowed - Whether the AI determined this food is allowed.
 * @param {string|null} [params.note] - Optional note or explanation from the AI.
 * @param {string|Date} [params.createdAt] - The timestamp when the ingredient was saved.
 * @returns {Promise<void>} Resolves silently on success; logs and resolves on failure.
 *
 * @example
 * // Fire-and-forget after saving a new ingredient
 * createPendingIngredientIssue({
 *   diet_code: "SCD",
 *   food_name: "Tapioca Starch",
 *   allowed: false,
 *   note: "Contains complex starches not permitted on SCD.",
 *   createdAt: new Date().toISOString(),
 * }).catch(() => {});
 */
export const createPendingIngredientIssue = async ({
  diet_code,
  food_name,
  allowed,
  note = null,
  createdAt = null,
}) => {
  const config = getLinearConfig();
  if (!config) return;

  const title = `[Pending] ${food_name} — ${diet_code}`;

  const formattedCreatedAt = createdAt ? new Date(createdAt).toISOString() : "—";

  const description = [
    `## New Ingredient Pending Verification`,
    ``,
    `| Field | Value |`,
    `|---|---|`,
    `| **Food Name** | ${food_name} |`,
    `| **Diet Code** | ${diet_code} |`,
    `| **AI Determination** | ${allowed ? "✅ Allowed" : "❌ Not Allowed"} |`,
    `| **Note** | ${note || "—"} |`,
    `| **Created At** | ${formattedCreatedAt} |`,
    ``,
    `### Action Required`,
    `Review this ingredient in the \`therapeutic-diet-foods\` collection and update \`verification_status\` from \`pending\` to \`approved\` or \`rejected\`.`,
  ].join("\n");

  const mutation = `
    mutation CreateIssue($title: String!, $description: String!, $teamId: String!) {
      issueCreate(input: { title: $title, description: $description, teamId: $teamId }) {
        success
        issue { id identifier url }
      }
    }
  `;

  try {
    const response = await fetch(LINEAR_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: config.apiKey,
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          title,
          description,
          teamId: config.teamId,
        },
      }),
    });

    if (!response.ok) {
      console.error(
        `[linear.service.js] HTTP ${response.status} creating issue for "${food_name}":`,
        await response.text().catch(() => "Could not read response body")
      );
      return;
    }

    const data = await response.json();

    if (data.errors) {
      console.error(
        `[linear.service.js] GraphQL errors creating issue for "${food_name}":`,
        JSON.stringify(data.errors)
      );
      return;
    }

    const issue = data?.data?.issueCreate?.issue;
    if (issue) {
      console.log(
        `[linear.service.js] Created Linear issue ${issue.identifier} for "${food_name}" → ${issue.url}`
      );
    }
  } catch (error) {
    console.error(
      `[linear.service.js] Failed to create Linear issue for "${food_name}":`,
      error.message
    );
  }
};
