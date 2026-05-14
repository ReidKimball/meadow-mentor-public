/**
 * @file generateSlug.js
 * @description Utility helpers for generating SEO-friendly slugs for public Recipes and Meal Plans.
 *
 * IMPORTANT:
 * - This does NOT auto-check the database. Consumers should handle collisions.
 * - Use {@link appendShortHashSlug} to add a 4-character suffix when a collision is detected.
 */

import crypto from 'crypto';

/**
 * Words we remove from titles because they add noise and rarely improve SEO.
 *
 * Example: "Chicken and Rice" -> we remove "and" so the slug becomes shorter and cleaner.
 *
 * Note: this list is intentionally small; removing too many words can make slugs confusing.
 */
const STOP_WORDS = new Set(['with', 'and', 'the', 'a', 'for']);

/**
 * Common "marketing" words that appear in recipe titles, but usually do not help search intent.
 *
 * Example: "Easy Healthy Chicken Soup" -> removing "easy" and "healthy" keeps the slug focused on
 * what the dish actually is.
 */
const RECIPE_FILLER_WORDS = new Set([
  'gentle',
  'easy',
  'quick',
  'simple',
  'best',
  'healthy',
  'holiday',
  'christmas',
  'bliss',
  'delight',
  'ground', // ground turkey becomes turkey
  'healing',
  'hearty',
  'golden',
  'meadow',
  'kays',
  'nourishing',
  'savory',
  'friendly',
  'soothing',
  'sunshine',
  'warm',
  'warming',
  '(copy)',
  '(copied)',
]);

/**
 * Cooking method tokens that are useful in slugs *when they help describe the dish*.
 *
 * Example: "Baked Salmon" -> "baked" is meaningful and can improve SEO.
 */
const COOKING_METHODS = new Set([
  'baked',
  'roasted',
  'grilled',
  'fried',
  'sauteed',
  'sautéed',
  'steamed',
  'poached',
  'broiled',
  'seared',
  'slow',
  'slow-cooked',
  'instant',
  'air',
]);

/**
 * Words that commonly appear at the very end of recipe titles but should not be in the slug.
 *
 * Example: "Chocolate Chip Cookies Recipe" -> we drop the trailing "recipe".
 */
const RECIPE_TRAILING_WORDS = new Set(['recipe']);

/**
 * Words that show up in meal plan titles but are redundant because the slug will always
 * end in "meal-plan".
 */
const MEAL_PLAN_SKIP_WORDS = new Set([
  'meal',
  'meals',
  'plan',
  'plans',
  'day',
  'days',
  'week',
  'weekly',
]);

/**
 * Diet synonyms that we can infer from text.
 *
 * This is only used for meal plans when a diet isn't explicitly provided.
 * For recipes, we generally use the diet field directly (and keep it short).
 */
const DIET_SYNONYMS = [
  { pattern: /\bscd\b/i, token: 'scd' },
  { pattern: /\baip\b/i, token: 'aip' },
  { pattern: /\bmediterranean\b/i, token: 'mediterranean' },
  { pattern: /\bgluten[-\s]?free\b/i, token: 'gf' },
  { pattern: /\bdairy[-\s]?free\b/i, token: 'df' },
  { pattern: /\bgrain[-\s]?free\b/i, token: 'grain-free' },
];

const UUID_24_HEX_RE = /\b[0-9a-f]{24}\b/gi;
const UUID_V4_RE = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
 const DIACRITICS_RE = /[\u0300-\u036f]/g;

/**
 * Removes UUID-like substrings from a piece of text.
 *
 * Why: sometimes titles or AI outputs accidentally include IDs (Mongo ObjectIds, UUIDs).
 * Those should never end up in URLs.
 *
 * @param {string} input
 * @returns {string}
 */
function stripUuidLike(input) {
  if (!input || typeof input !== 'string') return '';
  return input.replace(UUID_V4_RE, ' ').replace(UUID_24_HEX_RE, ' ');
}

/**
 * Converts a string into normalized tokens.
 *
 * Steps:
 * - lowercases
 * - removes apostrophes
 * - converts any non-alphanumeric characters to spaces
 * - splits on spaces
 *
 * @param {string} input
 * @returns {string[]} tokens
 */
function toTokens(input) {
  const cleaned = stripUuidLike(input)
    .normalize('NFD')
    .replace(DIACRITICS_RE, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  if (!cleaned) return [];

  return cleaned
    .split(' ')
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * Removes generic stop words from a token list.
 * @param {string[]} tokens
 * @returns {string[]}
 */
function removeStopWords(tokens) {
  return (tokens || []).filter((t) => !STOP_WORDS.has(t));
}

/**
 * Removes low-value "filler" words from recipe titles.
 * @param {string[]} tokens
 * @returns {string[]}
 */
function removeRecipeFillers(tokens) {
  return (tokens || []).filter((t) => !RECIPE_FILLER_WORDS.has(t));
}

/**
 * Removes trailing tokens (only from the end) while they belong to the provided set.
 *
 * Example: ["cookies", "recipe"] -> ["cookies"]
 *
 * @param {string[]} tokens
 * @param {Set<string>} trailingSet
 * @returns {string[]}
 */
function removeTrailing(tokens, trailingSet) {
  const list = [...(tokens || [])];
  while (list.length > 0 && trailingSet.has(list[list.length - 1])) {
    list.pop();
  }
  return list;
}

/**
 * Deduplicates tokens without changing the original order.
 *
 * Why: we want stable, readable slugs (no repeated words) without re-sorting terms.
 *
 * @param {string[]} tokens
 * @returns {string[]}
 */
function uniqPreserveOrder(tokens) {
  const seen = new Set();
  const out = [];
  for (const t of tokens || []) {
    if (!t) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

/**
 * Finds diet tokens (like "scd", "aip", etc) from freeform text.
 *
 * This is used for meal plan slugs if no explicit diet field is provided.
 *
 * @param {string} input
 * @returns {string[]} diet tokens
 */
function extractDietTokensFromText(input) {
  const found = [];
  for (const { pattern, token } of DIET_SYNONYMS) {
    if (pattern.test(input || '')) {
      found.push(token);
    }
  }
  return uniqPreserveOrder(found);
}

/**
 * Joins tokens into a URL-safe slug.
 *
 * - joins with '-'
 * - collapses double dashes
 * - trims leading/trailing dashes
 *
 * @param {string[]} tokens
 * @returns {string}
 */
function joinTokens(tokens) {
  return (tokens || []).filter(Boolean).join('-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
}

/**
 * High priority "override" tags for recipe slug prefixes.
 *
 * If a recipe includes any of these tags, the first match (top to bottom) becomes
 * the slug prefix instead of the diet name.
 */
export const HIGH_PRIORITY_SEO_TAGS = [
  // Tier 1: Medical / Pain (Overrides everything)
  'flare friendly',
  'low residue',
  'low fiber',
  'low fodmap',
  'soft food',
  'liquid diet',

  // Tier 2: The "Money" Restrictions (Overrides diet name)
  'gluten free dairy free',
  'dairy free',
  'gluten free',
  'nut free',
];

/**
 * Tier 1 tags are the highest "pain-intent" / medical intent.
 *
 * Rule: if any Tier 1 tag is present, we use ONLY that tag as the slug prefix.
 * We do NOT add additional restriction prefixes.
 */
const TIER_1_MEDICAL_TAGS = [
  'flare friendly',
  'low residue',
  'low fiber',
  'low fodmap',
  'soft food',
  'liquid diet',
];

/**
 * Normalizes tag strings so comparisons are reliable.
 *
 * Example:
 * - "Low-Fiber" -> "low fiber"
 * - "  dairy   free " -> "dairy free"
 *
 * @param {string} tag
 * @returns {string}
 */
function normalizeComparableTag(tag) {
  return toTokens(tag).join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Picks a recipe slug prefix based on tags (medical/restriction overrides), with a
 * fallback to the diet name.
 *
 * @param {string[]} tags - Recipe tags.
 * @param {string} diet - Recipe diet label.
 * @returns {string} A URL-safe slug prefix.
 */
export function pickRecipeSlugPrefix(tags, diet) {
  const normalizedTagSet = new Set(
    (Array.isArray(tags) ? tags : [])
      .filter((t) => typeof t === 'string')
      .map((t) => normalizeComparableTag(t))
      .filter(Boolean)
  );

  // Tier 1: medical intent overrides should stay single-prefix (most "pain-intent").
  for (const medicalTag of TIER_1_MEDICAL_TAGS) {
    const normalizedMedicalTag = normalizeComparableTag(medicalTag);
    if (normalizedMedicalTag && normalizedTagSet.has(normalizedMedicalTag)) {
      return joinTokens(toTokens(medicalTag)) || 'recipe';
    }
  }

  // Tier 2: if both restrictions exist, synthesize a combined prefix.
  const hasGlutenFree = normalizedTagSet.has(normalizeComparableTag('gluten free'));
  const hasDairyFree = normalizedTagSet.has(normalizeComparableTag('dairy free'));
  if (hasGlutenFree && hasDairyFree) {
    return 'gluten-free-dairy-free';
  }

  for (const priorityTag of HIGH_PRIORITY_SEO_TAGS) {
    const normalizedPriorityTag = normalizeComparableTag(priorityTag);
    if (normalizedPriorityTag && normalizedTagSet.has(normalizedPriorityTag)) {
      return joinTokens(toTokens(priorityTag)) || 'recipe';
    }
  }

  return joinTokens(toTokens(diet)) || 'recipe';
}

/**
 * Append a short, 4-character hash suffix to a slug.
 *
 * @param {string} baseSlug - Base slug (already slugified).
 * @param {string} salt - Any string that makes the suffix stable and unique (e.g., document id).
 * @returns {string} Slug with `-abcd` suffix.
 */
export function appendShortHashSlug(baseSlug, salt) {
  const safeBase = typeof baseSlug === 'string' ? baseSlug.trim() : '';
  const safeSalt = typeof salt === 'string' ? salt : '';

  const hash = crypto.createHash('sha1').update(safeSalt).digest('hex').slice(0, 4);
  return safeBase ? `${safeBase}-${hash}` : hash;
}

/**
 * Generate a SEO-friendly slug.
 *
 * @param {string} title - Human-readable title.
 * @param {'recipe'|'mealPlan'} type - Document type.
 * @param {string} diet - Diet tag (e.g., SCD, AIP, gf-df).
 * @param {object} [options] - Optional inputs.
 * @param {number} [options.duration] - Meal plan duration (days).
 * @returns {string} A slug string.
 */
export function generateSlug(title, type, diet, options = {}) {
  const safeTitle = typeof title === 'string' ? title : '';
  const safeDiet = typeof diet === 'string' ? diet : '';

  if (type === 'recipe') {
    // Recipes:
    // - Keep diet prefix very short (first token only) because recipes often get additional SEO
    //   prefixes elsewhere (e.g. medical tags).
    // - Keep slug focused on main ingredient(s) + dish type.
    const rawDietTokens = removeStopWords(toTokens(safeDiet));
    const dietTokens = (() => {
      // Keep multi-word medical/restriction prefixes if they match high-priority patterns
      if (rawDietTokens[0] === 'low' && rawDietTokens[1]) {
        return rawDietTokens.slice(0, 2);
      }
      if (rawDietTokens[0] === 'paleo' && rawDietTokens.includes('aip')) {
        return ['paleo', 'aip'];
      }
      if (rawDietTokens.includes('gluten') || rawDietTokens.includes('dairy')) {
        return rawDietTokens; // Keep full 'gluten-free', 'dairy-free', etc.
      }
      if (rawDietTokens.includes('flare')) {
        return rawDietTokens; // Keep 'flare-friendly'
      }

      return rawDietTokens.slice(0, 1);
    })();
    const cleanedTitleTokens = removeTrailing(
      removeRecipeFillers(removeStopWords(toTokens(safeTitle))),
      RECIPE_TRAILING_WORDS
    );

    // Main ingredient chunk (usually: method + ingredient, or ingredient)
    const t0 = cleanedTitleTokens[0];
    const t1 = cleanedTitleTokens[1];
    const mainTokens = [];
    if (t0 && COOKING_METHODS.has(t0) && t1) {
      mainTokens.push(t0, t1);
    } else if (t0 && t1 && COOKING_METHODS.has(t1)) {
      mainTokens.push(...[t1, cleanedTitleTokens[2]].filter(Boolean));
    } else if (t0) {
      mainTokens.push(t0);
      if (t1 && cleanedTitleTokens.length <= 4) mainTokens.push(t1);
    }

    // Dish type chunk (pick last 2 meaningful tokens)
    // Example: "sweet potato puree" -> we want the tail tokens to keep the dish type.
    const tailTokens = cleanedTitleTokens.slice(-2);

    // Final recipe slug tokens:
    // diet token + main ingredient chunk + tail chunk
    // Then we dedupe while preserving order for stability.
    const tokens = uniqPreserveOrder([...dietTokens, ...mainTokens, ...tailTokens]).filter(Boolean);
    const slug = joinTokens(tokens);
    return slug || joinTokens(dietTokens) || 'recipe';
  }

  // Meal plans:
  // These slugs are longer and can include duration + diet + benefit terms.
  const duration = Number.isFinite(options.duration) ? Number(options.duration) : null;
  const durationToken = duration ? `${duration}-day` : null;

  const explicitDietTokens = removeStopWords(toTokens(safeDiet));
  const inferredDietTokens = explicitDietTokens.length ? [] : extractDietTokensFromText(safeTitle);
  const dietTokens = explicitDietTokens.length ? explicitDietTokens : inferredDietTokens;

  // For meal plans we also extract a small "benefit" chunk from the title to help SEO.
  // We skip words like "meal", "plan", and also avoid duplicating diet tokens.
  const titleTokens = removeStopWords(toTokens(safeTitle)).filter((t) => {
    if (MEAL_PLAN_SKIP_WORDS.has(t)) return false;
    if (t === 'day' && duration) return false;
    if (duration && t === String(duration)) return false;
    if (dietTokens.includes(t)) return false;
    if (t === 'gluten' || t === 'dairy' || t === 'free') return false;
    return true;
  });

  const benefitTokens = titleTokens.slice(0, 6);
  const baseTokens = [durationToken, ...dietTokens, ...benefitTokens, 'meal', 'plan'].filter(Boolean);
  const slug = joinTokens(baseTokens);
  return slug.endsWith('-meal-plan') ? slug : `${slug}-meal-plan`;
}
