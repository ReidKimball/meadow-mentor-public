/**
 * CalendarAssignment Model
 * 
 * Represents the assignment of a meal plan template to specific dates.
 * This allows meal plans to be reusable templates that can be scheduled
 * on different date ranges multiple times.
 */

import mongoose from 'mongoose';

const calendarAssignmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mealPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MealPlan',
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    // Optional: Explicit day mappings for clarity
    dayMappings: [
      {
        date: {
          type: Date,
          required: true,
        },
        planDayNumber: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
    collection: 'calendar-assignments',
  }
);

// Compound indexes for efficient queries
calendarAssignmentSchema.index({ user: 1, startDate: 1, endDate: 1 });
calendarAssignmentSchema.index({ user: 1, isActive: 1, startDate: 1 });
calendarAssignmentSchema.index({ user: 1, mealPlanId: 1 });

/**
 * Static method to find active assignment for a specific date
 * @param {ObjectId} userId - User ID
 * @param {Date} date - The date to check
 * @returns {Promise<CalendarAssignment|null>}
 */
calendarAssignmentSchema.statics.getActiveAssignmentForDate = function(userId, date) {
  console.log('[CalendarAssignment.getActiveAssignmentForDate] Finding assignment for user:', userId, 'date:', date);
  
  // Normalize the input date to start of day (UTC)
  const searchDate = new Date(date);
  searchDate.setUTCHours(0, 0, 0, 0);
  
  // Create end of day (UTC)
  const searchDateEnd = new Date(searchDate);
  searchDateEnd.setUTCHours(23, 59, 59, 999);
  
  console.log('[CalendarAssignment.getActiveAssignmentForDate] Normalized search range (UTC):', searchDate, 'to', searchDateEnd);
  
  return this.findOne({
    user: userId,
    isActive: true,
    startDate: { $lte: searchDateEnd },
    endDate: { $gte: searchDate },
  }).populate('mealPlanId');
};

/**
 * Static method to deactivate overlapping assignments
 * @param {ObjectId} userId - User ID
 * @param {Date} startDate - Start date of new assignment
 * @param {Date} endDate - End date of new assignment
 * @returns {Promise<void>}
 */
calendarAssignmentSchema.statics.deactivateOverlapping = async function(userId, startDate, endDate) {
  console.log('[CalendarAssignment.deactivateOverlapping] Deactivating overlapping assignments');
  console.log('User:', userId);
  console.log('Date range:', startDate, 'to', endDate);
  
  const result = await this.updateMany(
    {
      user: userId,
      isActive: true,
      $or: [
        // New range overlaps with existing range
        {
          startDate: { $lte: endDate },
          endDate: { $gte: startDate },
        },
      ],
    },
    {
      $set: { isActive: false },
    }
  );
  
  console.log('[CalendarAssignment.deactivateOverlapping] Deactivated', result.modifiedCount, 'assignments');
  return result;
};

/**
 * Instance method to generate day mappings
 * @param {Number} planDuration - Duration of the meal plan in days
 * @returns {Array} Day mappings
 */
calendarAssignmentSchema.methods.generateDayMappings = function(planDuration) {
  console.log('[CalendarAssignment.generateDayMappings] Generating mappings for', planDuration, 'days');
  
  const mappings = [];
  const start = new Date(this.startDate);
  
  for (let i = 0; i < planDuration; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    
    mappings.push({
      date: date,
      planDayNumber: i + 1, // Day 1, Day 2, etc.
    });
  }
  
  console.log('[CalendarAssignment.generateDayMappings] Generated', mappings.length, 'mappings');
  return mappings;
};

const CalendarAssignment = mongoose.model('CalendarAssignment', calendarAssignmentSchema);

export default CalendarAssignment;
