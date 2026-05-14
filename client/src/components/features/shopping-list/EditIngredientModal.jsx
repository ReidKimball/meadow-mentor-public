import React, { useState, useEffect } from 'react';
import { Button, Modal, Box } from '@mui/material';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 500,
  bgcolor: 'background.paper',
  borderRadius: '8px',
  boxShadow: 24,
  p: 4,
};

const EditIngredientModal = ({ isOpen, onClose, onSave, ingredient }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState('');

  useEffect(() => {
    if (ingredient) {
      setName(ingredient.name || '');
      setAmount(ingredient.amount || '');
      setUnit(ingredient.unit || '');
    }
  }, [ingredient]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return; // Name is required

    const updatedIngredient = {
      ...ingredient,
      name: name.trim(),
      amount: amount ? Number(amount) : undefined,
      unit: unit.trim() || undefined,
    };

    onSave(updatedIngredient);
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      aria-labelledby="edit-ingredient-modal-title"
    >
      <Box sx={style}>
        <h2 id="edit-ingredient-modal-title" className="text-2xl font-bold mb-4">Edit Ingredient</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unit</label>
            <input
              type="text"
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={onClose} color="secondary">
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              Save
            </Button>
          </div>
        </form>
      </Box>
    </Modal>
  );
};

export default EditIngredientModal;