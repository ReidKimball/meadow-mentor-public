import ShoppingList from '../models/shoppingList.model.js';

// @desc    Get user's shopping list
// @route   GET /api/shopping-list
// @access  Private
export const getShoppingList = async (req, res) => {
  try {
    const firebaseUID = req.user.uid;

    let shoppingList = await ShoppingList.findOne({ firebaseUID });

    // If no list is found, create a new one for the user
    if (!shoppingList) {
      shoppingList = await ShoppingList.create({ firebaseUID, items: [] });
    }

    res.status(200).json(shoppingList);
  } catch (error) {
    console.error('Error in getShoppingList:', error);
    res.status(500).json({ message: 'Server error while fetching shopping list' });
  }
};

// @desc    Add or merge ingredients into the shopping list
// @route   POST /api/shopping-list/ingredients
// @access  Private
export const addIngredients = async (req, res) => {
  const { ingredients } = req.body;
  const firebaseUID = req.user.uid;

  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ message: 'Ingredients array is required.' });
  }

  try {
    let shoppingList = await ShoppingList.findOne({ firebaseUID });

    if (!shoppingList) {
      shoppingList = await ShoppingList.create({ firebaseUID, items: [] });
    }

    for (const incomingIngredient of ingredients) {
      if (!incomingIngredient.name) continue; // Skip ingredients without a name

      const name = incomingIngredient.name.toLowerCase().trim();
      const existingItem = shoppingList.items.find(item => item.name === name);

      if (existingItem) {
        // If item exists, merge it
        if (typeof incomingIngredient.amount === 'number') {
          existingItem.amount = (existingItem.amount || 0) + incomingIngredient.amount;
        }
        // The unit of the existing item is preserved.
      } else {
        // If item doesn't exist, add it
        shoppingList.items.push({
          name,
          amount: incomingIngredient.amount,
          unit: incomingIngredient.unit,
          checked: false,
        });
      }
    }

    const updatedShoppingList = await shoppingList.save();
    res.status(200).json(updatedShoppingList);
  } catch (error) {
    console.error('Error in addIngredients:', error);
    res.status(500).json({ message: 'Server error while adding ingredients' });
  }
};

// @desc    Update a single ingredient (e.g., toggle checked)
// @route   PATCH /api/shopping-list/ingredients/:id
// @access  Private
export const updateIngredient = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const firebaseUID = req.user.uid;

  try {
    const shoppingList = await ShoppingList.findOne({ firebaseUID });

    if (!shoppingList) {
      return res.status(404).json({ message: 'Shopping list not found.' });
    }

    const itemToUpdate = shoppingList.items.id(id);

    if (!itemToUpdate) {
      return res.status(404).json({ message: 'Ingredient not found.' });
    }

    // Apply updates to the item
    Object.assign(itemToUpdate, updates);

    const updatedShoppingList = await shoppingList.save();
    res.status(200).json(updatedShoppingList);
  } catch (error) {
    console.error('Error in updateIngredient:', error);
    res.status(500).json({ message: 'Server error while updating ingredient' });
  }
};

// @desc    Delete an ingredient from the shopping list
// @route   DELETE /api/shopping-list/ingredients/:id
// @access  Private
export const deleteIngredient = async (req, res) => {
  const { id } = req.params;
  const firebaseUID = req.user.uid;

  console.log(`Attempting to delete ingredient with id: ${id} for user: ${firebaseUID}`);

  try {
    const updatedShoppingList = await ShoppingList.findOneAndUpdate(
      { firebaseUID },
      { $pull: { items: { _id: id } } },
      { new: true } // This option returns the document after the update has been applied
    );

    if (!updatedShoppingList) {
      // This could happen if the user's list doesn't exist, which is unlikely if they are adding items.
      // Or if the item was already deleted.
      // To be safe, we check if the list exists at all.
      const listExists = await ShoppingList.findOne({ firebaseUID });
      if (!listExists) {
        return res.status(404).json({ message: 'Shopping list not found.' });
      } else {
        // If the list exists but the item wasn't pulled, it means the item ID was not found.
        // This could happen with rapid clicks, where the item is already gone.
        // We can return the current list state.
        console.log(`Ingredient with id: ${id} not found or already deleted.`);
        return res.status(200).json(listExists); 
      }
    }

    console.log(`Successfully deleted ingredient. Returning updated list for user: ${firebaseUID}`);
    res.status(200).json(updatedShoppingList);
  } catch (error) {
    console.error('Error in deleteIngredient:', error);
    res.status(500).json({ message: 'Server error while deleting ingredient' });
  }
};

// @desc    Remove all checked ingredients from the list
// @route   POST /api/shopping-list/clear-checked
// @access  Private
export const clearChecked = async (req, res) => {
  const firebaseUID = req.user.uid;

  try {
    const shoppingList = await ShoppingList.findOneAndUpdate(
      { firebaseUID },
      { $pull: { items: { checked: true } } },
      { new: true } // Return the updated document
    );

    if (!shoppingList) {
      // This case might happen if the list is deleted concurrently
      // Or we can create one if it's missing, for consistency.
      const newList = await ShoppingList.create({ firebaseUID, items: [] });
      return res.status(200).json(newList);
    }

    res.status(200).json(shoppingList);
  } catch (error) {
    console.error('Error in clearChecked:', error);
    res.status(500).json({ message: 'Server error while clearing checked ingredients' });
  }
};
