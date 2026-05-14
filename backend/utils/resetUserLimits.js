/**
 * User API Limit Reset Utility
 *
 * This utility script resets or updates the API usage limits for users in the AI-SCD-Guide application.
 * It can target specific users by email or update all users in the database.
 *
 * Key functionality:
 * - Connects to MongoDB database using mongoose
 * - Allows selecting specific users by email or updating all users
 * - Resets API usage counters for various application features
 *   (recipeGeneration, mealConvert, askKay, etc.)
 * - Sets appropriate limits based on user's premium status
 * - Updates the lastReset timestamp to the current date
 * - Provides interactive command-line interface for operation
 *
 * Typically used for:
 * - Periodic refreshing of user API limits
 * - Fixing user accounts with incorrect limit settings
 * - Testing changes to the limit system
 */

import mongoose from "mongoose";
import User from "../models/user.model.js";
import dotenv from "dotenv";
import readline from "readline";

dotenv.config({ path: "../.env.config" });

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function migrateUsers(emails = []) {
  try {
    await mongoose.connect(process.env.DATABASE);
    console.log("Connected to database");

    // Build the query based on whether emails were provided
    let query = {};
    if (emails.length > 0) {
      console.log(`Will update only these emails: ${emails.join(", ")}`);
      query = { email: { $in: emails } };
    } else {
      console.log("No specific emails provided. Will update ALL users.");
    }

    const users = await User.find(query);

    if (users.length === 0) {
      console.log("no matching users found.");
      return;
    }

    console.log(`Found ${users.length} users to update`);

    for (const user of users) {

      // Use the same robust premium check as the live middleware
      const isPremium = user.paymentStatus?.status === "active" && (user.paymentStatus?.plan === "premium" || user.paymentStatus?.plan === "early adopter");

      // Create a new temporary user instance to get all schema defaults reliably
      const tempUser = new User();

      // Convert Mongoose subdocument to a plain JS object to avoid prototype issues
      const defaultLimitsObj = tempUser.apiUsage.limits.toObject
        ? tempUser.apiUsage.limits.toObject()
        : JSON.parse(JSON.stringify(tempUser.apiUsage.limits));

      const newLimits = {};

      // Iterate over each service in the default limits
      for (const [service, limit] of Object.entries(defaultLimitsObj)) {
        if (limit && typeof limit === "object") {
          newLimits[service] = {
            daily: limit.daily,
            premium: limit.premium,
            remaining: isPremium ? limit.premium : limit.daily,
          };
        }
      }

      // Update each user with the new structure
      user.apiUsage = {
        lastReset: new Date(), // Always reset the timestamp to current date
        limits: newLimits,
      };

      await user.save();
      console.log(
        `Updated user: ${user.email} (Premium: ${
          isPremium ? "Yes" : "No"
        }) - Reset timestamp: ${user.apiUsage.lastReset}`
      );
    }

    console.log("Migration complete");
    //process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    mongoose.disconnect();
  }
}

// Start the script by prompting for emails
rl.question(
  "Enter email address(es) to update (separate multiple emails with commas) or press Enter to update all users: ",
  async (emailInput) => {
    try {
      let emails = [];

      // Only process emails if the input isn't empty
      if (emailInput.trim() !== "") {
        emails = emailInput
          .split(",")
          .map((email) => email.trim().toLowerCase());
      }

      await migrateUsers(emails);
      rl.close();
    } catch (err) {
      console.error("Error during migration:", err);
      rl.close();
      process.exit(1);
    }
  }
);

// Handle readline close
rl.on("close", () => {
  console.log("Exiting script");
  process.exit(0);
});
