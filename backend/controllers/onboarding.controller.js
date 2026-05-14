import User from '../models/user.model.js';
import Recipe from '../models/recipe.model.js';
import * as userHealthService from '../services/userHealth.service.js';
import { loadPrompt } from '../ai_prompts/loadPrompt.js';

/**
 * @route   GET /api/onboarding/first-healing-meal
 * @desc    Get the first healing meal for the user based on their therapeutic diet.
 * @access  Private
 */
export const getFirstHealingMeal = async (req, res) => {
  try {
    console.log('Entering getFirstHealingMeal...');
    // The user's firebaseUID is attached to the request by the auth middleware
    // Get merged user data (includes health fields)
    const user = await userHealthService.getMergedUserData(req.user.uid);
    console.log(user ? `User found: ${user.email}` : 'User not found in DB.');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Check if the user has a primary diet selected.
    if (!user.primaryDiet) {
      return res.status(400).json({ success: false, message: 'User has not selected a primary diet.' });
    }

    const primaryDiet = user.primaryDiet;

    // Find the pre-generated recipe for the user's primary diet
    const firstRecipe = await Recipe.findOne({
      isFirstHealingMeal: true,
      recipeDiet: primaryDiet
    });
    console.log(firstRecipe ? `First healing meal recipe found: ${firstRecipe.recipeTitle}` : 'First healing meal recipe not found.');

    // Validate that the found recipe has a name
    if (!firstRecipe || !firstRecipe.recipeTitle) {
      console.error('CRITICAL: A first healing meal recipe was found but is missing a recipeTitle.', { recipeId: firstRecipe?._id });
      return res.status(404).json({ 
        success: false, 
        message: `No valid first healing meal recipe found for the ${primaryDiet} diet.` 
      });
    }

    console.log(`Attempting to save recipe '${firstRecipe.recipeTitle}' for user '${user.email}'...`);
    // Concurrently update both the Recipe and User documents
    const [updatedUser, updatedRecipe] = await Promise.all([
      User.findByIdAndUpdate(
        user._id,
        { $addToSet: { savedRecipes: firstRecipe._id }, $set: { 'onboarding.firstHealingMealCompleted': true } },
        { new: true }
      ),
      Recipe.findByIdAndUpdate(
        firstRecipe._id,
        { $addToSet: { savedBy: user._id } },
        { new: true }
      )
    ]);
    console.log(`Recipe saved for user. User savedRecipes count: ${updatedUser.savedRecipes.length}. Recipe savedBy count: ${updatedRecipe.savedBy.length}.`);
    
    // Construct a personalized welcome message using the primary diet
    const welcomeMessage = `Hello, ${user.firstName}! I see you're focusing on the ${primaryDiet} for managing ${user.conditionTreating}. That's a great step. Here is a simple, healing recipe to get you started.`;

    res.status(200).json({ 
      success: true, 
      welcomeMessage,
      recipe: updatedRecipe // Send the updated recipe
    });

  } catch (error) {
    console.error('Error in getFirstHealingMeal:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching first healing meal.', error: error.message });
  }
};

/**
 * @route   POST /api/onboarding/first-healing-meal/complete
 * @desc    Mark the first healing meal step as complete for the user.
 * @access  Private
 */
export const completeFirstHealingMeal = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { firebaseUID: req.user.uid },
      { 'onboarding.firstHealingMealCompleted': true },
      { new: true } // Return the updated document
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'First healing meal step marked as complete.',
      data: { firstHealingMealCompleted: user.onboarding.firstHealingMealCompleted }
    });

  } catch (error) {
    console.error('Error in completeFirstHealingMeal:', error);
    res.status(500).json({ success: false, message: 'Server error while updating onboarding status.', error: error.message });
  }
}

/**
 * @route   POST /api/onboarding/skip-quick-start
 * @desc    Mark the Quick Start guide as skipped for the user.
 * @access  Private
 */
export const skipQuickStart = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { firebaseUID: req.user.uid },
      { 'onboarding.quickStartSkipped': true },
      { new: true } // Return the updated document
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    console.log(`User ${user.firebaseUID} skipped the Quick Start guide. Flag set to: ${user.onboarding.quickStartSkipped}`);

    res.status(200).json({ 
      success: true, 
      message: 'Quick Start guide successfully marked as skipped.',
      data: { quickStartSkipped: user.onboarding.quickStartSkipped }
    });

  } catch (error) {
    console.error('Error in skipQuickStart:', error);
    res.status(500).json({ success: false, message: 'Server error while updating onboarding status.', error: error.message });
  }
}

/**
 * @route   PATCH /api/onboarding/ask-kay-intro-complete
 * @desc    Mark the Ask Kay intro as shown for the user.
 * @access  Private
 */
export const completeAskKayIntro = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { firebaseUID: req.user.uid },
      { 'onboarding.askKayIntroShown': true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    console.log(`User ${user.firebaseUID} completed Ask Kay intro. Flag set to: ${user.onboarding.askKayIntroShown}`);

    res.status(200).json({ 
      success: true, 
      askKayIntroShown: user.onboarding.askKayIntroShown
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error while updating onboarding status.', error: error.message });
  }
}

/**
 * @route   GET /api/onboarding/ask-kay-intro
 * @desc    Get the Chef Kay intro message.
 * @access  Private
 */
export const getAskKayIntro = async (req, res) => {
  try {
    const introMessage = loadPrompt('chef_kay_intro');
    // Extract just the message content (skip the header and ---)
    const introContent = introMessage.split('---').pop().trim();
    
    res.status(200).json({ 
      success: true, 
      introContent
    });

  } catch (error) {
    console.error('Error in getAskKayIntro:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching intro message.', error: error.message });
  }
}
