// mealPlan.model.js
import mongoose from 'mongoose';
import { appendShortHashSlug, generateSlug } from '../utils/generateSlug.js';
import { dietCodes } from './therapeuticDiets.model.js';

/**
 * MealPlan Model - Template-Based (Redesigned)
 * 
 * Meal plans are now date-agnostic templates that can be reused.
 * They are assigned to specific dates via the CalendarAssignment model.
 * 
 * Key changes from old model:
 * - Days use dayNumber (1, 2, 3) instead of specific dates
 * - No startDate/endDate (those are in CalendarAssignment)
 * - No isActive flag (that's in CalendarAssignment)
 * - Added timesUsed and lastUsedDate for tracking
 */

/**
 * Schema for individual meal slots within a day
 * Can store either a recipe reference or an AI-generated placeholder
 */
const mealSlotSchema = new mongoose.Schema({
  // For saved recipes
  recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
  recipeTitle: { type: String },
  recipeDescription: { type: String },
  recipeDiet: { type: String },
  recipeImage: {
    thumbnail: { type: String },
    display: { type: String },
    original: { type: String },
  },
  recipeImageVersion: { type: Number, default: 0 },
  mealType: { type: String },
  
  // For AI-generated placeholders
  title: { type: String },
  description: { type: String },
  
  // Flag to distinguish between saved recipes and placeholders
  isPlaceholder: { type: Boolean, default: false },
}, { _id: false });

/**
 * Schema for a single day in the meal plan
 * Now uses dayNumber (relative) instead of specific dates
 */
const daySchema = new mongoose.Schema({
  dayNumber: { 
    type: Number, 
    required: true,
    min: 1,
    // Day 1, Day 2, Day 3, etc.
  },
  meals: {
    breakfast: { type: mealSlotSchema, default: null },
    lunch: { type: mealSlotSchema, default: null },
    dinner: { type: mealSlotSchema, default: null },
    snack: { type: mealSlotSchema, default: null },
  }
}, { _id: false });

/**
 * Main MealPlan schema - Template-Based
 * Stores reusable meal plan templates (date-agnostic)
 */
const mealPlanSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  planName: { 
    type: String, 
    default: 'My Meal Plan' 
  },
  primaryDiet: {
    type: String,
    enum: dietCodes,
    default: null,
    index: true,
  },
  visibility: {
    type: String,
    enum: ['private', 'unlisted', 'public'],
    default: 'private',
    index: true,
  },
  slug: {
    type: String,
    trim: true,
  },
  duration: {
    type: Number,
    required: true,
    min: 1,
    max: 14,
    // Number of days in this plan template
  },
  days: [daySchema],
  
  // Store the settings used to generate this plan
  settings: {
    includedMealTypes: {
      breakfast: { type: Boolean, default: true },
      lunch: { type: Boolean, default: true },
      dinner: { type: Boolean, default: true },
      snack: { type: Boolean, default: true },
    },
    dynamicPreferences: { type: String, default: '' },
  },
  
  // Usage tracking
  timesUsed: {
    type: Number,
    default: 0,
    // Incremented each time this plan is assigned to dates
  },
  lastUsedDate: {
    type: Date,
    default: null,
    // Last date this plan was assigned
  },
}, { 
  timestamps: true,
  collection: 'meal-plans',  // Renamed collection
});

// Index for efficient queries
mealPlanSchema.index({ user: 1, createdAt: -1 });
mealPlanSchema.index({ user: 1, lastUsedDate: -1 });
mealPlanSchema.index({ slug: 1 }, { unique: true, sparse: true });

mealPlanSchema.pre('save', async function(next) {
  try {
    const isShareable = this.visibility === 'public' || this.visibility === 'unlisted';
    const isBecomingShareable = isShareable && (this.isNew || this.isModified('visibility'));
    const hasSlug = typeof this.slug === 'string' && this.slug.trim().length > 0;

    if (!isBecomingShareable || hasSlug) {
      return next();
    }

    const baseSlug = generateSlug(this.planName, 'mealPlan', this.primaryDiet || '', { duration: this.duration });
    let candidate = baseSlug;

    const collision = await this.constructor
      .findOne({ slug: candidate, _id: { $ne: this._id } })
      .select({ _id: 1 })
      .lean();

    if (collision) {
      candidate = appendShortHashSlug(baseSlug, this._id.toString());
    }

    this.slug = candidate;
    return next();
  } catch (error) {
    return next(error);
  }
});

// Virtual for calculating total days (should match duration)
mealPlanSchema.virtual('totalDays').get(function() {
  return this.days.length;
});

// Method to increment usage tracking
mealPlanSchema.methods.recordUsage = async function(assignmentDate) {
  console.log('[MealPlan.recordUsage] Recording usage for plan:', this._id);
  console.log('[MealPlan.recordUsage] Assignment date:', assignmentDate);
  
  this.timesUsed = (this.timesUsed || 0) + 1;
  this.lastUsedDate = assignmentDate;
  
  console.log('[MealPlan.recordUsage] Times used:', this.timesUsed);
  return this.save();
};

// DEPRECATED: Use CalendarAssignment.getActiveAssignmentForDate() instead
// This method is kept for backward compatibility during migration
mealPlanSchema.statics.getActivePlanForDate = function(userId, date) {
  console.warn('[MealPlan.getActivePlanForDate] DEPRECATED: Use CalendarAssignment.getActiveAssignmentForDate() instead');
  console.log('[MealPlan.getActivePlanForDate] Finding active plan for user:', userId, 'date:', date);
  
  // This will be removed after migration is complete
  return null;
};

// DEPRECATED: Plans are no longer "active" - use CalendarAssignment instead
mealPlanSchema.statics.getActivePlan = function(userId) {
  console.warn('[MealPlan.getActivePlan] DEPRECATED: Use CalendarAssignment instead');
  return null;
};

// DEPRECATED: Use CalendarAssignment.deactivateOverlapping() instead
mealPlanSchema.statics.findOverlappingActivePlans = function(userId, startDate, endDate, excludePlanId = null) {
  console.warn('[MealPlan.findOverlappingActivePlans] DEPRECATED: Use CalendarAssignment instead');
  return [];
};

// DEPRECATED: Use CalendarAssignment.deactivateOverlapping() instead
mealPlanSchema.statics.deactivatePlansForDateRange = async function(userId, startDate, endDate) {
  console.warn('[MealPlan.deactivatePlansForDateRange] DEPRECATED: Use CalendarAssignment instead');
  return { modifiedCount: 0 };
};

// Static method to get all plans for a user (templates)
mealPlanSchema.statics.getUserPlans = function(userId, limit = 100) {
  console.log('[MealPlan.getUserPlans] Getting plans for user:', userId);
  return this.find({ user: userId })
    .sort({ lastUsedDate: -1, createdAt: -1 })  // Most recently used first
    .limit(limit);
};

const MealPlan = mongoose.model('MealPlan', mealPlanSchema);

export default MealPlan;
