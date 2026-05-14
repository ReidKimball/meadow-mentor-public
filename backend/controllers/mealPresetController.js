import MealPreset from '../models/mealPreset.model.js';

// @desc    Create a new meal preset
// @route   POST /api/meal-presets
// @access  Private
export const createMealPreset = async (req, res) => {
  try {
    const { presetName, mealName, diet_code, ingredients, mealType, mealNotes, complianceSnapshot } = req.body;
    const firebaseUID = req.user.uid; // From verifyFirebaseToken middleware

    if (!presetName || !mealName || !diet_code || !ingredients || ingredients.length === 0) {
      return res.status(400).json({ message: 'Preset name, meal name, diet code, and ingredients are required.' });
    }

    const newPreset = new MealPreset({
      firebaseUID,
      presetName,
      mealName,
      diet_code,
      ingredients,
      mealType, // Optional
      mealNotes, // Optional
      complianceSnapshot, // Optional, but usually provided
    });

    const savedPreset = await newPreset.save();
    res.status(201).json(savedPreset);
  } catch (error) {
    console.error('Error creating meal preset:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error while creating meal preset.' });
  }
};

// @desc    Get all meal presets for the authenticated user
// @route   GET /api/meal-presets
// @access  Private
export const getMealPresets = async (req, res) => {
  try {
    const firebaseUID = req.user.uid;
    const { dietCode } = req.query; // Optional filter by diet_code

    const query = { firebaseUID };
    if (dietCode) {
      query.diet_code = dietCode;
    }

    const presets = await MealPreset.find(query).sort({ presetName: 1 }); // Sort by name
    res.status(200).json(presets);
  } catch (error) {
    console.error('Error fetching meal presets:', error);
    res.status(500).json({ message: 'Server error while fetching meal presets.' });
  }
};

// @desc    Update a meal preset
// @route   PUT /api/meal-presets/:presetId
// @access  Private
export const updateMealPreset = async (req, res) => {
  try {
    const { presetId } = req.params;
    const firebaseUID = req.user.uid;
    const { presetName, mealName, diet_code, ingredients, mealType, mealNotes, complianceSnapshot } = req.body;

    if (!presetName || !mealName || !diet_code || !ingredients || ingredients.length === 0) {
      return res.status(400).json({ message: 'Preset name, meal name, diet code, and ingredients are required.' });
    }

    const preset = await MealPreset.findOne({ _id: presetId, firebaseUID });

    if (!preset) {
      return res.status(404).json({ message: 'Meal preset not found or user not authorized.' });
    }

    preset.presetName = presetName;
    preset.mealName = mealName;
    preset.diet_code = diet_code;
    preset.ingredients = ingredients;
    preset.mealType = mealType;
    preset.mealNotes = mealNotes;
    preset.complianceSnapshot = complianceSnapshot;
    // lastModifiedAt could be added here automatically if desired

    const updatedPreset = await preset.save();
    res.status(200).json(updatedPreset);
  } catch (error) {
    console.error('Error updating meal preset:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    if (error.kind === 'ObjectId') { // Handle invalid presetId format
        return res.status(400).json({ message: 'Invalid preset ID format.' });
    }
    res.status(500).json({ message: 'Server error while updating meal preset.' });
  }
};

// @desc    Delete a meal preset
// @route   DELETE /api/meal-presets/:presetId
// @access  Private
export const deleteMealPreset = async (req, res) => {
  try {
    const { presetId } = req.params;
    const firebaseUID = req.user.uid;

    const preset = await MealPreset.findOne({ _id: presetId, firebaseUID });

    if (!preset) {
      return res.status(404).json({ message: 'Meal preset not found or user not authorized.' });
    }

    await preset.deleteOne(); // Mongoose 6+ uses deleteOne() on the document instance

    res.status(200).json({ message: 'Meal preset deleted successfully.' }); // Or 204 No Content
  } catch (error) {
    console.error('Error deleting meal preset:', error);
    if (error.kind === 'ObjectId') { // Handle invalid presetId format
        return res.status(400).json({ message: 'Invalid preset ID format.' });
    }
    res.status(500).json({ message: 'Server error while deleting meal preset.' });
  }
};
