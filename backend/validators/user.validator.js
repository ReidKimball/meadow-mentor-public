/**
 * @file user.validator.js
 * @description Validation rules and helpers for user-related input (registration, updates).
 * This module is used by the input validation middleware to enforce server-side rules
 * before any data reaches the persistence layer.
 */

import validator from "validator";
import {
  containsUrl,
  containsHtml,
  containsEmail,
} from "../utils/sanitization.utils.js";

/**
 * Reusable validation rules for name fields.
 */
export const nameValidationRules = {
  minLength: 1,
  maxLength: 50,
  pattern: /^[a-zA-Z\s\-']+$/,
  errorMessages: {
    required: "Name is required",
    minLength: "Name must be at least 1 character",
    maxLength: "Name must not exceed 50 characters",
    pattern:
      "Name can only contain letters, spaces, hyphens, and apostrophes",
    url: "Name cannot contain URLs",
    html: "Name cannot contain HTML or scripts",
    email: "Name cannot contain email addresses",
  },
};

/**
 * Validate a name field.
 *
 * @param {string} name - Raw name value.
 * @param {string} [fieldName="Name"] - Human-friendly field label.
 * @param {boolean} [required=true] - Whether the field is required.
 * @returns {string[]} Array of validation error messages (empty if valid).
 */
export const validateName = (name, fieldName = "Name", required = true) => {
  const errors = [];

  // Required check
  if (required && (!name || name.trim().length === 0)) {
    errors.push(`${fieldName} is required`);
    return errors;
  }

  // Optional and empty → valid, no further checks
  if (!required && (!name || name.trim().length === 0)) {
    return errors;
  }

  // Length checks
  if (name.length < nameValidationRules.minLength) {
    errors.push(nameValidationRules.errorMessages.minLength);
  }
  if (name.length > nameValidationRules.maxLength) {
    errors.push(nameValidationRules.errorMessages.maxLength);
  }

  // Malicious content checks
  if (containsUrl(name)) {
    errors.push(nameValidationRules.errorMessages.url);
  }
  if (containsHtml(name)) {
    errors.push(nameValidationRules.errorMessages.html);
  }
  if (containsEmail(name)) {
    errors.push(nameValidationRules.errorMessages.email);
  }

  // Character set pattern
  if (!nameValidationRules.pattern.test(name)) {
    errors.push(nameValidationRules.errorMessages.pattern);
  }

  return errors;
};

/**
 * Validate email field.
 *
 * @param {string} email - Raw email value.
 * @returns {string[]} Array of validation error messages (empty if valid).
 */
export const validateEmail = (email) => {
  const errors = [];

  const value = typeof email === "string" ? email.trim() : "";

  if (!value) {
    errors.push("Email is required");
    return errors;
  }

  if (!validator.isEmail(value)) {
    errors.push("Invalid email format");
  }

  if (value.length > 254) {
    errors.push("Email must not exceed 254 characters");
  }

  return errors;
};

/**
 * Validation schema for user registration.
 *
 * The structure is consumed by the generic createValidator factory in
 * `inputValidation.middleware.js`.
 */
export const userRegistrationSchema = {
  firebaseUID: {
    required: true,
    type: "string",
    minLength: 1,
    maxLength: 128,
  },
  firstName: {
    required: true,
    validator: (value) => validateName(value, "First name", true),
  },
  lastName: {
    required: false,
    validator: (value) => validateName(value, "Last name", false),
  },
  email: {
    required: true,
    validator: validateEmail,
  },
};

/**
 * Validation schema for user updates (all fields optional).
 */
export const userUpdateSchema = {
  firstName: {
    required: false,
    validator: (value) => (value ? validateName(value, "First name", true) : []),
  },
  lastName: {
    required: false,
    validator: (value) => (value ? validateName(value, "Last name", false) : []),
  },
  email: {
    required: false,
    validator: (value) => (value ? validateEmail(value) : []),
  },
  preferences: {
    required: false,
    validator: (value) => {
      const errors = [];

      if (value === undefined || value === null) return errors;
      if (typeof value !== "object" || Array.isArray(value)) {
        errors.push("preferences must be an object");
        return errors;
      }

      if (
        Object.prototype.hasOwnProperty.call(value, "showCreditSpendConfirmations") &&
        typeof value.showCreditSpendConfirmations !== "boolean"
      ) {
        errors.push("preferences.showCreditSpendConfirmations must be a boolean");
      }

      return errors;
    },
  },
};
