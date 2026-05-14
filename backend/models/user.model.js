import mongoose from "mongoose";
import { sanitizeName, sanitizeEmail } from "../utils/sanitization.utils.js";

// Schema Design
const userSchema = new mongoose.Schema({
  firebaseUID: {
    type: String,
    required: [true, "firebaseUID is required"],
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  firstName: {
    type: String,
    required: [true, "First name is required"],
    minlength: [1, "First name must be at least 1 character"],
    maxlength: [50, "First name must not exceed 50 characters"],
    validate: {
      validator: function (v) {
        // Only letters, spaces, hyphens, apostrophes
        return /^[a-zA-Z\s\-']+$/.test(v);
      },
      message: (props) =>
        `${props.value} is not a valid name. Only letters, spaces, hyphens, and apostrophes are allowed.`,
    },
    set: function (v) {
      return sanitizeName(v);
    },
  },
  lastName: {
    type: String,
    default: "",
    maxlength: [50, "Last name must not exceed 50 characters"],
    validate: {
      validator: function (v) {
        if (!v) return true; // Optional field
        return /^[a-zA-Z\s\-']*$/.test(v);
      },
      message: (props) =>
        `${props.value} is not a valid name. Only letters, spaces, hyphens, and apostrophes are allowed.`,
    },
    set: function (v) {
      return v ? sanitizeName(v) : "";
    },
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    maxlength: [254, "Email must not exceed 254 characters"],
    validate: {
      validator: function (v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: (props) => `${props.value} is not a valid email address.`,
    },
    set: function (v) {
      return sanitizeEmail(v);
    },
  },
  profileImageUrl: {
    type: String,
    default: null, // null means use Google photo or default avatar
  },
  // Health fields moved to UserHealth collection for HIPAA compliance
  // (primaryDiet, dietaryRestrictions, customDietaryRestrictions, conditionTreating,
  //  weight, sex, activity, inFlare)
  timezone: {
    type: String,
    trim: true,
    default: null, // Default to null, indicating not set by user
    // You might want to add validation using a list of known IANA timezones later
  },
  paymentStatus: {
    status: {
      type: String,
      enum: ["free", "trial", "active", "expired", "canceled", "past_due"],
      default: "free",
    },
    stripeId: String,
    nextBillingDate: Date,
    plan: {
      type: String,
      enum: ["basic", "early adopter", "premium"],
      default: "basic",
    },
  },
  // Credit System Fields
  creditBalance: {
    type: Number,
    default: 0,
    min: 0,
    index: true,
    // User's current credit balance (prepaid credits that never expire)
  },
  apiUsage: {
    limits: {
      recipeGeneration: {
        daily: { type: Number, default: 5 },
        premium: { type: Number, default: 30 },
        remaining: { type: Number, default: 5 },
        lastReset: { type: Date, default: Date.now },
        resetPeriod: { type: String, enum: ['daily', 'monthly'], default: 'daily' },
      },
      mealConvert: {
        daily: { type: Number, default: 5 },
        premium: { type: Number, default: 30 },
        remaining: { type: Number, default: 5 },
        lastReset: { type: Date, default: Date.now },
        resetPeriod: { type: String, enum: ['daily', 'monthly'], default: 'daily' },
      },
      askKay: {
        daily: { type: Number, default: 5 },
        premium: { type: Number, default: 30 },
        remaining: { type: Number, default: 5 },
        lastReset: { type: Date, default: Date.now },
        resetPeriod: { type: String, enum: ['daily', 'monthly'], default: 'daily' },
      },
      mealPlanner: {
        daily: { type: Number, default: 6 }, // Free tier: 6 uses per month
        premium: { type: Number, default: 30 }, // Premium: 30 uses per month
        remaining: { type: Number, default: 6 },
        lastReset: { type: Date, default: Date.now },
        resetPeriod: { type: String, enum: ['daily', 'monthly'], default: 'monthly' },
      },
      checkIngredients: {
        daily: { type: Number, default: 5 },
        premium: { type: Number, default: 30 },
        remaining: { type: Number, default: 5 },
        lastReset: { type: Date, default: Date.now },
        resetPeriod: { type: String, enum: ['daily', 'monthly'], default: 'daily' },
      },
      analyzeMeal: {
        daily: { type: Number, default: 5 },
        premium: { type: Number, default: 30 },
        remaining: { type: Number, default: 5 },
        lastReset: { type: Date, default: Date.now },
        resetPeriod: { type: String, enum: ['daily', 'monthly'], default: 'daily' },
      },
      analyzeDoctorReport: {
        daily: { type: Number, default: 5 },
        premium: { type: Number, default: 30 },
        remaining: { type: Number, default: 5 },
        lastReset: { type: Date, default: Date.now },
        resetPeriod: { type: String, enum: ['daily', 'monthly'], default: 'daily' },
      },
      journalAnalysis: {
        daily: { type: Number, default: 5 },
        premium: { type: Number, default: 30 },
        remaining: { type: Number, default: 5 },
        lastReset: { type: Date, default: Date.now },
        resetPeriod: { type: String, enum: ['daily', 'monthly'], default: 'daily' },
      },
    },
    lastReset: {
      type: Date,
      default: Date.now,
    },
  },
  onboarding: {
    onboardingComplete: { type: Boolean, default: false },
    firstHealingMealCompleted: { type: Boolean, default: false },
    quickStartSkipped: { type: Boolean, default: false },
    askKayIntroShown: { type: Boolean, default: false },
    gotRecipeFromChefKay: { type: Boolean, default: false },
  },
  weeklyMealPlanSettings: {
    planDuration: { type: Number, default: 7 },
    includedMealTypes: {
      breakfast: { type: Boolean, default: true },
      lunch: { type: Boolean, default: true },
      dinner: { type: Boolean, default: true },
      snack: { type: Boolean, default: true },
    },
    dynamicPreferences: { type: String, default: '' },
  },
  preferences: {
    showCreditSpendConfirmations: {
      type: Boolean,
      default: true,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
    default: Date.now, // Tracks the most recent login time
  },
  previousLastLogin: {
    type: Date, // Tracks the login before the most recent one
  },
  lastActiveAt: {
    type: Date,
    default: Date.now, // Last time the user was active (can be updated during session)
  },
  previousLastActiveAt: {
    type: Date, // Previous last active time
  },
  loginHistory: [
    {
      timestamp: Date,
      ipAddress: String,
    },
  ],
  savedRecipes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
    },
  ],
  lastOpenAskKayChat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ChatSession",
    default: null,
  },
});

const User = mongoose.model("User", userSchema);

export default User;
