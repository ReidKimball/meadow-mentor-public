// backend/models/creditTransaction.model.js
import mongoose from 'mongoose';

/**
 * CreditTransaction Model - Audit trail for all credit movements
 * 
 * This model tracks every credit transaction in the system, providing
 * a complete audit trail of credits earned, spent, and refunded.
 */

const creditTransactionSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  amount: { 
    type: Number, 
    required: true,
    // Positive for purchases/additions, negative for usage/deductions
  },
  actionType: { 
    type: String, 
    enum: [
      'PURCHASE',           // Credits bought via Stripe
      'CREATE_RECIPE',      // Recipe generation
      'CREATE_MEAL_PLAN',   // Meal plan creation
      'GENERATE_IMAGE',     // Recipe image generation
      'MODIFY_RECIPE',      // Recipe modification
      'REFUND',             // System refund on failure
      'BONUS',              // Promotional or transition bonus
      'GENERATE_SHOPPING_LIST', // AI shopping list generation
      'OPTIMIZE_SHOPPING_LIST', // Shopping list optimization
      'CHECK_INGREDIENTS',     // Ingredient label analysis
    ],
    required: true 
  },
  referenceId: { 
    type: String,
    // ID of the related entity (Recipe, MealPlan, Stripe session, etc.)
  },
  description: { 
    type: String,
    // Human-readable description of the transaction
  },
  metadata: { 
    type: mongoose.Schema.Types.Mixed,
    // Additional data for analytics or debugging
  },
  balanceAfter: {
    type: Number,
    // User's credit balance after this transaction
  },
  createdAt: { 
    type: Date, 
    default: Date.now, 
    index: true 
  }
}, {
  timestamps: true,
  collection: 'credit-transactions'
});

// Compound indexes for efficient queries
creditTransactionSchema.index({ user: 1, createdAt: -1 });
creditTransactionSchema.index({ user: 1, actionType: 1, createdAt: -1 });
creditTransactionSchema.index({ actionType: 1, createdAt: -1 });

// Pre-save middleware to populate description if not provided
creditTransactionSchema.pre('save', function(next) {
  if (!this.description && this.actionType) {
    const descriptions = {
      'PURCHASE': 'Credits purchased',
      'CREATE_RECIPE': 'Recipe generated',
      'CREATE_MEAL_PLAN': 'Meal plan created',
      'GENERATE_IMAGE': 'Recipe image generated',
      'MODIFY_RECIPE': 'Recipe modified',
      'REFUND': 'Credits refunded',
      'BONUS': 'Bonus credits added',
      'GENERATE_SHOPPING_LIST': 'AI shopping list generated',
      'OPTIMIZE_SHOPPING_LIST': 'Shopping list optimized',
      'CHECK_INGREDIENTS': 'Ingredient analysis complete'
    };
    this.description = descriptions[this.actionType] || 'Credit transaction';
  }
  next();
});

// Static method to get user's credit history
creditTransactionSchema.statics.getUserHistory = function(userId, limit = 50, offset = 0) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset)
    .populate('user', 'firstName email');
};

// Static method to get credit summary
creditTransactionSchema.statics.getCreditSummary = function(userId, startDate, endDate) {
  const matchStage = { user: userId };
  
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = startDate;
    if (endDate) matchStage.createdAt.$lte = endDate;
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$actionType',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        transactions: { $push: '$$ROOT' }
      }
    },
    {
      $group: {
        _id: null,
        creditsEarned: {
          $sum: {
            $cond: [{ $gt: ['$totalAmount', 0] }, '$totalAmount', 0]
          }
        },
        creditsSpent: {
          $sum: {
            $cond: [{ $lt: ['$totalAmount', 0] }, { $abs: '$totalAmount' }, 0]
          }
        },
        breakdown: {
          $push: {
            actionType: '$_id',
            totalAmount: '$totalAmount',
            count: '$count'
          }
        }
      }
    }
  ]);
};

const CreditTransaction = mongoose.model('CreditTransaction', creditTransactionSchema);

export default CreditTransaction;
