import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Accordion, AccordionDetails, AccordionSummary, List, ListItem, Card, CardActions, CardContent, CardMedia, Typography, Box, Button, CircularProgress, Chip, Divider, Stack, ListItemText, Rating, Checkbox, Grid, Snackbar, Alert, Switch, FormControlLabel, Tooltip, IconButton, TextField
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Link, useNavigate, useLocation } from 'react-router';
import { useUser } from '../../../context/UserContext';
import { useQueryInvalidation } from '../../../hooks/useUserQueries';
import { useSavedRecipesQuery } from '../../../hooks/useRecipeQueries';
import { saveRecipeById, unsaveRecipeById, createRecipe, setRecipeVisibility, updateRecipeIngredients, updateRecipeSteps, duplicateRecipe } from '../../../services/recipeService';
import { API_BASE_URL, MARKETING_BASE_URL } from '../../../env-config';
import { addIngredients } from '../../../services/shoppingListService';
import UpgradeModal from '../../Common/UpgradeModal';
import ConfirmActionModal from '../../Common/ConfirmActionModal';
import SignupModal_v2 from '../../Common/SignupModal_v2';
import { HttpError } from '../../../utils/http-errors';

// Default recipe image used when no custom image is uploaded
const defaultRecipeImage = 'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/Kay_Delivers_Recipe_Header_v2.jpeg';

import { Favorite, FavoriteBorder } from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import RecipeCardMenu from './RecipeCardMenu';
import ManagePhotosModal from './ManagePhotosModal';
import UploadPhotoModal from './UploadPhotoModal';
import CopyRecipeModal from './CopyRecipeModal';

const RecipeCard = ({ recipe, showSaveButton = true, onUnsave, isPublic, onDataChange = () => { } }) => {
  const { user, getFreshIdToken } = useUser();
  // TanStack Query: Use cached recipe data that auto-updates on invalidation
  const { savedRecipes, isLoading: recipesLoading } = useSavedRecipesQuery();
  const { invalidateAllRecipes } = useQueryInvalidation();
  const navigate = useNavigate();
  const location = useLocation();

  const isOwner = Boolean(
    user &&
    recipe?.generatedBy &&
    String(recipe.generatedBy) === String(user._id)
  );

  // Helper function to get the recipe image - matches GeneratedRecipeSummaryCard logic
  const getRecipeImage = () => {
    return recipe.recipeImage?.thumbnail || defaultRecipeImage;
  };

  const [isSaving, setIsSaving] = useState(false);
  const [isAddingToList, setIsAddingToList] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [visibility, setVisibilityState] = useState(recipe?.visibility || 'private');
  const [userRating, setUserRating] = useState(0);
  const [error, setError] = useState(null);
  const [checkedIngredients, setCheckedIngredients] = useState({});
  const [checkedSteps, setCheckedSteps] = useState({});
  const [signupModalOpen, setSignupModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeModalContent, setUpgradeModalContent] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isManagePhotosModalOpen, setIsManagePhotosModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState('');
  const [isEditingIngredients, setIsEditingIngredients] = useState(false);
  const [editableIngredients, setEditableIngredients] = useState([]);
  const [isEditingSteps, setIsEditingSteps] = useState(false);
  const [editableSteps, setEditableSteps] = useState([]);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const metadataRefs = React.useRef({
    recipeTitle: null,
    recipeDescription: null,
    prepTime: null,
    cookTime: null,
    totalTime: null,
    recipeDiet: null,
    mealType: null,
    recipeYield: null
  });
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editableNotes, setEditableNotes] = useState('');
  const [currentNotes, setCurrentNotes] = useState(recipe.notes || '');
  const [recipeImage, setRecipeImage] = useState(getRecipeImage());
  const [recipeId, setRecipeId] = useState(recipe._id || null);
  const [recipeSlug, setRecipeSlug] = useState(recipe.slug || '');
  const [currentIngredients, setCurrentIngredients] = useState(recipe.ingredients || []);
  const [currentSteps, setCurrentSteps] = useState(recipe.steps || []);
  const [currentMetadata, setCurrentMetadata] = useState({
    recipeTitle: recipe.recipeTitle || '',
    recipeDescription: recipe.recipeDescription || '',
    prepTime: recipe.prepTime || '',
    cookTime: recipe.cookTime || '',
    totalTime: recipe.totalTime || '',
    recipeDiet: recipe.recipeDiet || '',
    mealType: recipe.mealType || '',
    recipeYield: recipe.recipeYield || ''
  });

  useEffect(() => {
    setModalImageUrl(getRecipeImage());
  }, [recipe.recipeImage?.thumbnail]);

  useEffect(() => {
    setRecipeSlug(recipe?.slug || '');
  }, [recipe?.slug]);

  // Helper to ensure content is a string
  const renderContent = (content) => {
    if (Array.isArray(content)) {
      return content.join('\n');
    }
    return content || '';
  };

  useEffect(() => {
    if (!recipe || !Array.isArray(savedRecipes)) {
      setIsSaved(false);
      return;
    }

    const recipeId = recipe?._id ? String(recipe._id) : null;
    const savedVersion = savedRecipes.find((r) => {
      const savedId = r?._id ? String(r._id) : null;
      if (recipeId && savedId) return savedId === recipeId;
      return r?.recipeTitle === recipe?.recipeTitle;
    });

    setIsSaved(Boolean(savedVersion));

    if (savedVersion) {
      const currentUserRating = savedVersion.ratings?.find((r) => String(r.user) === String(user?._id));
      if (currentUserRating) {
        setUserRating(currentUserRating.rating);
      }
    }
  }, [recipe, savedRecipes, user]);

  const handleIngredientCheck = (index) => {
    setCheckedIngredients(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleStepCheck = (index) => {
    setCheckedSteps(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleRatingChange = async (event, newValue) => {
    if (!user) {
      setSnackbar({ open: true, message: 'You must be logged in to rate a recipe.', severity: 'error' });
      return;
    }

    const originalRating = userRating;
    setUserRating(newValue); // Optimistic UI update

    try {
      const id = await ensureRecipeSaved();
      const response = await saveRecipeById(id, getFreshIdToken, newValue);
      if (response.success) {
        invalidateAllRecipes(); // TanStack Query: trigger refetch of recipe lists
        setSnackbar({ open: true, message: 'Rating saved successfully!', severity: 'success' });
      } else {
        throw new Error(response.message || 'Failed to save rating.');
      }
    } catch (error) {
      console.error('Error saving rating:', error);
      setUserRating(originalRating); // Revert on failure
      setSnackbar({ open: true, message: error.message || 'An error occurred.', severity: 'error' });
    }
  };

  const handleToggleSave = async () => {
    if (!user) {
      setSignupModalOpen(true);
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const id = await ensureRecipeSaved();
      if (isSaved) {
        await unsaveRecipeById(id, getFreshIdToken);
        if (onUnsave) onUnsave();
        setIsSaved(false);
        setSnackbar({ open: true, message: 'Recipe unsaved!', severity: 'success' });
      } else {
        const response = await saveRecipeById(id, getFreshIdToken, userRating);
        if (response.success) {
          invalidateAllRecipes(); // TanStack Query: trigger refetch of recipe lists
          setIsSaved(true);
          setSnackbar({ open: true, message: 'Recipe saved!', severity: 'success' });
        } else {
          throw new Error(response.message || 'Failed to save recipe.');
        }
      }
    } catch (err) {
      if (err instanceof HttpError && err.status === 403) {
        setUpgradeModalContent({
          title: 'Recipe Limit Reached',
          message: 'You have reached the maximum number of saved recipes for the Basic plan.',
        });
        setUpgradeModalOpen(true);
      } else {
        setError(err.message || 'Could not update recipe.');
      }
      setSnackbar({ open: true, message: err.message || 'Failed to save recipe.', severity: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddIngredientsToList = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setIsAddingToList(true);
    setError(null);
    try {
      await addIngredients(recipe.ingredients, getFreshIdToken);
      navigate('/shopping-list');
    } catch (err) {
      if (err instanceof HttpError && err.status === 403) {
        setUpgradeModalContent({
          title: 'Shopping List Limit Reached',
          message: 'You have reached the maximum number of items in your shopping list for the Basic plan.',
        });
        setUpgradeModalOpen(true);
      } else {
        setError(err.message || 'Could not add ingredients to list.');
      }
      setSnackbar({ open: true, message: err.message || 'Failed to add ingredients to list.', severity: 'error' });
    } finally {
      setIsAddingToList(false);
    }
  };

  const handleVisibilityChange = async (newVisibility) => {
    try {
      const id = await ensureRecipeSaved(); // Ensure we have a recipe ID
      const response = await setRecipeVisibility(id, newVisibility, getFreshIdToken);
      if (response.success) {
        setVisibilityState(response.data.visibility);
        if (response.data?.slug) {
          setRecipeSlug(response.data.slug);
        }
        invalidateAllRecipes(); // TanStack Query: sync changes to other views
        setSnackbar({ open: true, message: response.message, severity: 'success' });
      }
    } catch (err) {
      console.error('Failed to update visibility:', err);
      setSnackbar({ open: true, message: err.message || 'Failed to update visibility.', severity: 'error' });
    }
  };

  const handleCopyUrl = () => {
    // For public/unlisted recipes, we need the slug to copy the URL
    if (visibility !== 'private') {
      if (!recipeSlug) {
        setSnackbar({ open: true, message: 'Recipe URL not available yet. Please try again.', severity: 'error' });
        return;
      }
      const baseUrl = MARKETING_BASE_URL || 'https://meadowmentor.com';
      const recipeUrl = `${baseUrl}/recipes/${recipeSlug}`;
      navigator.clipboard.writeText(recipeUrl);
      setSnackbar({ open: true, message: 'Recipe URL copied to clipboard!', severity: 'success' });
    } else {
      // For private recipes, we need the ID to make the API call
      if (!recipeId && !recipe._id) {
        setSnackbar({ open: true, message: 'Cannot share an unsaved recipe.', severity: 'error' });
        return;
      }
      setIsConfirmModalOpen(true);
    }
  };

  const handleConfirmMakePublicAndCopy = async () => {
    setIsConfirmModalOpen(false);
    try {
      const id = await ensureRecipeSaved();
      // Set visibility to 'unlisted' so the link works but it's not publicly browsable
      const response = await setRecipeVisibility(id, 'unlisted', getFreshIdToken);
      if (response.success) {
        setVisibilityState(response.data.visibility);
        if (response.data?.slug) {
          setRecipeSlug(response.data.slug);
        }
        setSnackbar({ open: true, message: response.message, severity: 'success' });

        const nextSlug = response.data?.slug || recipeSlug;
        setTimeout(() => {
          const baseUrl = MARKETING_BASE_URL || 'https://meadowmentor.com';
          const recipeUrl = `${baseUrl}/recipes/${nextSlug}`;
          navigator.clipboard.writeText(recipeUrl);
          setSnackbar({ open: true, message: 'Recipe URL copied to clipboard!', severity: 'info' });
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to make recipe shareable:', err);
      setSnackbar({ open: true, message: err.message || 'Failed to update status.', severity: 'error' });
    }
  };

  // Ensure the recipe exists in DB; if not, create it and return the new ID
  const ensureRecipeSaved = async () => {
    if (recipeId) return recipeId;
    try {
      const saved = await createRecipe(recipe, getFreshIdToken);
      // Backend returns { success, message, data: { ...recipe } }
      const newId = saved?.data?._id;
      if (!newId) {
        throw new Error('createRecipe response missing data._id');
      }
      // mutate local recipe object so future calls have _id
      setRecipeId(newId);
      return newId;
    } catch (err) {
      console.error('Failed to create recipe before saving/rating:', err);
      throw err;
    }
  };

  const handleManagePhotos = () => {
    setIsManagePhotosModalOpen(true);
  };

  const handleUploadPhoto = () => {
    setIsUploadModalOpen(true);
  };

  const handleImageChange = (newImages) => {
    // This function is called when images are changed (e.g., deleted) in the modal.
    invalidateAllRecipes(); // TanStack Query: sync changes to other views
    if (onDataChange) {
      onDataChange(); // Trigger a refetch in the parent component.
    }
  };

  const handleUploadSuccess = (newImages) => {
    setIsUploadModalOpen(false);
    invalidateAllRecipes(); // TanStack Query: sync changes to other views
    setTimeout(() => {
      setSnackbar({ open: true, message: 'Photo uploaded successfully!', severity: 'success' });
    }, 0);
    if (onDataChange) {
      onDataChange();
    }
  };

  const handleUploadError = (errorMessage) => {
    setIsUploadModalOpen(false);
    setTimeout(() => {
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }, 0);
  };

  const handleCoverSet = (newCoverUrl) => {
    // This function will be called when a new cover is set in the modal
    setRecipeImage(newCoverUrl); // Update the image on the card
    invalidateAllRecipes(); // TanStack Query: sync changes to other views
    if (onDataChange) {
      onDataChange();
    }
  };

  const handleEditIngredientsClick = () => {
    if (isEditingIngredients) {
      setIsEditingIngredients(false);
    } else {
      setEditableIngredients(JSON.parse(JSON.stringify(currentIngredients)));
      setIsEditingIngredients(true);
    }
  };

  const handleIngredientChange = useCallback((index, field, value) => {
    setEditableIngredients(prevIngredients => {
      const newIngredients = [...prevIngredients];
      const target = newIngredients[index] || {};
      newIngredients[index] = { ...target, [field]: value };
      return newIngredients;
    });
  }, [setEditableIngredients]);

  const handleEditStepsClick = () => {
    if (isEditingSteps) {
      setIsEditingSteps(false);
    } else {
      setEditableSteps(JSON.parse(JSON.stringify(currentSteps)));
      setIsEditingSteps(true);
    }
  };

  const handleStepChange = useCallback((index, value) => {
    setEditableSteps(prevSteps => {
      const newSteps = [...prevSteps];
      newSteps[index] = value;
      return newSteps;
    });
  }, [setEditableSteps]);

  const handleSaveIngredients = async () => {
    // Ensure last focused field commits its onBlur before saving
    if (typeof document !== 'undefined' && document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    console.log('Updated Ingredients:', editableIngredients);

    try {
      const id = await ensureRecipeSaved();
      const response = await updateRecipeIngredients(id, editableIngredients, getFreshIdToken);

      if (response.success) {
        setCurrentIngredients(editableIngredients);
        invalidateAllRecipes(); // TanStack Query: sync changes to other views
        setSnackbar({ open: true, message: 'Ingredients updated successfully!', severity: 'success' });
      } else {
        throw new Error(response.message || 'Failed to update ingredients.');
      }
    } catch (err) {
      console.error('Failed to update ingredients:', err);
      setSnackbar({ open: true, message: err.message || 'Failed to update ingredients.', severity: 'error' });
    } finally {
      setIsEditingIngredients(false);
    }
  };

  const handleSaveSteps = async () => {

    // Ensure last focused field commits its onBlur before saving
    if (typeof document !== 'undefined' && document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    console.log('Updated Steps:', editableSteps);

    try {
      const id = await ensureRecipeSaved();
      const response = await updateRecipeSteps(id, editableSteps, getFreshIdToken);

      if (response.success) {
        setCurrentSteps(editableSteps);
        invalidateAllRecipes(); // TanStack Query: sync changes to other views
        setSnackbar({ open: true, message: 'Steps updated successfully!', severity: 'success' });
      } else {
        throw new Error(response.message || 'Failed to update steps.');
      }
    } catch (err) {
      console.error('Failed to update steps:', err);
      setSnackbar({ open: true, message: err.message || 'Failed to update steps.', severity: 'error' });
    } finally {
      setIsEditingSteps(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingIngredients(false);
  };

  const handleCancelEditSteps = () => {
    setIsEditingSteps(false);
  };

  const handleCopyRecipe = () => {
    setIsCopyModalOpen(true);
  };

  const handleCopyAndStay = async (newTitle) => {
    try {
      const id = await ensureRecipeSaved();
      const response = await duplicateRecipe(id, newTitle, getFreshIdToken);

      if (response.success) {
        setIsCopyModalOpen(false);
        setSnackbar({ open: true, message: 'Recipe copied successfully!', severity: 'success' });
        // TanStack Query: invalidate to refetch fresh recipe lists
        invalidateAllRecipes();
        if (onDataChange) {
          onDataChange();
        }
      } else {
        throw new Error(response.message || 'Failed to copy recipe.');
      }
    } catch (err) {
      console.error('Error copying recipe:', err);
      setSnackbar({ open: true, message: err.message || 'Failed to copy recipe.', severity: 'error' });
    }
  };

  const handleCopyAndNavigate = async (newTitle) => {
    try {
      const id = await ensureRecipeSaved();
      const response = await duplicateRecipe(id, newTitle, getFreshIdToken);

      if (response.success && response.data) {
        setIsCopyModalOpen(false);
        setSnackbar({ open: true, message: 'Recipe copied successfully! Navigating...', severity: 'success' });
        // TanStack Query: invalidate to refetch fresh recipe lists
        invalidateAllRecipes();

        // Navigate to the new recipe using its slug or ID
        setTimeout(() => {
          if (response.data.slug) {
            navigate(`/my-recipes/${response.data.slug}`);
          } else if (response.data._id) {
            navigate(`/my-recipes/${response.data._id}`);
          }
        }, 1000);
      } else {
        throw new Error(response.message || 'Failed to copy recipe.');
      }
    } catch (err) {
      console.error('Error copying recipe:', err);
      setSnackbar({ open: true, message: err.message || 'Failed to copy recipe.', severity: 'error' });
    }
  };

  const handleBulkAddIngredients = async () => {
    if (!user) {
      setSignupModalOpen(true);
      return;
    }
    if (!currentIngredients || currentIngredients.length === 0) {
      setSnackbar({ open: true, message: 'No ingredients to add.', severity: 'info' });
      return;
    }

    // Get selected ingredient indices
    const selectedIndices = Object.keys(checkedIngredients)
      .filter(index => checkedIngredients[index])
      .map(index => parseInt(index));

    // If no ingredients are selected, add all; otherwise add only selected
    const ingredientsToAdd = selectedIndices.length > 0
      ? selectedIndices.map(index => currentIngredients[index])
      : currentIngredients;

    try {
      await addIngredients(ingredientsToAdd, getFreshIdToken);
      const message = selectedIndices.length > 0
        ? `${selectedIndices.length} ingredient${selectedIndices.length > 1 ? 's' : ''} added to your shopping list!`
        : 'All ingredients added to your shopping list!';
      setSnackbar({ open: true, message, severity: 'success' });
    } catch (err) {
      if (err instanceof HttpError && err.status === 403) {
        setUpgradeModalContent({
          title: 'Shopping List Limit Reached',
          message: 'You have reached the maximum number of items in your shopping list for the Basic plan.',
        });
        setUpgradeModalOpen(true);
      } else {
        setSnackbar({ open: true, message: err.message || 'Could not add ingredients to list.', severity: 'error' });
      }
    }
  };

  const handleAddIngredient = () => {
    setEditableIngredients(prev => [
      ...prev,
      { name: '', amount: '', unit: '', notes: '' }
    ]);
  };

  const handleAddStep = () => {
    setEditableSteps(prev => [
      ...prev,
      ''
    ]);
  };

  const handleDeleteIngredient = (index) => {
    setEditableIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteStep = (index) => {
    setEditableSteps(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditMetadataClick = () => {
    setIsEditingMetadata(!isEditingMetadata);
  };

  // Metadata fields now use refs, no onChange handler needed

  const handleSaveMetadata = async () => {
    // Get values from refs
    const metadataValues = {
      recipeTitle: metadataRefs.current.recipeTitle?.value,
      recipeDescription: metadataRefs.current.recipeDescription?.value,
      prepTime: metadataRefs.current.prepTime?.value,
      cookTime: metadataRefs.current.cookTime?.value,
      totalTime: metadataRefs.current.totalTime?.value,
      recipeDiet: metadataRefs.current.recipeDiet?.value,
      mealType: metadataRefs.current.mealType?.value,
      recipeYield: metadataRefs.current.recipeYield?.value
    };

    console.log('Updated Metadata:', metadataValues);

    try {
      const id = await ensureRecipeSaved();
      const response = await fetch(`${API_BASE_URL}/api/recipes/${id}/metadata`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getFreshIdToken()}`,
        },
        body: JSON.stringify(metadataValues),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update metadata');
      }

      const data = await response.json();
      if (data.success) {
        setCurrentMetadata(metadataValues);
        invalidateAllRecipes(); // TanStack Query: sync changes to other views
        setSnackbar({ open: true, message: 'Recipe details updated successfully!', severity: 'success' });
      } else {
        throw new Error(data.message || 'Failed to update metadata.');
      }
    } catch (err) {
      console.error('Failed to update metadata:', err);
      setSnackbar({ open: true, message: err.message || 'Failed to update recipe details.', severity: 'error' });
    } finally {
      setIsEditingMetadata(false);
    }
  };

  const handleCancelMetadataEdit = () => {
    setIsEditingMetadata(false);
  };

  const handleEditNotesClick = () => {
    if (isEditingNotes) {
      setIsEditingNotes(false);
    } else {
      setEditableNotes(currentNotes);
      setIsEditingNotes(true);
    }
  };

  const notesRef = React.useRef(null);

  const handleSaveNotes = async () => {
    const notesValue = notesRef.current?.value || '';
    console.log('Updated Notes:', notesValue);

    try {
      const id = await ensureRecipeSaved();
      const response = await fetch(`${API_BASE_URL}/api/recipes/${id}/notes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getFreshIdToken()}`,
        },
        body: JSON.stringify({ notes: notesValue }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update notes');
      }

      const data = await response.json();
      if (data.success) {
        setCurrentNotes(notesValue);
        invalidateAllRecipes(); // TanStack Query: sync changes to other views
        setSnackbar({ open: true, message: 'Notes updated successfully!', severity: 'success' });
      } else {
        throw new Error(data.message || 'Failed to update notes.');
      }
    } catch (err) {
      console.error('Failed to update notes:', err);
      setSnackbar({ open: true, message: err.message || 'Failed to update notes.', severity: 'error' });
    } finally {
      setIsEditingNotes(false);
    }
  };

  const handleCancelNotesEdit = () => {
    setIsEditingNotes(false);
  };

  const handleMoveIngredientUp = (index) => {
    if (index === 0) return; // Already at the top
    setEditableIngredients(prev => {
      const newArray = [...prev];
      [newArray[index - 1], newArray[index]] = [newArray[index], newArray[index - 1]];
      return newArray;
    });
  };

  const handleMoveIngredientDown = (index) => {
    setEditableIngredients(prev => {
      if (index === prev.length - 1) return prev; // Already at the bottom
      const newArray = [...prev];
      [newArray[index], newArray[index + 1]] = [newArray[index + 1], newArray[index]];
      return newArray;
    });
  };

  const handleMoveStepUp = (index) => {
    if (index === 0) return; // Already at the top
    setEditableSteps(prev => {
      const newArray = [...prev];
      [newArray[index - 1], newArray[index]] = [newArray[index], newArray[index - 1]];
      return newArray;
    });
  };

  const handleMoveStepDown = (index) => {
    setEditableSteps(prev => {
      if (index === prev.length - 1) return prev; // Already at the bottom
      const newArray = [...prev];
      [newArray[index], newArray[index + 1]] = [newArray[index + 1], newArray[index]];
      return newArray;
    });
  };

  const IngredientRow = React.memo(function IngredientRow({ item, index, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
    return (
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-start' }}>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column' }}>
          <Tooltip title="Move up" placement="left">
            <span>
              <IconButton
                onClick={() => onMoveUp(index)}
                disabled={isFirst}
                sx={{
                  color: 'primary.main',
                  '&:hover': { backgroundColor: 'primary.light' },
                  '&:disabled': { color: 'action.disabled' }
                }}
                size="small"
              >
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Move down" placement="left">
            <span>
              <IconButton
                onClick={() => onMoveDown(index)}
                disabled={isLast}
                sx={{
                  color: 'primary.main',
                  '&:hover': { backgroundColor: 'primary.light' },
                  '&:disabled': { color: 'action.disabled' }
                }}
                size="small"
              >
                <ArrowDownwardIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        <Stack spacing={1.5} sx={{ backgroundColor: '#FFF', p: 2, borderRadius: 2, flex: 1 }}>
          <TextField
            label="Name"
            variant="outlined"
            size="large"
            fullWidth
            defaultValue={item.name}
            onBlur={(e) => onChange(index, 'name', e.target.value)}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="Amount"
              variant="outlined"
              size="small"
              sx={{ flex: 1 }}
              defaultValue={item.amount}
              onBlur={(e) => onChange(index, 'amount', e.target.value)}
            />
            <TextField
              label="Unit"
              variant="outlined"
              size="small"
              sx={{ flex: 1 }}
              defaultValue={item.unit || ''}
              onBlur={(e) => onChange(index, 'unit', e.target.value)}
            />
          </Box>
          <TextField
            label="Notes"
            variant="outlined"
            size="small"
            fullWidth
            defaultValue={item.notes || ''}
            onBlur={(e) => onChange(index, 'notes', e.target.value)}
          />
        </Stack>
        <Box sx={{ pt: 2 }}>
          <Tooltip title="Delete ingredient" placement="right">
            <IconButton
              onClick={() => onDelete(index)}
              sx={{
                color: 'error.main',
                '&:hover': { backgroundColor: 'error.light', color: 'white' }
              }}
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    );
  });

  // Compute tooltip text based on selected ingredients
  const shoppingListTooltip = useMemo(() => {
    const selectedCount = Object.values(checkedIngredients).filter(Boolean).length;
    if (selectedCount === 0) {
      return 'Add all ingredients to shopping list';
    }
    return `Add ${selectedCount} item${selectedCount > 1 ? 's' : ''} to shopping list`;
  }, [checkedIngredients]);

  const StepRow = React.memo(function StepRow({ item, index, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
    return (
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-start' }}>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column' }}>
          <Tooltip title="Move up" placement="left">
            <span>
              <IconButton
                onClick={() => onMoveUp(index)}
                disabled={isFirst}
                sx={{
                  color: 'primary.main',
                  '&:hover': { backgroundColor: 'primary.light' },
                  '&:disabled': { color: 'action.disabled' }
                }}
                size="small"
              >
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Move down" placement="left">
            <span>
              <IconButton
                onClick={() => onMoveDown(index)}
                disabled={isLast}
                sx={{
                  color: 'primary.main',
                  '&:hover': { backgroundColor: 'primary.light' },
                  '&:disabled': { color: 'action.disabled' }
                }}
                size="small"
              >
                <ArrowDownwardIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        <Stack spacing={1.5} sx={{ backgroundColor: '#FFF', p: 2, borderRadius: 2, flex: 1 }}>
          <TextField
            label={`Step ${index + 1}`}
            variant="outlined"
            size="large"
            fullWidth
            multiline
            defaultValue={item}
            onBlur={(e) => onChange(index, e.target.value)}
          />
        </Stack>
        <Box sx={{ pt: 2 }}>
          <Tooltip title="Delete step" placement="right">
            <IconButton
              onClick={() => onDelete(index)}
              sx={{
                color: 'error.main',
                '&:hover': { backgroundColor: 'error.light', color: 'white' }
              }}
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    );
  });
  return (
    <>
      <Card sx={{
        maxWidth: { xs: '100%', sm: '600px' },
        margin: { xs: 0, sm: 'auto' },
        mt: { xs: 0, sm: 4 },
        mb: { xs: 0, sm: 4 },
        borderRadius: '16px',
        backgroundColor: '#FFF7E6', // Light peach background
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
      }}>
        <Box sx={{ position: 'relative' }}>
          <CardMedia
            component="img"
            height="300"
            image={recipeImage}
            alt={recipe.recipeTitle}
          />
          {user && isOwner && (
            <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
              <RecipeCardMenu
                onUploadPhoto={handleUploadPhoto}
                onManagePhotos={handleManagePhotos}
                onToggleSave={handleToggleSave}
                isSaved={isSaved}
                onVisibilityChange={handleVisibilityChange}
                visibility={visibility}
                onCopyUrl={handleCopyUrl}
                onCopyRecipe={handleCopyRecipe}
                showFullMenu={true}
              />
            </Box>
          )}
          {user && !isOwner && isSaved && recipe?._id && (
            <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
              <RecipeCardMenu
                onCopyRecipe={handleCopyRecipe}
                visibility={visibility}
                showFullMenu={false}
              />
            </Box>
          )}
        </Box>

        <CardContent sx={{ xs: { p: 1 }, sm: { p: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1, position: 'relative' }}>
            {isEditingMetadata ? (
              <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', textAlign: 'center', flex: 1 }}>
                Edit Recipe Details
              </Typography>
            ) : (
              <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold', textAlign: 'center', flex: 1 }}>
                {currentMetadata.recipeTitle}
              </Typography>
            )}
            {user && recipe.generatedBy === user._id && (
              <Tooltip title={isEditingMetadata ? "Close" : "Edit recipe details"}>
                <IconButton size="medium" onClick={handleEditMetadataClick} color="primary" sx={{ position: 'absolute', right: 0 }}>
                  {isEditingMetadata ? <CloseIcon /> : <EditIcon />}
                </IconButton>
              </Tooltip>
            )}
          </Box>
          {!isEditingMetadata && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Rating
                name="recipe-rating"
                value={user ? userRating : recipe.averageRating || 0}
                onChange={handleRatingChange}
                readOnly={!user}
                sx={{ mb: 2 }}
              />
            </Box>
          )}

          {isEditingMetadata ? (
            <Box component="form" noValidate autoComplete="off" sx={{ width: '100%', mb: 2 }}>
              <Stack spacing={2}>
                <TextField
                  label="Recipe Title"
                  variant="outlined"
                  fullWidth
                  inputRef={(el) => (metadataRefs.current.recipeTitle = el)}
                  defaultValue={currentMetadata.recipeTitle || ''}
                />
                <TextField
                  label="Description"
                  variant="outlined"
                  fullWidth
                  multiline
                  rows={3}
                  inputRef={(el) => (metadataRefs.current.recipeDescription = el)}
                  defaultValue={currentMetadata.recipeDescription || ''}
                />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Prep Time"
                      variant="outlined"
                      fullWidth
                      inputRef={(el) => (metadataRefs.current.prepTime = el)}
                      defaultValue={currentMetadata.prepTime || ''}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Cook Time"
                      variant="outlined"
                      fullWidth
                      inputRef={(el) => (metadataRefs.current.cookTime = el)}
                      defaultValue={currentMetadata.cookTime || ''}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Total Time"
                      variant="outlined"
                      fullWidth
                      inputRef={(el) => (metadataRefs.current.totalTime = el)}
                      defaultValue={currentMetadata.totalTime || ''}
                    />
                  </Grid>
                </Grid>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Diet"
                      variant="outlined"
                      fullWidth
                      inputRef={(el) => (metadataRefs.current.recipeDiet = el)}
                      defaultValue={currentMetadata.recipeDiet || ''}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Meal Type"
                      variant="outlined"
                      fullWidth
                      inputRef={(el) => (metadataRefs.current.mealType = el)}
                      defaultValue={currentMetadata.mealType || ''}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Yield"
                      variant="outlined"
                      fullWidth
                      inputRef={(el) => (metadataRefs.current.recipeYield = el)}
                      defaultValue={currentMetadata.recipeYield || ''}
                    />
                  </Grid>
                </Grid>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button variant="outlined" onClick={handleCancelMetadataEdit}>Cancel</Button>
                  <Button variant="contained" onClick={handleSaveMetadata}>Save</Button>
                </Box>
              </Stack>
            </Box>
          ) : (
            <>
              <Typography variant="body1" sx={{ mb: 3, fontStyle: 'italic', textAlign: 'center' }}>
                {renderContent(currentMetadata.recipeDescription)}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2} sx={{ textAlign: 'left', mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1"><strong>Prep Time:</strong> {currentMetadata.prepTime || 'N/A'}</Typography>
                  <Typography variant="body1"><strong>Cook Time:</strong> {currentMetadata.cookTime || 'N/A'}</Typography>
                  <Typography variant="body1"><strong>Total Time:</strong> {currentMetadata.totalTime || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1"><strong>Diet:</strong> {currentMetadata.recipeDiet || 'N/A'}</Typography>
                  <Typography variant="body1"><strong>Meal Type:</strong> {currentMetadata.mealType || 'N/A'}</Typography>
                  <Typography variant="body1"><strong>Yield:</strong> {currentMetadata.recipeYield || 'N/A'}</Typography>
                </Grid>
              </Grid>
            </>
          )}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Ingredients</Typography>
              {/* add a check if user generated the recipe before showing the edit button */}
              {user && recipe.generatedBy === user._id && (
                <Tooltip title={isEditingIngredients ? "Close" : "Edit ingredients"}>
                  <IconButton size="medium" sx={{ ml: 1 }} onClick={handleEditIngredientsClick} color="primary">
                    {isEditingIngredients ? <CloseIcon /> : <EditIcon />}
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Tooltip title={shoppingListTooltip}>
                <IconButton size="medium" onClick={handleBulkAddIngredients} color="primary">
                  <PlaylistAddIcon />
                </IconButton>
              </Tooltip>
              <Typography
                variant="button"
                sx={{ fontWeight: 'bold', paddingLeft: '4px' }}>
                Add to Shopping List
              </Typography>
            </Box>
          </Box>

          {isEditingIngredients ? (
            <Box component="form" noValidate autoComplete="off" sx={{ width: '100%' }}>
              <Stack spacing={3} sx={{ mb: 2 }}>
                {editableIngredients.map((item, index) => (
                  <IngredientRow
                    key={item._id || index}
                    item={item}
                    index={index}
                    onChange={handleIngredientChange}
                    onDelete={handleDeleteIngredient}
                    onMoveUp={handleMoveIngredientUp}
                    onMoveDown={handleMoveIngredientDown}
                    isFirst={index === 0}
                    isLast={index === editableIngredients.length - 1}
                  />
                ))}
              </Stack>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddIngredient}
                sx={{ mb: 2 }}
                variant="outlined"
                fullWidth
              >
                Add Ingredient
              </Button>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button variant="outlined" onClick={handleCancelEdit}>Cancel</Button>
                <Button variant="contained" onClick={handleSaveIngredients}>Save</Button>
              </Box>
            </Box>
          ) : (
            <List dense sx={{ mb: 2 }}>
              {currentIngredients?.map((item, index) => (
                <ListItem key={index} disablePadding>
                  <Checkbox
                    edge="start"
                    checked={checkedIngredients[index] || false}
                    onChange={() => handleIngredientCheck(index)}
                    sx={{ transform: 'scale(1.2)' }} // Makes the checkbox larger
                  />
                  <ListItemText
                    primary={renderContent(`${item.amount} ${item.unit || ''} ${item.name}`)}
                    secondary={item.notes ? `(${item.notes})` : null}
                    //sx={{ textDecoration: checkedIngredients[index] ? 'line-through' : 'none' }}

                    slotProps={{
                      primary: { style: { fontSize: '1.1rem', fontWeight: 'normal' } },
                      secondary: { style: { fontSize: '0.9rem', fontWeight: 'normal' } },
                    }}
                  />
                </ListItem>
              ))}
            </List>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Steps</Typography>
            {/* add a check if user generated the recipe before showing the edit button */}
            {user && recipe.generatedBy === user._id && (
              <Tooltip title={isEditingSteps ? "Close" : "Edit steps"}>
                <IconButton size="medium" sx={{ ml: 1 }} onClick={handleEditStepsClick} color="primary">
                  {isEditingSteps ? <CloseIcon /> : <EditIcon />}
                </IconButton>
              </Tooltip>
            )}
          </Box>
          {isEditingSteps ? (
            <Box component="form" noValidate autoComplete="off" sx={{ width: '100%' }}>
              <Stack spacing={3} sx={{ mb: 2 }}>
                {editableSteps.map((item, index) => (
                  <StepRow
                    key={index}
                    item={item}
                    index={index}
                    onChange={handleStepChange}
                    onDelete={handleDeleteStep}
                    onMoveUp={handleMoveStepUp}
                    onMoveDown={handleMoveStepDown}
                    isFirst={index === 0}
                    isLast={index === editableSteps.length - 1}
                  />
                ))}
              </Stack>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddStep}
                sx={{ mb: 2 }}
                variant="outlined"
                fullWidth
              >
                Add Step
              </Button>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button variant="outlined" onClick={handleCancelEditSteps}>Cancel</Button>
                <Button variant="contained" onClick={handleSaveSteps}>Save</Button>
              </Box>
            </Box>
          ) : (
            <List dense sx={{ mb: 2 }}>
              {currentSteps?.map((step, index) => (
                <ListItem key={index} alignItems="flex-start" sx={{ pl: 1 }}>
                  <Checkbox
                    edge="start"
                    checked={checkedSteps[index] || false}
                    onChange={() => handleStepCheck(index)}
                    sx={{ transform: 'scale(1.2)' }} // Makes the checkbox larger
                  />
                  <ListItemText
                    primary={renderContent(`${index + 1}. ${step}`)}
                    sx={{ textDecoration: checkedSteps[index] ? 'line-through' : 'none' }}
                    slotProps={{
                      primary: { style: { fontSize: '1.1rem', fontWeight: 'normal' } },
                    }}
                  />
                </ListItem>
              ))}
            </List>
          )}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Notes</Typography>
            {user && recipe.generatedBy === user._id && (
              <Tooltip title={isEditingNotes ? "Close" : "Edit notes"}>
                <IconButton size="medium" sx={{ ml: 1 }} onClick={handleEditNotesClick} color="primary">
                  {isEditingNotes ? <CloseIcon /> : <EditIcon />}
                </IconButton>
              </Tooltip>
            )}
          </Box>
          {isEditingNotes ? (
            <Box component="form" noValidate autoComplete="off" sx={{ width: '100%' }}>
              <TextField
                inputRef={notesRef}
                variant="outlined"
                fullWidth
                multiline
                rows={6}
                defaultValue={currentNotes}
                placeholder="Add your notes here..."
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button variant="outlined" onClick={handleCancelNotesEdit}>Cancel</Button>
                <Button variant="contained" onClick={handleSaveNotes}>Save</Button>
              </Box>
            </Box>
          ) : (
            <Typography variant="body1" sx={{ mb: 2, fontStyle: currentNotes ? 'normal' : 'italic', color: currentNotes ? 'text.primary' : 'text.secondary' }}>
              {currentNotes || 'No notes saved'}
            </Typography>
          )}
        </CardContent>

        <Divider />

        {!user ? (
          <CardActions sx={{ p: 2, display: 'flex', justifyContent: 'center', backgroundColor: 'white', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
            <Tooltip title={isSaved ? "Remove from your cookbook" : "Save to your free cookbook"} placement="top">
              <Button
                variant="contained"
                startIcon={isSaved ? <Favorite /> : <FavoriteBorder />}
                onClick={handleToggleSave}
                sx={{
                  maxWidth: '250px',
                  backgroundColor: isSaved ? 'primary.light' : 'primary.main',
                  '&:hover': { backgroundColor: isSaved ? 'grey.700' : 'primary.dark' },
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 'bold',
                }}
              >
                {isSaved ? 'Unsave Recipe' : 'Save Recipe'}
              </Button>
            </Tooltip>
          </CardActions>
        ) : (
          <CardActions sx={{ p: 2, display: 'flex', justifyContent: 'space-around', alignItems: 'center', backgroundColor: 'white', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
            <Tooltip title={isSaved ? "Remove from your cookbook" : "Save to your free cookbook"} placement="top">
              <Button
                variant="contained"
                onClick={handleToggleSave}
                disabled={isSaving}
                startIcon={isSaving ? <CircularProgress size={24} color="inherit" /> : (isSaved ? <Favorite /> : <FavoriteBorder />)}
                sx={{
                  maxWidth: '250px',
                  backgroundColor: isSaved ? 'primary.light' : 'primary.main',
                  '&:hover': { backgroundColor: isSaved ? 'grey.700' : 'primary.dark' },
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 'bold',
                }}
              >
                {isSaved ? 'Unsave Recipe' : 'Save Recipe'}
              </Button>
            </Tooltip>
          </CardActions>
        )}
        {error && <Typography color="error" variant="body2" sx={{ p: 2, textAlign: 'center' }}>{error}</Typography>}
      </Card>
      <ManagePhotosModal
        open={isManagePhotosModalOpen}
        onClose={() => setIsManagePhotosModalOpen(false)}
        recipeId={recipeId}
        currentCover={recipe.recipeImage?.thumbnail}
        onCoverSet={handleCoverSet}
        onImageChange={handleImageChange}
      />
      <UploadPhotoModal
        open={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        recipeId={recipeId}
        onUploadSuccess={handleUploadSuccess}
        onUploadError={handleUploadError}
      />
      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        title={upgradeModalContent.title}
        message={upgradeModalContent.message}
      />
      <ConfirmActionModal
        open={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmMakePublicAndCopy}
        title="Make Recipe Shareable?"
        message="This recipe is currently private. To share it, we'll make it accessible via link (unlisted). It won't appear in public listings. Do you want to proceed?"
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      <SignupModal_v2
        open={signupModalOpen}
        onClose={() => setSignupModalOpen(false)}
        recipeTitle={recipe.recipeTitle}
        onSignup={() => navigate('/signup', { state: { from: location.pathname } })}
        recipeImage={modalImageUrl}
      />
      <CopyRecipeModal
        open={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        onCopyAndStay={handleCopyAndStay}
        onCopyAndNavigate={handleCopyAndNavigate}
        originalTitle={recipe.recipeTitle}
      />
    </>
  );
};

export default RecipeCard;