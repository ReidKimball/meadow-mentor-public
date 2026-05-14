/**
 * @file complianceUtils.test.js
 * @description Standalone test script for complianceUtils.js to diagnose database query issues.
 * To run: `node backend/utils/complianceUtils.test.js`
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { checkIngredientCompliance } from './complianceUtils.js';

// --- Setup Environment ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env.config') });

// --- Test Configuration ---
const TEST_DIET = 'SCD';
const TEST_INGREDIENT = 'beef';

// --- Main Test Function ---
const runTest = async () => {
  const DB = process.env.DATABASE;
  if (!DB) {
    console.error('🔴 ERROR: DATABASE is not defined in your .env.config file.');
    return;
  }

  console.log('--- Compliance Util Test ---');
  console.log('Connecting to MongoDB...');

  try {
    await mongoose.connect(DB);
    console.log('✅ MongoDB connected successfully.');

    console.log(`
🔬 Running test with:`);
    console.log(`   - Diet: "${TEST_DIET}"`);
    console.log(`   - Ingredient: "${TEST_INGREDIENT}"`);

    const result = await checkIngredientCompliance([TEST_INGREDIENT], TEST_DIET);

    console.log(`
📊 Test Result:`);
    console.log(JSON.stringify(result, null, 2));

    if (result.notFoundCount > 0) {
        console.error(`
❌ FAILURE: The ingredient "${TEST_INGREDIENT}" was NOT FOUND for the "${TEST_DIET}" diet.`);
        console.log('   This confirms the query is not matching records in the database.');
        console.log('   Next steps: Verify that a document with { diet: "SCD", normalized_food_name: "beef" } exists in your `therapeutic-diet-foods` collection.');
    } else {
        console.log(`
✅ SUCCESS: The ingredient "${TEST_INGREDIENT}" was found for the "${TEST_DIET}" diet.`);
        console.log('   This indicates the core lookup logic is working correctly.');
    }

  } catch (error) {
    console.error('🔴 An error occurred during the test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB disconnected.');
    console.log('--- Test Complete ---');
  }
};

runTest();
