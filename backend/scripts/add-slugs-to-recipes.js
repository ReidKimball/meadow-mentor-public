// backend/scripts/add-slugs-to-recipes.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Recipe from '../models/recipe.model.js';

dotenv.config({ path: '../.env.config' });

const generateSlug = (title, id) => {
  const baseSlug = title
    .toLowerCase()
    .replace(/\s+/g, '-')       // Replace spaces with -
    .replace(/[^\w\-]+/g, '')  // Remove all non-word chars
    .replace(/\-\-+/g, '-')   // Replace multiple - with single -
    .replace(/^-+/, '')         // Trim - from start of text
    .replace(/-+$/, '');        // Trim - from end of text
  return `${baseSlug}-${id}`;
};

const addSlugsToRecipes = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.DATABASE, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected.');

    const recipesToUpdate = await Recipe.find({ slug: { $exists: false } });

    if (recipesToUpdate.length === 0) {
      console.log('All recipes already have slugs. No action needed.');
      return;
    }

    console.log(`Found ${recipesToUpdate.length} recipes to update.`);

    for (const recipe of recipesToUpdate) {
      recipe.slug = generateSlug(recipe.recipeTitle, recipe._id);
      await recipe.save();
      console.log(`Updated slug for recipe: "${recipe.recipeTitle}"`);
    }

    console.log('Successfully added slugs to all recipes.');

  } catch (error) {
    console.error('Error adding slugs to recipes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
};

addSlugsToRecipes();
