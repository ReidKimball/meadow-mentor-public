// backend/scripts/migrateToCredits.js
/**
 * Migration Script: Transition from Subscription Model to Credits System
 * 
 * This script migrates existing subscribers to the new credits system by:
 * 1. Granting transition credits based on their subscription plan
 * 2. Recording the migration in credit transactions
 * 3. Sending notifications about the transition
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/user.model.js';
import CreditTransaction from '../models/creditTransaction.model.js';
import { grantBonusCredits } from '../services/credit.service.js';
// import { sendEmail } from '../services/email.service.js';

dotenv.config({ path: './backend/.env.config' });

// Configuration for transition credits
const TRANSITION_CREDITS = {
  'early adopter': 50,  // Premium subscribers get 50 credits
  'premium': 50,       // Premium subscribers get 50 credits
  'basic': 10,         // Basic subscribers (if any) get 10 credits
  'default': 10        // Default for unexpected plans
};

// Email template for migration notification
const MIGRATION_EMAIL_TEMPLATE = {
  subject: 'Important Update: Meadow Mentor is Moving to a New Credit System!',
  html: `
    <h2>Big Changes Are Coming!</h2>
    
    <p>Hi {{firstName}},</p>
    
    <p>We're excited to announce that Meadow Mentor is transitioning to a more flexible credit-based system! 
    This means you'll have more control over when and how you use our AI features.</p>
    
    <h3>What's Changing?</h3>
    <ul>
      <li>No more daily limits - credits never expire!</li>
      <li>Pay only for what you use</li>
      <li>More transparent pricing</li>
    </ul>
    
    <h3>Your Transition Bonus</h3>
    <p>As a thank you for being an early subscriber, we've granted you <strong>{{bonusCredits}}</strong> 
    free credits to get started with the new system!</p>
    
    <h3>How It Works</h3>
    <ul>
      <li><strong>1 credit</strong> - Generate a recipe</li>
      <li><strong>5 credits</strong> - Create a meal plan</li>
      <li><strong>2 credits</strong> - Generate a recipe photo</li>
    </ul>
    
    <p>Your current subscription will remain active until its natural expiry date. 
    After that, you can purchase additional credit packages as needed.</p>
    
    <p>Questions? Check out our <a href="{{faqUrl}}">FAQ</a> or reply to this email.</p>
    
    <p>Best regards,<br>The Meadow Mentor Team</p>
  `
};

/**
 * Main migration function
 */
export const migrateToCredits = async (options = {}) => {
  const { 
    dryRun = false, 
    sendNotifications = false,
    batchSize = 100 
  } = options;

  console.log('🚀 Starting migration to credits system...');
  console.log(`Options: dryRun=${dryRun}, sendNotifications=${sendNotifications}, batchSize=${batchSize}`);

  // Check database connection
  if (!process.env.DATABASE) {
    throw new Error('Missing required env var: DATABASE');
  }

  // Connect to database if not already connected
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.DATABASE);
    console.log('Connected to database');
  }

  const connection = await mongoose.connection;
  const session = await connection.startSession();

  try {
    // Find all active subscribers
    const activeSubscribers = await User.find({
      'paymentStatus.status': { $in: ['active', 'trial'] }
    }).session(session);

    console.log(`Found ${activeSubscribers.length} active subscribers to migrate`);

    if (dryRun) {
      console.log('\n🔍 DRY RUN RESULTS:');
      console.log('========================');
      
      const summary = {};
      const results = [];
      
      for (const user of activeSubscribers) {
        const plan = user.paymentStatus?.plan || 'basic';
        const credits = TRANSITION_CREDITS[plan] || TRANSITION_CREDITS.default;
        
        // Track summary by plan
        summary[plan] = (summary[plan] || { count: 0, credits: 0 });
        summary[plan].count++;
        summary[plan].credits += credits;
        
        results.push({
          email: user.email,
          plan: plan,
          status: user.paymentStatus?.status,
          creditsToGrant: credits
        });
      }
      
      // Print detailed results
      console.log('\n📋 Detailed Migration Plan:');
      console.log('----------------------------');
      results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.email}`);
        console.log(`   Plan: ${result.plan} (${result.status})`);
        console.log(`   Credits to grant: ${result.creditsToGrant}`);
      });
      
      // Print summary by plan
      console.log('\n📊 Summary by Subscription Plan:');
      console.log('----------------------------------');
      let totalUsers = 0;
      let totalCredits = 0;
      
      for (const [plan, data] of Object.entries(summary)) {
        console.log(`${plan.toUpperCase()}: ${data.count} users × ${data.credits/data.count} credits each = ${data.credits} total credits`);
        totalUsers += data.count;
        totalCredits += data.credits;
      }
      
      // Print overall summary
      console.log('\n🎯 Overall Summary:');
      console.log('--------------------');
      console.log(`Total users to migrate: ${totalUsers}`);
      console.log(`Total credits to grant: ${totalCredits}`);
      console.log(`Average credits per user: ${(totalCredits / totalUsers).toFixed(2)}`);
      
      return {
        success: true,
        migrated: 0,
        totalCredits: 0,
        dryRun: true,
        summary: {
          totalUsers,
          totalCredits,
          planBreakdown: summary
        }
      };
    }

    let migratedCount = 0;
    let totalCreditsGranted = 0;

    // Process in batches
    for (let i = 0; i < activeSubscribers.length; i += batchSize) {
      const batch = activeSubscribers.slice(i, i + batchSize);
      
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(activeSubscribers.length/batchSize)}`);

      for (const user of batch) {
        try {
          const plan = user.paymentStatus?.plan || 'basic';
          const creditsToGrant = TRANSITION_CREDITS[plan] || TRANSITION_CREDITS.default;

          // Grant transition credits
          const newBalance = await grantBonusCredits(
            user._id,
            creditsToGrant,
            `Transition from ${plan} subscription`
          );

          // Record migration metadata
          await CreditTransaction.create([{
            user: user._id,
            amount: creditsToGrant,
            actionType: 'BONUS',
            description: `Migration bonus: ${creditsToGrant} credits for ${plan} subscription transition`,
            metadata: {
              migrationDate: new Date().toISOString(),
              previousPlan: plan,
              previousStatus: user.paymentStatus?.status,
              migrationVersion: '1.0'
            },
            balanceAfter: newBalance
          }], { session });

          migratedCount++;
          totalCreditsGranted += creditsToGrant;

          console.log(`✅ Granted ${creditsToGrant} credits to ${user.email}. New balance: ${newBalance}`);

          // Send notification email if enabled
        //   if (sendNotifications && user.email) {
        //     try {
        //       await sendMigrationNotification(user, creditsToGrant);
        //       console.log(`📧 Sent migration email to ${user.email}`);
        //     } catch (emailError) {
        //       console.error(`Failed to send email to ${user.email}:`, emailError);
        //     }
        //   }

        } catch (error) {
          console.error(`Failed to migrate user ${user.email}:`, error);
          // Continue with other users
        }
      }
    }

    console.log('\n🎉 Migration completed!');
    console.log(`Migrated users: ${migratedCount}`);
    console.log(`Total credits granted: ${totalCreditsGranted}`);

    return {
      success: true,
      migrated: migratedCount,
      totalCredits: totalCreditsGranted,
      dryRun: false
    };

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await session.endSession();
  }
};

/**
 * Send migration notification email
 */
async function sendMigrationNotification(user, bonusCredits) {
  const emailHtml = MIGRATION_EMAIL_TEMPLATE.html
    .replace(/{{firstName}}/g, user.firstName || 'there')
    .replace(/{{bonusCredits}}/g, bonusCredits)
    .replace(/{{faqUrl}}/g, `${process.env.FRONTEND_URL}/faq`);

  await sendEmail({
    to: user.email,
    subject: MIGRATION_EMAIL_TEMPLATE.subject,
    html: emailHtml
  });
}

/**
 * Verify migration results
 */
export const verifyMigration = async () => {
  console.log('🔍 Verifying migration results...');

  // Check database connection
  if (!process.env.DATABASE) {
    throw new Error('Missing required env var: DATABASE');
  }

  // Connect to database if not already connected
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.DATABASE);
    console.log('Connected to database');
  }

  const results = await Promise.all([
    // Count users with credit balance
    User.countDocuments({ creditBalance: { $gt: 0 } }),
    
    // Count total credit transactions
    CreditTransaction.countDocuments({ actionType: 'BONUS' }),
    
    // Sum all granted bonus credits
    CreditTransaction.aggregate([
      { $match: { actionType: 'BONUS' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  const [usersWithCredits, bonusTransactions, creditSum] = results;
  const totalBonusCredits = creditSum[0]?.total || 0;

  console.log(`Users with credits: ${usersWithCredits}`);
  console.log(`Bonus transactions: ${bonusTransactions}`);
  console.log(`Total bonus credits granted: ${totalBonusCredits}`);

  return {
    usersWithCredits,
    bonusTransactions,
    totalBonusCredits
  };
};

/**
 * Rollback migration (emergency use only)
 */
export const rollbackMigration = async () => {
  console.log('⚠️  ROLLING BACK MIGRATION - Emergency use only!');

  // Check database connection
  if (!process.env.DATABASE) {
    throw new Error('Missing required env var: DATABASE');
  }

  // Connect to database if not already connected
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.DATABASE);
    console.log('Connected to database');
  }

  const session = await mongoose.startSession();

  try {
    // Find all migration transactions
    const migrationTransactions = await CreditTransaction.find({
      actionType: 'BONUS',
      'metadata.migrationDate': { $exists: true }
    }).session(session);

    console.log(`Found ${migrationTransactions.length} migration transactions to rollback`);

    for (const transaction of migrationTransactions) {
      try {
        // Deduct the granted credits
        await User.findByIdAndUpdate(
          transaction.user,
          { $inc: { creditBalance: -transaction.amount } },
          { session }
        );

        // Mark transaction as rolled back
        transaction.metadata.rolledBack = true;
        transaction.metadata.rollbackDate = new Date().toISOString();
        await transaction.save({ session });

        console.log(`Rolled back ${transaction.amount} credits from user ${transaction.user}`);
      } catch (error) {
        console.error(`Failed to rollback transaction ${transaction._id}:`, error);
      }
    }

    await session.commitTransaction();
    console.log('Rollback completed');
    
  } catch (error) {
    await session.abortTransaction();
    console.error('Rollback failed:', error);
    throw error;
  } finally {
    await session.endSession();
  }
};

// Command line interface
const isMainScript = Boolean(
  process.argv[1] &&
    path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
);

if (isMainScript) {
  const command = process.argv[2];
  const options = {
    dryRun: process.argv.includes('--dry-run'),
    sendNotifications: process.argv.includes('--notify'),
    batchSize: parseInt(process.argv.find(arg => arg.startsWith('--batch-size='))?.split('=')[1]) || 100
  };

  const main = async () => {
    try {
      switch (command) {
        case 'migrate':
          await migrateToCredits(options);
          break;
        case 'verify':
          await verifyMigration();
          break;
        case 'rollback':
          console.log('⚠️  WARNING: This will rollback the entire migration!');
          console.log('Type "CONFIRM" to continue:');
          
          // In production, you might want additional confirmation
          if (process.argv[3] === 'CONFIRM') {
            await rollbackMigration();
          } else {
            console.log('Rollback cancelled');
          }
          break;
        default:
          console.log('Usage:');
          console.log('  node migrateToCredits.js migrate [--dry-run] [--notify] [--batch-size=N]');
          console.log('  node migrateToCredits.js verify');
          console.log('  node migrateToCredits.js rollback CONFIRM');
      }
    } catch (error) {
      console.error('Script failed:', error);
      process.exit(1);
    } finally {
      // Close database connection if open
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        console.log('Database connection closed');
      }
    }
  };

  main();
}

export default {
  migrateToCredits,
  verifyMigration,
  rollbackMigration
};
