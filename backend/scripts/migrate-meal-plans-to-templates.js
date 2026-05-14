/**
 * Migration Script: Meal Plans to Template-Based Model
 * 
 * This script migrates the meal planner from date-locked plans to template-based plans.
 * 
 * Changes:
 * 1. Renames 'mealplans' collection to 'meal-plans'
 * 2. Transforms existing plans to template format (dayNumber instead of dates)
 * 3. Creates CalendarAssignment docs for active plans
 * 4. Updates plan schema (removes startDate/endDate/isActive, adds duration/timesUsed/lastUsedDate)
 * 
 * Run with: node backend/migrations/migrate-meal-plans-to-templates.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './backend/.env.config' });

// Step 1: Rename collection
async function renameCollection() {
  console.log('\n📦 Step 1: Checking/Renaming collection...');
  
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const hasOldCollection = collections.some(c => c.name === 'mealplans');
    const hasNewCollection = collections.some(c => c.name === 'meal-plans');
    
    console.log(`   Old collection (mealplans): ${hasOldCollection ? 'EXISTS' : 'NOT FOUND'}`);
    console.log(`   New collection (meal-plans): ${hasNewCollection ? 'EXISTS' : 'NOT FOUND'}`);
    
    // Case 1: Already migrated
    if (hasNewCollection && !hasOldCollection) {
      console.log('✅ Collection already renamed to meal-plans');
      return true;
    }
    
    // Case 2: Nothing to migrate
    if (!hasOldCollection && !hasNewCollection) {
      console.log('⚠️  No meal plans collections found - nothing to migrate');
      return false;
    }
    
    // Case 3: Both exist - need to merge or handle conflict
    if (hasOldCollection && hasNewCollection) {
      console.log('⚠️  Both mealplans and meal-plans collections exist!');
      
      const oldCount = await mongoose.connection.db.collection('mealplans').countDocuments();
      const newCount = await mongoose.connection.db.collection('meal-plans').countDocuments();
      
      console.log(`   mealplans: ${oldCount} documents`);
      console.log(`   meal-plans: ${newCount} documents`);
      
      // If old collection is empty, drop it
      if (oldCount === 0) {
        console.log('   Old collection is empty, dropping it...');
        await mongoose.connection.db.collection('mealplans').drop();
        console.log('✅ Dropped empty mealplans collection');
        return true;
      }
      
      // If new collection is empty, drop it and rename old one
      if (newCount === 0) {
        console.log('   New collection is empty, dropping it and renaming old collection...');
        await mongoose.connection.db.collection('meal-plans').drop();
        console.log('✅ Dropped empty meal-plans collection');
        
        await mongoose.connection.db.renameCollection('mealplans', 'meal-plans');
        console.log('✅ Successfully renamed mealplans to meal-plans');
        
        const count = await mongoose.connection.db.collection('meal-plans').countDocuments();
        console.log(`✅ Verified: ${count} documents in meal-plans collection`);
        return true;
      }
      
      // Both have data - cannot proceed automatically
      console.log('❌ Cannot proceed: Both collections have data.');
      console.log('   Please manually resolve this conflict:');
      console.log('   1. Backup both collections');
      console.log('   2. Decide which to keep');
      console.log('   3. Drop the other collection');
      return false;
    }
    
    // Case 4: Only old collection exists - rename it
    if (hasOldCollection && !hasNewCollection) {
      console.log('Renaming mealplans to meal-plans...');
      await mongoose.connection.db.renameCollection('mealplans', 'meal-plans');
      console.log('✅ Successfully renamed mealplans to meal-plans');
      
      // Verify
      const count = await mongoose.connection.db.collection('meal-plans').countDocuments();
      console.log(`✅ Verified: ${count} documents in meal-plans collection`);
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error in renameCollection:', error.message);
    throw error;
  }
}

// Step 2: Transform plans to template format
async function transformPlansToTemplates() {
  console.log('\n🔄 Step 2: Transforming plans to template format...');
  
  try {
    const mealPlansCollection = mongoose.connection.db.collection('meal-plans');
    const plans = await mealPlansCollection.find({}).toArray();
    
    console.log(`Found ${plans.length} plans to transform`);
    
    let transformedCount = 0;
    
    for (const plan of plans) {
      console.log(`\nTransforming plan: ${plan._id}`);
      console.log(`  Name: ${plan.planName}`);
      console.log(`  Original dates: ${plan.startDate} to ${plan.endDate}`);
      
      // Calculate duration
      const duration = plan.days?.length || 1;
      console.log(`  Duration: ${duration} days`);
      
      // Transform days: date → dayNumber
      const transformedDays = plan.days?.map((day, index) => {
        return {
          dayNumber: index + 1,  // Day 1, Day 2, etc.
          meals: day.meals || {}
        };
      }) || [];
      
      // Prepare update
      const update = {
        $set: {
          duration: duration,
          days: transformedDays,
          timesUsed: plan.isActive ? 1 : 0,
          lastUsedDate: plan.isActive ? plan.startDate : null,
        },
        $unset: {
          startDate: '',
          endDate: '',
          isActive: '',
        }
      };
      
      // Update plan
      await mealPlansCollection.updateOne(
        { _id: plan._id },
        update
      );
      
      transformedCount++;
      console.log(`  ✅ Transformed to template (${transformedDays.length} days)`);
    }
    
    console.log(`\n✅ Transformed ${transformedCount} plans to template format`);
    return plans;
  } catch (error) {
    console.error('❌ Error transforming plans:', error);
    throw error;
  }
}

// Step 3: Create CalendarAssignments for active plans
async function createCalendarAssignments(originalPlans) {
  console.log('\n📅 Step 3: Creating CalendarAssignments for active plans...');
  
  try {
    const assignmentsCollection = mongoose.connection.db.collection('calendar-assignments');
    
    // Check if collection exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    const hasAssignmentsCollection = collections.some(c => c.name === 'calendar-assignments');
    
    if (!hasAssignmentsCollection) {
      console.log('Creating calendar-assignments collection...');
      await mongoose.connection.db.createCollection('calendar-assignments');
    }
    
    const activePlans = originalPlans.filter(p => p.isActive === true);
    console.log(`Found ${activePlans.length} active plans to create assignments for`);
    
    let createdCount = 0;
    
    for (const plan of activePlans) {
      console.log(`\nCreating assignment for plan: ${plan._id}`);
      console.log(`  Name: ${plan.planName}`);
      console.log(`  Date range: ${plan.startDate} to ${plan.endDate}`);
      
      // Generate day mappings
      const dayMappings = [];
      const startDate = new Date(plan.startDate);
      const duration = plan.days?.length || 1;
      
      for (let i = 0; i < duration; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        
        dayMappings.push({
          date: date,
          planDayNumber: i + 1
        });
      }
      
      // Create assignment
      const assignment = {
        user: plan.user,
        mealPlanId: plan._id,
        startDate: new Date(plan.startDate),
        endDate: new Date(plan.endDate),
        isActive: true,
        dayMappings: dayMappings,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await assignmentsCollection.insertOne(assignment);
      createdCount++;
      console.log(`  ✅ Created assignment with ${dayMappings.length} day mappings`);
    }
    
    console.log(`\n✅ Created ${createdCount} calendar assignments`);
  } catch (error) {
    console.error('❌ Error creating calendar assignments:', error);
    throw error;
  }
}

// Step 4: Verify migration
async function verifyMigration() {
  console.log('\n🔍 Step 4: Verifying migration...');
  
  try {
    const mealPlansCollection = mongoose.connection.db.collection('meal-plans');
    const assignmentsCollection = mongoose.connection.db.collection('calendar-assignments');
    
    // Check meal-plans
    const totalPlans = await mealPlansCollection.countDocuments();
    const plansWithDuration = await mealPlansCollection.countDocuments({ duration: { $exists: true } });
    const plansWithOldFields = await mealPlansCollection.countDocuments({ 
      $or: [
        { startDate: { $exists: true } },
        { endDate: { $exists: true } },
        { isActive: { $exists: true } }
      ]
    });
    
    console.log('\nMeal Plans Collection:');
    console.log(`  Total plans: ${totalPlans}`);
    console.log(`  Plans with duration field: ${plansWithDuration}`);
    console.log(`  Plans with old fields (should be 0): ${plansWithOldFields}`);
    
    // Check calendar-assignments
    const totalAssignments = await assignmentsCollection.countDocuments();
    const activeAssignments = await assignmentsCollection.countDocuments({ isActive: true });
    
    console.log('\nCalendar Assignments Collection:');
    console.log(`  Total assignments: ${totalAssignments}`);
    console.log(`  Active assignments: ${activeAssignments}`);
    
    // Sample check
    const samplePlan = await mealPlansCollection.findOne({});
    if (samplePlan) {
      console.log('\nSample Plan Structure:');
      console.log(`  Has duration: ${!!samplePlan.duration}`);
      console.log(`  Has dayNumber in days: ${samplePlan.days?.[0]?.dayNumber ? 'Yes' : 'No'}`);
      console.log(`  Has old date field: ${samplePlan.days?.[0]?.date ? 'Yes (BAD)' : 'No (GOOD)'}`);
    }
    
    // Validation
    const isValid = plansWithOldFields === 0 && plansWithDuration === totalPlans;
    
    if (isValid) {
      console.log('\n✅ Migration verification PASSED');
    } else {
      console.log('\n⚠️  Migration verification found issues');
    }
    
    return isValid;
  } catch (error) {
    console.error('❌ Error verifying migration:', error);
    throw error;
  }
}

// Main migration function
async function runMigration() {
  // Step 1: Rename collection
  const collectionExists = await renameCollection();
  
  if (!collectionExists) {
    console.log('\n⚠️  No data to migrate. Exiting.');
    return;
  }
  
  // Step 2: Transform plans
  const originalPlans = await transformPlansToTemplates();
  
  // Step 3: Create assignments
  await createCalendarAssignments(originalPlans);
  
  // Step 4: Verify
  const isValid = await verifyMigration();
  
  console.log('\n' + '='.repeat(60));
  if (isValid) {
    console.log('✅ Migration completed successfully!');
  } else {
    console.log('⚠️  Migration completed with warnings. Please review.');
  }
}

// Main execution
async function main() {
  const DB = process.env.DATABASE;
  if (!DB) {
    console.error('❌ DATABASE environment variable not found. Make sure it is set in .env.config');
    process.exit(1);
  }

  try {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 MEAL PLANS MIGRATION TO TEMPLATE-BASED MODEL');
    console.log('='.repeat(60) + '\n');

    await mongoose.connect(DB);
    console.log('🌱 DB connection successful!\n');

    await runMigration();

    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 DB connection closed.');
  }
}

// Run the migration
main();
