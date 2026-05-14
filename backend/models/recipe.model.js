// backend/models/recipe.model.js
import mongoose from 'mongoose';
import { dietCodes } from './therapeuticDiets.model.js'; // enum array
import { appendShortHashSlug, generateSlug, pickRecipeSlugPrefix } from '../utils/generateSlug.js';

/**
 * Normalizes an AI-provided `seoSlugCandidate` into a URL-safe slug string.
 *
 * @param {string} value - Candidate string (may include spaces/punctuation).
 * @returns {string} A normalized, URL-safe slug (may be empty if the candidate has no usable characters).
 */
const normalizeSeoSlugCandidate = (value) => {
  const safe = typeof value === 'string' ? value : '';
  return safe
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const ingredientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    unit:   { type: String },
    notes:  { type: String, default: '' },
  },
  { _id: false }
);

const ratingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
  },
  { _id: false }
);

const recipeSchema = new mongoose.Schema(
  {
    generatedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User who prompted the recipe
    savedBy:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of users who have saved this recipe
    userPrompt:   { type: String },
    source: { type: String, default: null, index: true },
    parentRecipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', default: null, index: true },
    parentRecipeSlug: { type: String, default: null, index: true },
    anonSessionId: { type: String, default: null, index: true },
    claimedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    recipeTitle:  { type: String, required: true },
    seoSlugCandidate: { type: String, trim: true },
    slug:         { type: String, trim: true, unique: true, sparse: true, index: true },
    recipeDiet:   { type: String, enum: dietCodes, required: true },
    recipeImage: {
      thumbnail: { type: String, default: '' },
      display: { type: String, default: '' },
      original: { type: String, default: '' },
    },
    imageVersion: { type: Number, default: 0 },
    recipeDescription: { type: String, default: '' },
    mealType: {
      type: String,
      enum: [
        'breakfast','lunch','dinner','snack',
        'dessert','appetizer','side dish','sauce','condiment',
        'staple', 'beverage'
      ],
      required: true,
    },
    ratings: { type: [ratingSchema], default: [] },
    averageRating: { type: Number, min: 0, max: 5, default: 0 },
    prepTime:      { type: String },
    cookTime:      { type: String },
    totalTime:     { type: String },
    recipeYield:   { type: String },
    ingredients:   { type: [ingredientSchema], required: true },
    steps:  { type: [String], required: true },
    notes:         { type: String, default: '' },
    calories:      { type: Number, min: 0, default: null },
    tags:          { type: [String], default: [] },
    visibility:    { type: String, enum: ['private', 'unlisted', 'public'], default: 'private', index: true },
    isPublic:      { type: Boolean, default: false },
    isFirstHealingMeal: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

recipeSchema.pre('save', function(next) {
  if (this.isModified('visibility')) {
    this.isPublic = this.visibility === 'public';
  } else if (this.isModified('isPublic')) {
    this.visibility = this.isPublic ? 'public' : 'private';
  }

  if (typeof this.visibility !== 'string' || this.visibility.trim().length === 0) {
    this.visibility = this.isPublic ? 'public' : 'private';
  }

  return next();
});

// Pre-save hook to prevent slug: null from being stored (unique sparse index collision)
recipeSchema.pre('save', function(next) {
  if (this.slug === null || this.slug === undefined || this.slug === '') {
    // Use set with undefined to tell Mongoose to $unset the field
    this.set('slug', undefined, { strict: false });
  }
  next();
});

recipeSchema.pre('save', async function(next) {
  try {
    const hasSlug = typeof this.slug === 'string' && this.slug.trim().length > 0;
    const isLegacySlug = hasSlug && /-[0-9a-f]{24}$/i.test(this.slug.trim());
    const visibility = typeof this.visibility === 'string'
      ? this.visibility
      : (this.isPublic === true ? 'public' : 'private');
    const isExternallyVisible = visibility !== 'private';

    const hasSeoSlugCandidate =
      typeof this.seoSlugCandidate === 'string' &&
      this.seoSlugCandidate.trim().length > 0;

    // Skip slug generation for private recipes or if slug was manually modified
    if (!isExternallyVisible) {
      return next();
    }
    
    if (this.isModified('slug') && hasSlug && !isLegacySlug) {
      return next();
    }

    const shouldGenerateSlug = this.isNew || this.isModified('visibility') || this.isModified('isPublic') || !hasSlug || isLegacySlug;
    if (!shouldGenerateSlug) {
      return next();
    }

    const candidateFromAi = hasSeoSlugCandidate
      ? normalizeSeoSlugCandidate(this.seoSlugCandidate)
      : '';

    const prefix = pickRecipeSlugPrefix(this.tags, this.recipeDiet);

    const aiWithPrefix = (() => {
      if (!candidateFromAi) return '';
      if (!prefix || prefix === 'recipe') return candidateFromAi;

      const normalizedPrefix = `${prefix}-`;
      if (candidateFromAi === prefix || candidateFromAi.startsWith(normalizedPrefix)) {
        return candidateFromAi;
      }

      return `${prefix}-${candidateFromAi}`;
    })();

    const baseSlug = aiWithPrefix || generateSlug(this.recipeTitle, 'recipe', prefix);
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

// Pre-save hook to calculate the average rating
recipeSchema.pre('save', function(next) {
  if (this.isModified('ratings')) {
    const totalRatings = this.ratings.length;
    if (totalRatings > 0) {
      const sumOfRatings = this.ratings.reduce((acc, item) => acc + item.rating, 0);
      this.averageRating = parseFloat((sumOfRatings / totalRatings).toFixed(2));
    } else {
      this.averageRating = 0;
    }
  }
  next();
});

const Recipe = mongoose.model('Recipe', recipeSchema);

export default Recipe;