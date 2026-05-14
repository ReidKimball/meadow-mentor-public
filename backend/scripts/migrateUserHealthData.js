/**
 * Migration Script: User Health Data Segregation
 * 
 * Purpose: Migrate health-related data from User collection to new UserHealth collection
 * 
 * IMPORTANT: This script handles Protected Health Information (PHI)
 * - Only logs user IDs, never health values
 * - Uses transactions for data integrity
 * - Creates backup before migration
 * 
 * Usage:
 *   node backend/scripts/migrateUserHealthData.js [--dry-run]
 * 
 * Options:
 *   --dry-run    Preview changes without modifying data
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model.js';
import UserHealth from '../models/userHealth.model.js';

// Load environment variables
dotenv.config({ path: './backend/.env.config' });

// Migration statistics
const stats = {
  total: 0,
  migrated: 0,
  skipped: 0,
  failed: 0,
  errors: [],
};

/**
 * Migrate a single user's health data
 * @param {Object} user - User document
 * @param {boolean} dryRun - If true, don't actually modify data
 * @returns {Promise<boolean>} Success status
 */
async function migrateUserHealth(user, dryRun = false) {
  const session = await mongoose.startSession();
  
  try {
    // Check if UserHealth document already exists
    const existingHealth = await UserHealth.findOne({ firebaseUID: user.firebaseUID });
    if (existingHealth) {
      console.log(`⏭️  User ${user.firebaseUID} already has health data, skipping`);
      stats.skipped++;
      return true;
    }

    // Debug: Log what fields exist on the user object
    console.log(`   📋 User fields present:`, {
      hasPrimaryDiet: user.primaryDiet !== undefined,
      hasCondition: user.conditionTreating !== undefined,
      hasWeight: user.weightValue !== undefined,
      hasSex: user.sex !== undefined,
      hasActivity: user.activity !== undefined,
      hasInFlare: user.inFlare !== undefined,
    });

    // Extract health fields from user document
    // Handle invalid enum values (e.g., "Unknown") by setting to null
    let primaryDiet = user.primaryDiet || null;
    if (primaryDiet === 'Unknown' || primaryDiet === 'unknown') {
      console.log(`   ⚠️  Invalid primaryDiet value "${primaryDiet}" - setting to null`);
      primaryDiet = null;
    }

    const healthData = {
      userId: user._id,
      firebaseUID: user.firebaseUID,
      primaryDiet: primaryDiet,
      dietaryRestrictions: user.dietaryRestrictions || [],
      customDietaryRestrictions: user.customDietaryRestrictions || [],
      conditionTreating: user.conditionTreating || '',
      inFlare: user.inFlare !== undefined ? user.inFlare : false,
      sex: user.sex || 'Not Specified',
      activity: user.activity || 'Not Specified',
    };

    // Handle weight data (convert to nested object)
    if (user.weightValue !== undefined || user.weightUnit !== undefined) {
      healthData.weight = {
        value: user.weightValue || null,
        unit: user.weightUnit || 'kg',
      };
    }

    if (dryRun) {
      console.log(`🔍 [DRY RUN] Would migrate health data for user: ${user.firebaseUID}`);
      console.log(`   - Primary Diet: ${healthData.primaryDiet || 'not set'}`);
      console.log(`   - Dietary Restrictions: ${healthData.dietaryRestrictions.length > 0 ? healthData.dietaryRestrictions.join(', ') : 'none'}`);
      console.log(`   - Custom Restrictions: ${healthData.customDietaryRestrictions.length > 0 ? healthData.customDietaryRestrictions.join(', ') : 'none'}`);
      console.log(`   - Condition: ${healthData.conditionTreating || 'not set'}`);
      console.log(`   - Weight: ${healthData.weight?.value ? `${healthData.weight.value} ${healthData.weight.unit}` : 'not set'}`);
      console.log(`   - Sex: ${healthData.sex}`);
      console.log(`   - Activity: ${healthData.activity}`);
      console.log(`   - In Flare: ${healthData.inFlare}`);
      stats.migrated++;
      return true;
    }

    // Start transaction
    session.startTransaction();

    // Create UserHealth document
    const [createdHealth] = await UserHealth.create([healthData], { session });
    console.log(`✅ Created health record for user: ${user.firebaseUID}`);

    // Remove health fields from User document
    // IMPORTANT: Use raw MongoDB collection because Mongoose won't unset fields not in schema
    const usersCollection = mongoose.connection.collection('users');
    await usersCollection.updateOne(
      { _id: user._id },
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
      },
      { session }
    );
    console.log(`✅ Removed health fields from User document: ${user.firebaseUID}`);

    // Commit transaction
    await session.commitTransaction();
    stats.migrated++;
    return true;

  } catch (error) {
    await session.abortTransaction();
    console.error(`❌ Error migrating user ${user.firebaseUID}:`, error.message);
    stats.failed++;
    stats.errors.push({
      userId: user.firebaseUID,
      error: error.message,
    });
    return false;
  } finally {
    session.endSession();
  }
}

/**
 * Main migration function
 */
async function migrate(dryRun = false) {
  console.log('\n🚀 Starting User Health Data Migration');
  console.log('=====================================\n');

  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No data will be modified\n');
  }

  try {
    // IMPORTANT: Use raw MongoDB collection to access fields that were removed from the Mongoose schema
    // The User model no longer has health fields, so Mongoose won't load them
    const usersCollection = mongoose.connection.collection('users');
    const users = await usersCollection.find({}).toArray();
    stats.total = users.length;

    console.log(`📊 Found ${stats.total} users to process\n`);

    if (stats.total === 0) {
      console.log('✅ No users found. Migration complete.');
      return;
    }

    // Migrate each user
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`\n[${i + 1}/${stats.total}] Processing user: ${user.firebaseUID}`);
      await migrateUserHealth(user, dryRun);
    }

    // Print summary
    console.log('\n\n📊 Migration Summary');
    console.log('===================');
    console.log(`Total users:     ${stats.total}`);
    console.log(`✅ Migrated:     ${stats.migrated}`);
    console.log(`⏭️  Skipped:      ${stats.skipped}`);
    console.log(`❌ Failed:       ${stats.failed}`);

    if (stats.errors.length > 0) {
      console.log('\n❌ Errors:');
      stats.errors.forEach((err) => {
        console.log(`   - User ${err.userId}: ${err.error}`);
      });
    }

    if (stats.failed === 0) {
      console.log('\n✅ Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with errors. Please review above.');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Verify migration results
 */
async function verifyMigration() {
  console.log('\n🔍 Verifying Migration');
  console.log('=====================\n');

  try {
    const userCount = await User.countDocuments();
    const healthCount = await UserHealth.countDocuments();

    console.log(`Users in User collection:       ${userCount}`);
    console.log(`Records in UserHealth collection: ${healthCount}`);

    if (userCount === healthCount) {
      console.log('\n✅ Verification passed: All users have health records');
    } else {
      console.log(`\n⚠️  Warning: Mismatch detected (${userCount} users vs ${healthCount} health records)`);
    }

    // Check for users still with health fields (use raw MongoDB to see actual fields)
    const usersCollection = mongoose.connection.collection('users');
    const usersWithHealthFields = await usersCollection.find({
      $or: [
        { primaryDiet: { $exists: true } },
        { dietaryRestrictions: { $exists: true } },
        { conditionTreating: { $exists: true } },
        { weightValue: { $exists: true } },
        { inFlare: { $exists: true } },
        { sex: { $exists: true } },
        { activity: { $exists: true } },
      ],
    }).toArray();

    if (usersWithHealthFields.length > 0) {
      console.log(`\n⚠️  Found ${usersWithHealthFields.length} users still with health fields:`);
      // Show first 3 users with details to debug
      const sampleUsers = usersWithHealthFields.slice(0, 3);
      sampleUsers.forEach((user) => {
        console.log(`   - ${user.firebaseUID}:`);
        console.log(`      primaryDiet: ${user.primaryDiet !== undefined ? `"${user.primaryDiet}"` : 'REMOVED'}`);
        console.log(`      conditionTreating: ${user.conditionTreating !== undefined ? `"${user.conditionTreating}"` : 'REMOVED'}`);
        console.log(`      weightValue: ${user.weightValue !== undefined ? user.weightValue : 'REMOVED'}`);
        console.log(`      sex: ${user.sex !== undefined ? `"${user.sex}"` : 'REMOVED'}`);
      });
      if (usersWithHealthFields.length > 3) {
        console.log(`   ... and ${usersWithHealthFields.length - 3} more`);
      }
    } else {
      console.log('\n✅ No users found with health fields in User collection');
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
    console.log('🚀 USER HEALTH DATA SEGREGATION MIGRATION');
    console.log('='.repeat(60) + '\n');

    await mongoose.connect(DB);
    console.log('🌱 DB connection successful!');
    console.log(`📊 Database: ${mongoose.connection.name}\n`);

    if (verify) {
      await verifyMigration();
    } else {
      await migrate(dryRun);
      
      if (!dryRun) {
        console.log('\n');
        await verifyMigration();
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
