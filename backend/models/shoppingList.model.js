import mongoose from 'mongoose';

const ingredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  amount: {
    type: Number,
    required: false,
  },
  unit: {
    type: String,
    required: false,
    trim: true,
  },
  checked: {
    type: Boolean,
    default: false,
  },
});

const shoppingListSchema = new mongoose.Schema(
  {
    firebaseUID: {
      type: String,
      required: true,
      unique: true,
      index: true, // Add index for faster queries on firebaseUID
    },
    items: [ingredientSchema],
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

const ShoppingList = mongoose.model('ShoppingList', shoppingListSchema);

export default ShoppingList;
