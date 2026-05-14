/**
 * @file complianceUtils.js
 * @description Utility functions for checking food compliance against therapeutic diets.
 * @version 2.0.0
 * @date 2025-09-14
 * @author Cascade
 */

import TherapeuticDietFood from "../models/therapeuticDietFood.model.js";
import { normalizeString } from "./stringUtils.js";
import lemmatize from 'wink-lemmatizer';

const SCORE_CONFIG = {
  EXACT_MATCH: 100,
  FULL_WORD_MATCH: 80,
  PARTIAL_WORD_MATCH_BASE: 30,
  SYNONYM_MATCH_IN_NOTE: 20,
  NO_MATCH: 0,
};

/**
 * Calculates a match score between a user's ingredient and a database food record.
 * @param {string} normalizedInput - The normalized user ingredient.
 * @param {object} foodRecord - The food record from the database.
 * @returns {number} The calculated score.
 */
const calculateScore = (normalizedInput, foodRecord) => {
  const normalizedDbName = foodRecord.normalized_food_name;
  const normalizedNote = foodRecord.note ? normalizeString(foodRecord.note) : "";

  // 1. Exact Match - Highest priority
  if (normalizedInput === normalizedDbName) {
    return SCORE_CONFIG.EXACT_MATCH;
  }

  // 2. Word-based matching
  const inputWords = new Set(normalizedInput.split(' ').map(w => lemmatize.noun(w)));
  const dbWords = new Set(normalizedDbName.split(' ').map(w => lemmatize.noun(w)));
  
  const intersection = new Set([...inputWords].filter(word => dbWords.has(word)));

  // 3. Full Word Match - All input words are found in the DB name
  if (intersection.size > 0 && intersection.size === inputWords.size && intersection.size === dbWords.size) {
    return SCORE_CONFIG.FULL_WORD_MATCH;
  }

  // 4. Partial Word Match - Some, but not all, words match
  if (intersection.size > 0) {
    const matchPercentage = intersection.size / dbWords.size;
    return SCORE_CONFIG.PARTIAL_WORD_MATCH_BASE + Math.round(20 * matchPercentage);
  }

  // 5. Synonym Match in Note - Lowest priority
  if (normalizedNote.includes(normalizedInput)) {
    return SCORE_CONFIG.SYNONYM_MATCH_IN_NOTE;
  }

  return SCORE_CONFIG.NO_MATCH;
};

/**
 * @function checkIngredientCompliance
 * @description Checks a list of ingredients against a specified therapeutic diet using a weighted scoring algorithm.
 * @param {string[]} ingredients - An array of ingredient names to check.
 * @param {string} diet - The code of the therapeutic diet (e.g., 'SCD').
 * @returns {Promise<object>} An object containing detailed results and compliance counts.
 */
export const checkIngredientCompliance = async (ingredients, diet) => {
  if (!ingredients || !Array.isArray(ingredients) || !diet) {
    const error = new Error("Missing required fields: ingredients (array) and diet are required.");
    error.statusCode = 400;
    throw error;
  }

  if (ingredients.length === 0) {
    return { results: [], score: null, compliantCount: 0, nonCompliantCount: 0, notFoundCount: 0 };
  }

  console.log(`[complianceUtils.js v2] Checking compliance for diet: ${diet}, ingredients: ${ingredients.join(", ")}`);

  const allFoodRecordsForDiet = await TherapeuticDietFood.find({ diet_code: diet });

  // --- PERFORMANCE OPTIMIZATION --- //
  // 1. Build an inverted index for fast candidate lookup.
  // The key is a lemmatized word, the value is an array of records containing that word.
  const invertedIndex = new Map();
  for (const record of allFoodRecordsForDiet) {
    const dbWords = new Set(record.normalized_food_name.split(' ').map(w => lemmatize.noun(w)));
    for (const word of dbWords) {
      if (!invertedIndex.has(word)) {
        invertedIndex.set(word, []);
      }
      invertedIndex.get(word).push(record);
    }
  }

  const results = ingredients.map((originalIngredient) => {
    const normalizedInput = normalizeString(originalIngredient);
    let bestMatch = { score: SCORE_CONFIG.NO_MATCH, record: null };

    // 2. Get a smaller list of candidate records from the inverted index.
    const inputWords = new Set(normalizedInput.split(' ').map(w => lemmatize.noun(w)));
    const candidateRecords = new Map(); // Use Map to store unique records by ID
    for (const word of inputWords) {
      if (invertedIndex.has(word)) {
        invertedIndex.get(word).forEach(record => {
          candidateRecords.set(record._id.toString(), record);
        });
      }
    }

    // Also include records where the note might contain the ingredient name (for synonym matching)
    allFoodRecordsForDiet.forEach(record => {
      if (record.note && normalizeString(record.note).includes(normalizedInput)) {
        candidateRecords.set(record._id.toString(), record);
      }
    });

    // 3. Score only the candidate records.
    for (const record of candidateRecords.values()) {
      const score = calculateScore(normalizedInput, record);
      if (score > bestMatch.score) {
        bestMatch = { score, record };
      }
    }

    if (bestMatch.record) {
      console.log(`[complianceUtils.js v2] Best match for "${originalIngredient}" is "${bestMatch.record.food_name}" with score ${bestMatch.score}.`);
      return {
        ingredient: originalIngredient,
        normalized_ingredient: bestMatch.record.food_name,
        found: true,
        allowed: bestMatch.record.allowed,
        note: bestMatch.record.note,
      };
    } else {
      console.log(`[complianceUtils.js v2] Ingredient "${originalIngredient}" not found for diet "${diet}".`);
      return {
        ingredient: originalIngredient,
        normalized_ingredient: null,
        found: false,
        allowed: null,
        note: "Ingredient not found in database for this diet.",
      };
    }
  });

  // Calculate counts and score
  let compliantCount = 0;
  let nonCompliantCount = 0;
  let notFoundCount = 0;

  results.forEach((result) => {
    if (!result.found) {
      notFoundCount++;
    } else if (result.allowed === true) {
      compliantCount++;
    } else if (result.allowed === false) {
      nonCompliantCount++;
    }
  });

  const totalChecked = compliantCount + nonCompliantCount;
  const score = totalChecked > 0 ? Math.round((compliantCount / totalChecked) * 100) : null;

  console.log(`[complianceUtils.js v2] Compliance results: C=${compliantCount}, NC=${nonCompliantCount}, NF=${notFoundCount}, Score=${score}`);

  return {
    results,
    score,
    compliantCount,
    nonCompliantCount,
    notFoundCount,
  };
};
