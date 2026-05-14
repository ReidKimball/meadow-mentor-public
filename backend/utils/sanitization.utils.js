/**
 * @file sanitization.utils.js
 * @description Detection and normalization utilities for user input.
 * These helpers are used by validation middleware to detect malicious patterns
 * (URLs, HTML, emails) and to normalize benign input (names, emails) before
 * persisting to MongoDB.
 */

import validator from "validator"; // General-purpose validation utilities (reserved for future use)

// ============================================================
// DETECTION FUNCTIONS (Used for REJECTION in validation layer)
// ============================================================

/**
 * Detect if input contains URLs.
 * Used by validation to REJECT malicious input.
 *
 * @param {string} input - Raw user input.
 * @returns {boolean} True if a URL-like pattern is detected.
 */
export const containsUrl = (input) => {
  if (!input || typeof input !== "string") return false;
  const urlPattern = /(?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b/gi;
  return urlPattern.test(input);
};

/**
 * Detect if input contains HTML/script tags.
 * Used by validation to REJECT malicious input.
 *
 * @param {string} input - Raw user input.
 * @returns {boolean} True if HTML-like content is detected.
 */
export const containsHtml = (input) => {
  if (!input || typeof input !== "string") return false;
  const htmlPattern = /<[^>]*>/g;
  return htmlPattern.test(input);
};

/**
 * Detect if input contains an email address (for name fields).
 * Used by validation to REJECT suspicious input in names.
 *
 * @param {string} input - Raw user input.
 * @returns {boolean} True if an email pattern is detected.
 */
export const containsEmail = (input) => {
  if (!input || typeof input !== "string") return false;
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  return emailPattern.test(input);
};

/**
 * Detect a set of malicious/suspicious patterns in a string.
 *
 * @param {string} input - Raw user input.
 * @returns {string[]} An array of detected pattern identifiers.
 */
export const detectMaliciousPatterns = (input) => {
  if (!input || typeof input !== "string") return [];

  const patterns = [];

  if (containsUrl(input)) patterns.push("URL");
  if (containsHtml(input)) patterns.push("HTML");
  if (containsEmail(input)) patterns.push("EMAIL");
  if (/javascript:/i.test(input)) patterns.push("JAVASCRIPT_PROTOCOL");
  if (/on\w+\s*=\s*/i.test(input)) patterns.push("EVENT_HANDLER");
  if (/(.)\1{10,}/.test(input)) patterns.push("REPEATED_CHARS");

  return patterns;
};

// ============================================================
// NORMALIZATION FUNCTIONS (Used for BENIGN input only)
// ============================================================

/**
 * Normalize name fields (firstName, lastName).
 *
 * IMPORTANT:
 * - Only call this AFTER validation has confirmed the input is benign.
 * - This function does not attempt to remove malicious content.
 *
 * @param {string} input - Raw user-provided name.
 * @returns {string} Normalized name value.
 */
export const sanitizeName = (input) => {
  if (!input || typeof input !== "string") return "";

  let normalized = input;

  // Remove zero-width spaces and other invisible characters.
  normalized = normalized.replace(/[\u200B-\u200D\uFEFF]/g, "");

  // Collapse multiple spaces into a single space.
  normalized = normalized.replace(/\s+/g, " ");

  // Trim leading/trailing whitespace.
  normalized = normalized.trim();

  // Limit length (defense-in-depth).
  normalized = normalized.substring(0, 50);

  return normalized;
};

/**
 * Normalize email addresses.
 *
 * IMPORTANT:
 * - Only call this AFTER validation has confirmed the email is valid.
 *
 * @param {string} input - Raw email address.
 * @returns {string} Normalized email address.
 */
export const sanitizeEmail = (input) => {
  if (!input || typeof input !== "string") return "";

  let normalized = input.trim().toLowerCase();

  // Limit length per RFC 5321 (defense-in-depth).
  normalized = normalized.substring(0, 254);

  return normalized;
};

// ============================================================
// UTILITY FUNCTIONS (Defense-in-depth only)
// ============================================================

/**
 * Strip HTML tags with a simple regex.
 *
 * NOTE: This is a **defense-in-depth** helper only and should not be relied on
 * as a primary XSS mitigation. Phase 1 validation already REJECTS malicious
 * input; this function is here for one-off edge cases.
 *
 * @param {string} input - Raw input that may contain HTML.
 * @returns {string} String with HTML tags removed.
 */
export const stripHtml = (input) => {
  if (!input || typeof input !== "string") return input;
  return input.replace(/<[^>]*>/g, "");
};
