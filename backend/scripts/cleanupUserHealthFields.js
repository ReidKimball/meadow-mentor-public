/**
 * Cleanup Script: Remove Health Fields from User Collection
 * 
 * Purpose: Remove health-related fields from User documents after migration to UserHealth
 * 
 * This script removes health fields that should have been removed during migration
 * but weren't due to Mongoose schema filtering.
 * 
 * Usage:
 *   node backend/scripts/cleanupUserHealthFields.js [--dry-run]
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './backend/.env.config' });

const stats = {
  total: 0,
  cleaned: 0,
  failed: 0,
};

/**
 * Main cleanup function
 */
async function cleanup(dryRun = false) {
  console.log('\n🧹 Starting User Health Fields Cleanup');
  console.log('======================================\n');

  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No data will be modified\n');
  }

  try {
    // Use raw MongoDB collection to access and modify all fields
    const usersCollection = mongoose.connection.collection('users');
    
    // Find all users with health fields
    const usersWithHealthFields = await usersCollection.find({
      $or: [
        { primaryDiet: { $exists: true } },
        { dietaryRestrictions: { $exists: true } },
        { customDietaryRestrictions: { $exists: true } },
        { conditionTreating: { $exists: true } },
        { weightValue: { $exists: true } },
        { weightUnit: { $exists: true } },
        { sex: { $exists: true } },
        { activity: { $exists: true } },
        { inFlare: { $exists: true } },
      ],
    }).toArray();

    stats.total = usersWithHealthFields.length;
    console.log(`📊 Found ${stats.total} users with health fields to remove\n`);

    if (stats.total === 0) {
      console.log('✅ No cleanup needed. All users are already clean.');
      return;
    }

    // Show sample of what will be removed
    if (usersWithHealthFields.length > 0) {
      console.log('📋 Sample of fields to be removed (first 3 users):');
      const samples = usersWithHealthFields.slice(0, 3);
      samples.forEach((user) => {
        console.log(`\n   User: ${user.firebaseUID}`);
        if (user.primaryDiet !== undefined) console.log(`      - primaryDiet: "${user.primaryDiet}"`);
        if (user.dietaryRestrictions !== undefined) console.log(`      - dietaryRestrictions: [${user.dietaryRestrictions.length} items]`);
        if (user.conditionTreating !== undefined) console.log(`      - conditionTreating: "${user.conditionTreating}"`);
        if (user.weightValue !== undefined) console.log(`      - weightValue: ${user.weightValue}`);
        if (user.sex !== undefined) console.log(`      - sex: "${user.sex}"`);
        if (user.activity !== undefined) console.log(`      - activity: "${user.activity}"`);
        if (user.inFlare !== undefined) console.log(`      - inFlare: ${user.inFlare}`);
      });
      console.log('');
    }

    if (dryRun) {
      console.log(`\n✅ [DRY RUN] Would remove health fields from ${stats.total} users`);
      return;
    }

    // Perform bulk cleanup
    console.log('🔄 Removing health fields from User documents...\n');
    
    const result = await usersCollection.updateMany(
      {
        $or: [
          { primaryDiet: { $exists: true } },
          { dietaryRestrictions: { $exists: true } },
          { customDietaryRestrictions: { $exists: true } },
          { conditionTreating: { $exists: true } },
          { weightValue: { $exists: true } },
          { weightUnit: { $exists: true } },
          { sex: { $exists: true } },
          { activity: { $exists: true } },
          { inFlare: { $exists: true } },
        ],
      },
      {
        $unset: {
          primaryDiet: '',
          dietaryRestrictions: '',
          customDietaryRestrictions: '',
          conditionTreating: '',
          weightValue: '',
          weightUnit: '',
          sex: '',
          activity: '',
          inFlare: '',
        },
      }
    );

    stats.cleaned = result.modifiedCount;

    console.log('📊 Cleanup Summary');
    console.log('==================');
    console.log(`Total users with health fields: ${stats.total}`);
    console.log(`✅ Users cleaned:                ${stats.cleaned}`);

    if (stats.cleaned === stats.total) {
      console.log('\n✅ Cleanup completed successfully!');
    } else {
      console.log(`\n⚠️  Warning: Expected to clean ${stats.total} users but only cleaned ${stats.cleaned}`);
    }

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    throw error;
  }
}

/**
 * Verify cleanup results
 */
async function verifyCleanup() {
  console.log('\n🔍 Verifying Cleanup');
  console.log('===================\n');

  try {
    const usersCollection = mongoose.connection.collection('users');
    
    const usersWithHealthFields = await usersCollection.find({
      $or: [
        { primaryDiet: { $exists: true } },
        { dietaryRestrictions: { $exists: true } },
        { customDietaryRestrictions: { $exists: true } },
        { conditionTreating: { $exists: true } },
        { weightValue: { $exists: true } },
        { weightUnit: { $exists: true } },
        { sex: { $exists: true } },
        { activity: { $exists: true } },
        { inFlare: { $exists: true } },
      ],
    }).toArray();

    if (usersWithHealthFields.length === 0) {
      console.log('✅ Verification passed: No users have health fields in User collection');
    } else {
      console.log(`⚠️  Found ${usersWithHealthFields.length} users still with health fields:`);
      usersWithHealthFields.slice(0, 5).forEach((user) => {
        console.log(`   - ${user.firebaseUID}`);
      });
      if (usersWithHealthFields.length > 5) {
        console.log(`   ... and ${usersWithHealthFields.length - 5} more`);
      }
    }

  } catch (error) {
    console.error('❌ Verification error:', error);
  }
}

/**
 * Main execution
 */
async function main() {
  const DB = process.env.DATABASE;
  if (!DB) {
    console.error('❌ DATABASE environment variable not found. Make sure it is set in .env.config');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const verify = args.includes('--verify');

  try {
    console.log('\n' + '='.repeat(60));
    console.log('🧹 USER HEALTH FIELDS CLEANUP');
    console.log('='.repeat(60) + '\n');

    await mongoose.connect(DB);
    console.log('🌱 DB connection successful!');
    console.log(`📊 Database: ${mongoose.connection.name}\n`);

    if (verify) {
      await verifyCleanup();
    } else {
      await cleanup(dryRun);
      
      if (!dryRun) {
        console.log('\n');
        await verifyCleanup();
      }
    }

    console.log('\n✅ Script completed');

  } catch (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 DB connection closed.');
  }
}

// Run the script
main();
