import React, { useState, useEffect, useCallback } from 'react';
import {
  getShoppingList,
  addIngredients,
  updateIngredient,
  deleteIngredient,
  clearCheckedIngredients,
} from '../../../services/shoppingListService';
import { useUser } from '../../../context/UserContext';
import IngredientRow from './IngredientRow';
import AddIngredientModal from './AddIngredientModal'; // Import the modal
import AddFromRecipeModal from './AddFromRecipeModal';
import EditIngredientModal from './EditIngredientModal';
import { Stack, Button, CircularProgress, Divider } from '@mui/material';
import UpgradeModal from '../../Common/UpgradeModal';
import { HttpError } from '../../../utils/http-errors';
import ButtonLayoutOption1 from './ButtonLayoutOption1';
import ButtonLayoutOption2 from './ButtonLayoutOption2';
import ButtonLayoutOption3 from './ButtonLayoutOption3';
import ButtonLayoutOption4 from './ButtonLayoutOption4';
import Swal from 'sweetalert2';

const ShoppingList = () => {
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddFromRecipeModalOpen, setIsAddFromRecipeModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeModalContent, setUpgradeModalContent] = useState({ title: '', message: '' });
  const { user, getFreshIdToken } = useUser();

  console.log('[ShoppingList] Initializing. User context available:', !!user);

  const fetchList = useCallback(async () => {
    if (!user) {
      console.log('[ShoppingList] fetchList called, but no user context yet. Aborting fetch.');
      return; // Don't fetch if user is not available yet
    }
    try {
      setLoading(true);
      const data = await getShoppingList(getFreshIdToken);
      setList(data);
      setError('');
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [getFreshIdToken, user]);

  useEffect(() => {
    console.log('--- ShoppingList useEffect triggered. ---');
    if (user) {
      console.log('--- User context is available, calling fetchList. ---');
      fetchList();
    } else {
      console.log('--- User context not available yet, waiting. ---');
    }
  }, [fetchList, user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (evt) => {
      const nextList = evt?.detail;
      if (nextList) {
        setList(nextList);
        setError('');
        return;
      }
      fetchList();
    };

    window.addEventListener('shoppingListUpdated', handler);
    return () => window.removeEventListener('shoppingListUpdated', handler);
  }, [fetchList]);

  const handleUpdate = async (id, updates) => {
    try {
      const updatedList = await updateIngredient(id, updates, getFreshIdToken);
      setList(updatedList);
    } catch (err) {
      console.error('Failed to update ingredient:', err);
      setError('Failed to update item. Please try again.');
    }
  };

  const handleOpenEditModal = (ingredient) => {
    setEditingIngredient(ingredient);
    setIsEditModalOpen(true);
  };

  const handleSaveIngredient = async (updatedIngredient) => {
    await handleUpdate(updatedIngredient._id, {
      name: updatedIngredient.name,
      amount: updatedIngredient.amount,
      unit: updatedIngredient.unit,
    });
    setIsEditModalOpen(false);
    console.log('Ingredient updated successfully:', updatedIngredient);
  };

  const handleDelete = async (id) => {
    try {
      const updatedList = await deleteIngredient(id, getFreshIdToken);
      setList(updatedList);
      console.log('Ingredient deleted successfully:', updatedList);
    } catch (err) {
      console.error('Failed to delete ingredient:', err);
      setError('Failed to delete item. Please try again.');
    }
  };

  const handleClearChecked = async () => {
    const result = await Swal.fire({
      title: 'Remove checked items?',
      text: "This will permanently delete all checked items from your shopping list!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, remove them!',
      background: '#fff',
      customClass: {
        popup: 'z-50'
      }
    });

    if (result.isConfirmed) {
      try {
        const updatedList = await clearCheckedIngredients(getFreshIdToken);
        setList(updatedList);
        Swal.fire({
          title: 'Removed!',
          text: 'Checked items have been removed.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (err) {
        console.error('Failed to clear checked ingredients:', err);
        setError('Failed to clear checked items. Please try again.');
        Swal.fire({
          title: 'Error!',
          text: 'Failed to remove checked items. Please try again.',
          icon: 'error'
        });
      }
    }
  };

  const handleSelectAll = async () => {
    if (!list || !list.items) return;

    const originalList = list;
    const optimisticList = {
      ...list,
      items: list.items.map((item) => ({ ...item, checked: true })),
    };
    setList(optimisticList); // Optimistic update

    const updatePromises = originalList.items
      .filter((item) => !item.checked)
      .map((item) => updateIngredient(item._id, { checked: true }, getFreshIdToken));

    try {
      await Promise.all(updatePromises);
      // The optimistic update is sufficient, no need to re-fetch.
    } catch (err) {
      console.error('Failed to select all ingredients:', err);
      setError('Failed to select all items. Please try again.');
      setList(originalList); // Revert on failure
    }
  };

  const handleDeselectAll = async () => {
    if (!list || !list.items) return;

    const originalList = list;
    const optimisticList = {
      ...list,
      items: list.items.map((item) => ({ ...item, checked: false })),
    };
    setList(optimisticList); // Optimistic update

    const updatePromises = originalList.items
      .filter((item) => item.checked)
      .map((item) => updateIngredient(item._id, { checked: false }, getFreshIdToken));

    try {
      await Promise.all(updatePromises);
      // The optimistic update is sufficient, no need to re-fetch.
    } catch (err) {
      console.error('Failed to deselect all ingredients:', err);
      setError('Failed to deselect all items. Please try again.');
      setList(originalList); // Revert on failure
    }
  };

  const handleAddIngredient = async (ingredient) => {
    try {
      const updatedList = await addIngredients([ingredient], getFreshIdToken);
      setList(updatedList);
      console.log('Ingredient added successfully:', updatedList);
    } catch (err) {
      console.error('Failed to add ingredient:', err);
      setError('Failed to add item. Please try again.');
    }
  };

  const handleAddIngredientsFromRecipe = async (ingredients) => {
    try {
      const updatedList = await addIngredients(ingredients, getFreshIdToken);
      setList(updatedList);
      console.log('Ingredients from recipe added successfully:', updatedList);
    } catch (err) {
      console.error('Failed to add ingredients from recipe:', err);
      setError('Failed to add items. Please try again.');
    }
  };
  if (loading) return <div className="flex justify-center items-center h-screen"><CircularProgress /></div>;
  if (error) return (
    <div className="text-red-500 text-center mt-10">
      <p className="font-semibold">Error loading shopping list</p>
      <p className="break-all text-sm">{error.toString()}</p>
      <p className="text-xs mt-2 text-gray-500">If you see “Load failed” on mobile, ensure your API base URL is reachable from your phone.</p>
    </div>
  );

  return (
    <div className="container mx-auto py-4" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)' }}>
      <h1 className="text-2xl font-bold px-4 mb-4">My Shopping List</h1>
      
      {/* Scrollable list container */}
      <div className={`bg-white shadow-md rounded-lg p-6 overflow-y-auto mb-4 ${list && list.items.length > 0 ? 'flex-1' : ''}`}>
        <div>
          {list && list.items.length > 0 ? (
            list.items.map((item) => (
              <IngredientRow
                key={item._id}
                item={item}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onEdit={handleOpenEditModal}
              />
            ))
          ) : (
            <p>Your shopping list is empty.</p>
          )}
        </div>
      </div>
      
      {/* Fixed button layout at bottom */}
      <div className="p-4">
        <ButtonLayoutOption4
          handleSelectAll={handleSelectAll}
          handleDeselectAll={handleDeselectAll}
          handleClearChecked={handleClearChecked}
          setIsAddModalOpen={setIsAddModalOpen}
          setIsAddFromRecipeModalOpen={setIsAddFromRecipeModalOpen}
          list={list}
        />
      </div>
      <AddIngredientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddIngredient}
      />
      <AddFromRecipeModal
        isOpen={isAddFromRecipeModalOpen}
        onClose={() => setIsAddFromRecipeModalOpen(false)}
        onAdd={handleAddIngredientsFromRecipe}
        getFreshIdToken={getFreshIdToken}
      />
      <EditIngredientModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveIngredient}
        ingredient={editingIngredient}
      />
      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        title={upgradeModalContent.title}
        message={upgradeModalContent.message}
      />
    </div>
  );
};

export default ShoppingList;
