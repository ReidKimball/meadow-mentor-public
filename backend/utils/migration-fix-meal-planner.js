import mongoose from "mongoose";
import * as dotenv from "dotenv";
import User from "../models/user.model.js";

dotenv.config({ path: "../.env.config" });

// Connect to MongoDB
const DB = process.env.DATABASE;
mongoose
  .connect(DB)
  .then(async () => {
    console.log("DB connection successful!");

    // Find all users with incomplete mealPlanner structure
    const users = await User.find({
      "apiUsage.limits.mealPlanner.daily": { $exists: false },
    });

    console.log(
      `Found ${users.length} users with incomplete mealPlanner structure`
    );

    // Update each user
    for (const user of users) {
      // Check if user is premium
      const isPremium = user.paymentStatus?.status === "active";

      // Set the mealPlanner structure
      user.apiUsage.limits.mealPlanner = {
        daily: 2,
        premium: 6,
        // If premium, set remaining to premium value, otherwise use daily value
        remaining: isPremium ? 6 : 2,
      };

      await user.save();
      console.log(
        `Updated user: ${user.email} (Premium: ${isPremium ? "Yes" : "No"})`
      );
    }

    console.log("Migration complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.log("DB connection error:", error);
    process.exit(1);
  });
