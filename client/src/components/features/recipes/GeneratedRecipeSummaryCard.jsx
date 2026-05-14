/**
 * @file Defines the GeneratedRecipeSummaryCard component.
 * @description Renders a compact recipe summary card used in chat and recipe lists, including
 * interactive actions like saving, sharing, and image management.
 * @requires module:react
 * @requires module:prop-types
 * @requires module:@mui/material
 * @requires module:@mui/icons-material
 * @requires module:react-router
 * @author Cascade
 * @version 1.0.0
 * @date 2026-01-27
 */

// React/Third-Party Libraries
import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Card, CardMedia, CardContent, Box, Typography, Button, Chip, Rating, Tooltip, IconButton, CircularProgress, Snackbar, Alert } from '@mui/material';
import { Favorite as FavoriteIcon, FavoriteBorder as FavoriteBorderIcon, AccessTime as AccessTimeIcon, InfoOutlined as InfoIcon, WarningAmber as WarningIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router';

// Context & Hooks
import { useUser } from '../../../context/UserContext';
import { useQueryInvalidation } from '../../../hooks/useUserQueries';
import { useSavedRecipesQuery, useGeneratedRecipesQuery } from '../../../hooks/useRecipeQueries';

// Services
import { saveRecipeById, unsaveRecipeById, uploadRecipeImage, setRecipeVisibility, duplicateRecipe, generateRecipeImage } from '../../../services/recipeService';

// Internal Components
import UpgradeModal_v2 from '../../Common/UpgradeModal_v2';
import ManagePhotosModal from './ManagePhotosModal';
import RecipeCardMenu from './RecipeCardMenu';
import UploadPhotoModal from './UploadPhotoModal';
import ConfirmActionModal from '../../Common/ConfirmActionModal';
import CopyRecipeModal from './CopyRecipeModal';

// Utilities & Config
import { HttpError } from '../../../utils/http-errors';
import { MARKETING_BASE_URL } from '../../../env-config';

// Default recipe image used when no custom image is uploaded
const defaultRecipeImage = 'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/Kay_Delivers_Recipe_Header_v2.jpeg';

// Module-level Map to track which recipes are currently generating images.
// This persists across component remounts, solving the issue where loading state
// was lost when React remounted the component during context updates.
// Stores: { isGenerating: boolean, imageAtStart: string|null }
const generatingImagesMap = new Map();


/**
 * @component GeneratedRecipeSummaryCard
 * @description Displays a recipe preview card with rating, metadata chips, and actions.
 * @param {object} props - Component props.
 * @param {object} props.recipe - The recipe data to render.
 * @param {boolean} [props.showSaveButton=true] - Controls whether the save action is available.
 * @returns {JSX.Element} The rendered recipe summary card.
 */
const GeneratedRecipeSummaryCard = ({ recipe: initialRecipe, showSaveButton = true }) => {
  const navigate = useNavigate();
  const { user, getFreshIdToken } = useUser();
  // TanStack Query: Use cached recipe data that auto-updates on invalidation
  const { savedRecipes, savedRecipeIds } = useSavedRecipesQuery();
  const { generatedRecipes } = useGeneratedRecipesQuery();
  const { invalidateAllRecipes } = useQueryInvalidation();

  const capturePosthogEvent = useCallback((eventName, properties = {}) => {
    if (typeof window === 'undefined') return;
    if (!window.posthog || typeof window.posthog.capture !== 'function') return;

    window.posthog.capture(eventName, properties);
  }, []);

  // DEBUG: Log initial props on every render
  // console.log('[RecipeCard] RENDER - initialRecipe:', {
  //   _id: initialRecipe?._id,
  //   title: initialRecipe?.recipeTitle,
  //   shouldGenerateImage: initialRecipe?.shouldGenerateImage,
  //   hasImage: !!initialRecipe?.recipeImage?.thumbnail
  // });

  const [currentRecipe, setCurrentRecipe] = useState(initialRecipe);
  const [isSaving, setIsSaving] = useState(false);
  const [isRecipeSaved, setIsRecipeSaved] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeModalMessage, setUpgradeModalMessage] = useState('');
  const [modalImageUrl, setModalImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isManagePhotosModalOpen, setIsManagePhotosModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [visibility, setVisibility] = useState(initialRecipe?.visibility || 'private');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  // Initialize from module-level Map so generating state survives remounts
  const [isGeneratingImage, setIsGeneratingImage] = useState(() => {
    const mapData = initialRecipe?._id ? generatingImagesMap.get(initialRecipe._id) : null;
    return mapData?.isGenerating || false;
  });
  const fileInputRef = useRef(null);
  // Ref to capture shouldGenerateImage on initial mount - prevents hydration effect from overwriting it
  const initialShouldGenerateImageRef = useRef(initialRecipe?.shouldGenerateImage ?? false);
  // Ref to track the image URL when generation started - used to detect when a NEW image appears
  // Initialize from Map in case of remount during generation
  const imageAtGenerationStartRef = useRef(
    (() => {
      const mapData = initialRecipe?._id ? generatingImagesMap.get(initialRecipe._id) : null;
      return mapData?.imageAtStart || null;
    })()
  );

  // DEBUG: Log ref value on mount
  //console.log('[RecipeCard] REF VALUE on mount:', initialShouldGenerateImageRef.current);

  useEffect(() => {
    setVisibility(initialRecipe?.visibility || 'private');
  }, [initialRecipe?.visibility]);

  // Keep rating data in sync when the parent provides updated recipe data.
  useEffect(() => {
    if (!initialRecipe) {
      return;
    }

    setCurrentRecipe(prev => {
      if (!prev || prev._id !== initialRecipe._id) {
        return initialRecipe;
      }

      const nextRecipe = { ...prev };

      if (Object.prototype.hasOwnProperty.call(initialRecipe, 'averageRating')) {
        nextRecipe.averageRating = initialRecipe.averageRating;
      }

      if (Object.prototype.hasOwnProperty.call(initialRecipe, 'ratings')) {
        nextRecipe.ratings = initialRecipe.ratings;
      }

      return nextRecipe;
    });
  }, [initialRecipe?._id, initialRecipe?.averageRating, initialRecipe?.ratings]);

  useEffect(() => {
    const recipeId = currentRecipe?._id;
    const isSaved = recipeId && savedRecipeIds.has(recipeId);
    setIsRecipeSaved(isSaved);
  }, [savedRecipeIds, currentRecipe?._id]);

  // Hydrate currentRecipe with fresh data from TanStack Query cache.
  // This ensures that when loading chat history (which contains stale snapshots),
  // we display the latest recipe data including images and edits.
  useEffect(() => {
    const recipeId = initialRecipe?._id;
    if (!recipeId) return;

    // Look for fresh data in saved recipes first, then generated recipes
    const savedArr = Array.isArray(savedRecipes) ? savedRecipes : [];
    const generatedArr = Array.isArray(generatedRecipes) ? generatedRecipes : [];
    const freshRecipe = savedArr.find(r => r._id === recipeId) 
                     || generatedArr.find(r => r._id === recipeId);

    if (freshRecipe) {
      setCurrentRecipe(prev => {
        // Merge fresh data while preserving any local state changes
        // Fresh data takes priority for server-synced fields
        return {
          ...prev,
          ...freshRecipe,
        };
      });
    }
  }, [initialRecipe?._id, savedRecipes, generatedRecipes]);

  useEffect(() => {
    const imageSrc = getRecipeImage();
    // If the image is an imported module, it's an object with a 'src' property.
    // If it's a GCS link, it's a string.
    setModalImageUrl(typeof imageSrc === 'string' ? imageSrc : imageSrc.src);
  }, [currentRecipe.recipeImage?.thumbnail]);

  // Clear generating state when a NEW image appears (handles both new recipes and edits)
  useEffect(() => {
    const currentThumbnail = currentRecipe.recipeImage?.thumbnail;
    const imageAtStart = imageAtGenerationStartRef.current;

    // Only clear if:
    // 1. We're generating AND
    // 2. Either there's a new image (different from when we started) OR
    //    this is a new recipe (no image at start) and now has an image
    if (isGeneratingImage && currentThumbnail) {
      const imageChanged = imageAtStart !== currentThumbnail;
      const isNewRecipeWithImage = !imageAtStart && currentThumbnail;

      if (imageChanged || isNewRecipeWithImage) {
        //console.log('[RecipeCard] NEW image appeared, clearing generating state for:', currentRecipe._id);
        //console.log('[RecipeCard] Image changed from:', imageAtStart, 'to:', currentThumbnail);
        setIsGeneratingImage(false);
        imageAtGenerationStartRef.current = null;
        if (currentRecipe._id) {
          generatingImagesMap.delete(currentRecipe._id);
        }
      }
    }
  }, [currentRecipe.recipeImage?.thumbnail, isGeneratingImage, currentRecipe._id]);

  // Attempt to resolve historical cards (parsed from assistant text) to the saved DB recipe
  // so that _id and slug are available for full interactivity.
  useEffect(() => {
    //console.log('[RecipeCard] HYDRATION EFFECT running - initialRecipe._id:', initialRecipe?._id, 'generatedRecipes count:', generatedRecipes?.length);

    // If we have an ID (either initially or after hydration), try to get the freshest data from context
    if (initialRecipe?._id && Array.isArray(generatedRecipes)) {
      const match = generatedRecipes.find(r => r._id === initialRecipe._id);
      //console.log('[RecipeCard] HYDRATION - found match:', !!match, 'ref value:', initialShouldGenerateImageRef.current);
      if (match) {
        // IMPORTANT: Never pull 'shouldGenerateImage' from the global context.
        // This flag should only be respected when it comes from the initial props (direct AI response).
        // This prevents historical cards for the same recipe from re-triggering generation.
        const { shouldGenerateImage, ...freshData } = match;
        setCurrentRecipe(prev => ({
          ...prev,
          ...freshData,
          // Preserve the shouldGenerateImage flag using the ref captured on mount.
          // This ensures the loading state works for fresh recipes even when hydration runs.
          ...(initialShouldGenerateImageRef.current ? { shouldGenerateImage: true } : {})
        }));
      }
    }
    // Fallback: If no ID yet, try to match by title (for very fresh streams)
    else if (!initialRecipe?._id && initialRecipe?.recipeTitle && Array.isArray(generatedRecipes)) {
      const match = generatedRecipes.find(r => r.recipeTitle === initialRecipe.recipeTitle);
      //console.log('[RecipeCard] HYDRATION by title - found match:', !!match, 'ref value:', initialShouldGenerateImageRef.current);
      if (match) {
        const { shouldGenerateImage, ...freshData } = match;
        setCurrentRecipe(prev => ({
          ...prev,
          ...freshData,
          // Preserve the shouldGenerateImage flag using the ref captured on mount.
          // This ensures the loading state works for fresh recipes even when hydration runs.
          ...(initialShouldGenerateImageRef.current ? { shouldGenerateImage: true } : {})
        }));
      }
    }
  }, [initialRecipe?._id, initialRecipe?.recipeTitle, generatedRecipes]);

  // Auto-generate image for new recipes
  useEffect(() => {
    const triggerImageGeneration = async () => {
      // Check both current state AND the initial ref to handle race conditions
      const shouldGenerate = currentRecipe.shouldGenerateImage || initialShouldGenerateImageRef.current;
      // Also check the module-level Map to prevent duplicate generation from remounted instances
      const mapData = currentRecipe._id ? generatingImagesMap.get(currentRecipe._id) : null;
      const isAlreadyGenerating = mapData?.isGenerating || false;

      // console.log('[RecipeCard] IMAGE GEN EFFECT - checking conditions:', {
      //   'currentRecipe.shouldGenerateImage': currentRecipe.shouldGenerateImage,
      //   'ref.current': initialShouldGenerateImageRef.current,
      //   'shouldGenerate (combined)': shouldGenerate,
      //   'isGeneratingImage': isGeneratingImage,
      //   'isAlreadyGenerating (map)': isAlreadyGenerating,
      //   'currentRecipe._id': currentRecipe._id,
      //   'hasExistingImage': !!currentRecipe.recipeImage?.thumbnail
      // });

      if (
        shouldGenerate &&
        !isGeneratingImage &&
        !isAlreadyGenerating &&
        currentRecipe._id
      ) {
        //console.log('[RecipeCard] ✅ STARTING IMAGE GENERATION for:', currentRecipe._id);
        // Capture current image URL so we can detect when a NEW image appears
        const startingImage = currentRecipe.recipeImage?.thumbnail || null;
        imageAtGenerationStartRef.current = startingImage;
        // Update both local state and module-level Map (store object with imageAtStart)
        setIsGeneratingImage(true);
        generatingImagesMap.set(currentRecipe._id, { isGenerating: true, imageAtStart: startingImage });
        // Clear both the state flag and the ref to prevent re-triggering
        setCurrentRecipe(prev => ({ ...prev, shouldGenerateImage: false }));
        initialShouldGenerateImageRef.current = false;

        try {
          const response = await generateRecipeImage(currentRecipe._id, getFreshIdToken);
          //console.log('[RecipeCard] IMAGE GEN RESPONSE:', response.success ? 'SUCCESS' : 'FAILED');
          if (response.success && response.data) {
            // Update local state immediately
            setCurrentRecipe(prev => ({
              ...prev,
              recipeImage: response.data,
              shouldGenerateImage: false
            }));
            // TanStack Query: invalidate to refresh recipe lists with new image
            invalidateAllRecipes();
          }
        } catch (error) {
          //console.error("[RecipeCard] Failed to auto-generate image:", error);
        } finally {
          // Clear both local state and module-level Map
          setIsGeneratingImage(false);
          imageAtGenerationStartRef.current = null;
          if (currentRecipe._id) {
            generatingImagesMap.delete(currentRecipe._id);
          }
        }
      } else if (isAlreadyGenerating && !isGeneratingImage) {
        // Component remounted while generation is in progress - sync local state with Map
        //console.log('[RecipeCard] 🔄 Syncing isGeneratingImage from Map for:', currentRecipe._id);
        setIsGeneratingImage(true);
      } else {
        //console.log('[RecipeCard] ❌ NOT generating image - conditions not met');
      }
    };

    triggerImageGeneration();
  }, [currentRecipe.shouldGenerateImage, currentRecipe._id, currentRecipe.recipeImage?.thumbnail, isGeneratingImage, getFreshIdToken]);

  const getRecipeImage = () => {
    return currentRecipe.recipeImage?.thumbnail || defaultRecipeImage;
  };

  const handleCardClick = () => {
    if (currentRecipe.slug) {
      // If it's the special first healing meal, always treat it as a private recipe.
      if (currentRecipe.isFirstHealingMeal) {
        navigate(`/my-recipes/${currentRecipe.slug}`);
      } else if (currentRecipe.visibility !== 'private' && currentRecipe.generatedBy !== user?._id) {
        // If the recipe is public but NOT generated by this user, view it in the app's public recipe page
        // (avoids redirect to marketing site)
        navigate(`/public-recipes/${currentRecipe.slug}`);
      } else if (currentRecipe.generatedBy === user?._id) {
        // User's own recipe (public or private) - go to my-recipes for full edit capabilities
        navigate(`/my-recipes/${currentRecipe.slug}`);
      } else {
        // Fallback for private recipes or edge cases
        navigate(`/my-recipes/${currentRecipe.slug}`);
      }
    } else if (currentRecipe?._id) {
      navigate(`/my-recipes/${currentRecipe._id}`);
    }
  };

  const handleSaveClick = async () => {

    if (!user) {
      localStorage.setItem('recipeDataToSaveAfterLogin', JSON.stringify(currentRecipe));
      setSnackbar({ open: true, message: 'Please sign in to save recipes.', severity: 'info' });
      return;
    }

    // Client-side check for free plan recipe limit
    if (user.plan === 'Free' && savedRecipes.length >= 5) {
      setUpgradeModalMessage('You have reached your 5-recipe limit. Please upgrade to save more.');
      setUpgradeModalOpen(true);
      return;
    }

    // Guard: cannot save if recipe hasn't been persisted (missing _id)
    if (!currentRecipe?._id) {
      setSnackbar({ open: true, message: 'Please wait for the saved recipe card to appear before saving.', severity: 'info' });
      return;
    }

    if (isRecipeSaved) {
      try {
        await unsaveRecipeById(currentRecipe._id, getFreshIdToken);
        invalidateAllRecipes(); // TanStack Query: trigger refetch of recipe lists
        setSnackbar({ open: true, message: 'Recipe removed from your collection.', severity: 'info' });
      } catch (error) {
        console.error('[GeneratedRecipeSummaryCard] Failed to unsave recipe:', error);
        setSnackbar({ open: true, message: 'An unexpected error occurred. Please try again.', severity: 'error' });
      }
      return;
    }

    setIsSaving(true);
    try {
      const response = await saveRecipeById(currentRecipe._id, getFreshIdToken);
      invalidateAllRecipes(); // TanStack Query: trigger refetch of recipe lists

      capturePosthogEvent('app_recipe_saved', {
        recipeId: currentRecipe._id,
        recipeTitle: currentRecipe.recipeTitle,
        recipeSlug: currentRecipe.slug,
        isFirstHealingMeal: !!currentRecipe.isFirstHealingMeal,
        location: 'generated_recipe_summary_card',
      });

      setSnackbar({ open: true, message: 'Recipe saved to your collection!', severity: 'success' });
    } catch (error) {
      // The server's JSON response is in the 'body' property of the HttpError
      if (error instanceof HttpError && error.status === 403 && error.body?.errorCode === 'LIMIT_EXCEEDED_RECIPES') {
        setUpgradeModalMessage(error.message || 'You have reached the maximum number of saved recipes for the Basic plan.');
        setUpgradeModalOpen(true);
      } else {
        console.error('[GeneratedRecipeSummaryCard] Failed to save recipe:', error);
        setSnackbar({ open: true, message: 'An unexpected error occurred while saving. Please try again.', severity: 'error' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadClick = () => {
    setIsUploadModalOpen(true);
  };

  const handleManagePhotosClick = () => {
    setIsManagePhotosModalOpen(true);
  };

  const handleUploadSuccess = (newImageUrls) => {
    setCurrentRecipe(prev => ({ ...prev, recipeImage: newImageUrls }));
    setIsUploadModalOpen(false);
    setSnackbar({ open: true, message: 'Recipe image updated!', severity: 'success' });
  };

  const handleCoverSet = (newImageUrls) => {
    setCurrentRecipe(prev => ({ ...prev, recipeImage: newImageUrls }));
  };

  const handleImageChange = () => {
    // This function will be called from the modal to signal that the list of images has changed.
    // We can re-fetch the recipe or update its state as needed.
    // For now, let's just clear the image to trigger a refresh/fallback.
    setCurrentRecipe(prev => ({ ...prev, recipeImage: null }));
  };

  const handleVisibilityChange = async (newVisibility) => {
    if (!currentRecipe?._id) {
      setSnackbar({ open: true, message: 'Cannot update status for an unsaved recipe.', severity: 'error' });
      return;
    }
    try {
      const response = await setRecipeVisibility(currentRecipe._id, newVisibility, getFreshIdToken);
      if (response.success) {
        setVisibility(response.data.visibility);
        setCurrentRecipe(prev => ({
          ...prev,
          visibility: response.data.visibility,
          ...(response.data?.slug ? { slug: response.data.slug } : {}),
        }));
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
      if (!currentRecipe?.slug) {
        setSnackbar({ open: true, message: 'Recipe URL not available yet. Please try again.', severity: 'error' });
        return;
      }
      const baseUrl = MARKETING_BASE_URL || 'https://meadowmentor.com';
      const recipeUrl = `${baseUrl}/recipes/${currentRecipe.slug}`;
      navigator.clipboard.writeText(recipeUrl);
      setSnackbar({ open: true, message: 'Recipe URL copied to clipboard!', severity: 'success' });
    } else {
      // For private recipes, we need at least the _id to make the API call
      if (!currentRecipe?._id) {
        setSnackbar({ open: true, message: 'Cannot share an unsaved recipe.', severity: 'error' });
        return;
      }
      setIsConfirmModalOpen(true);
    }
  };

  const handleConfirmMakePublicAndCopy = async () => {
    setIsConfirmModalOpen(false);
    if (!currentRecipe?._id) {
      setSnackbar({ open: true, message: 'Cannot update status for an unsaved recipe.', severity: 'error' });
      return;
    }

    try {
      // Set visibility to 'unlisted' so the link works but it's not publicly browsable
      const response = await setRecipeVisibility(currentRecipe._id, 'unlisted', getFreshIdToken);
      if (response.success) {
        setVisibility(response.data.visibility);
        setCurrentRecipe(prev => ({
          ...prev,
          visibility: response.data.visibility,
          ...(response.data?.slug ? { slug: response.data.slug } : {}),
        }));
        setSnackbar({ open: true, message: response.message, severity: 'success' });

        // Copy URL and show the second toast after a short delay
        const nextSlug = response.data?.slug || currentRecipe.slug;
        setTimeout(() => {
          if (!nextSlug) {
            setSnackbar({ open: true, message: 'Recipe is now shareable but no slug was returned. Please refresh and try again.', severity: 'error' });
            return;
          }
          const baseUrl = MARKETING_BASE_URL || 'https://meadowmentor.com';
          const recipeUrl = `${baseUrl}/recipes/${nextSlug}`;
          navigator.clipboard.writeText(recipeUrl);
          setSnackbar({ open: true, message: 'Recipe URL copied to clipboard!', severity: 'info' });
        }, 1500); // Delay to allow first toast to be seen
      }
    } catch (err) {
      console.error('Failed to make recipe shareable:', err);
      setSnackbar({ open: true, message: err.message || 'Failed to update status.', severity: 'error' });
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const handleCopyRecipe = () => {
    setIsCopyModalOpen(true);
  };

  const handleCopyAndStay = async (newTitle) => {
    if (!currentRecipe?._id) {
      setSnackbar({ open: true, message: 'Cannot copy an unsaved recipe.', severity: 'error' });
      return;
    }

    try {
      const response = await duplicateRecipe(currentRecipe._id, newTitle, getFreshIdToken);

      if (response.success) {
        setIsCopyModalOpen(false);
        setSnackbar({ open: true, message: 'Recipe copied successfully!', severity: 'success' });
        // TanStack Query: invalidate to refetch fresh recipe lists
        invalidateAllRecipes();
      } else {
        throw new Error(response.message || 'Failed to copy recipe.');
      }
    } catch (err) {
      console.error('Error copying recipe:', err);
      setSnackbar({ open: true, message: err.message || 'Failed to copy recipe.', severity: 'error' });
    }
  };

  const handleCopyAndNavigate = async (newTitle) => {
    if (!currentRecipe?._id) {
      setSnackbar({ open: true, message: 'Cannot copy an unsaved recipe.', severity: 'error' });
      return;
    }

    try {
      const response = await duplicateRecipe(currentRecipe._id, newTitle, getFreshIdToken);

      if (response.success && response.data) {
        setIsCopyModalOpen(false);
        setSnackbar({ open: true, message: 'Recipe copied successfully! Navigating...', severity: 'success' });
        // TanStack Query: invalidate to refetch fresh recipe lists
        invalidateAllRecipes();

        // Navigate to the new recipe
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

  const ratingCount = currentRecipe.ratings?.length || 0;

  const allTags = [
    currentRecipe.recipeDiet,
    currentRecipe.mealType,
    ...(currentRecipe.tags || [])
  ].filter(Boolean);
  const uniqueTags = [...new Set(allTags)];

  const isSaveDisabled = isSaving || (!!user && !currentRecipe?._id);
  const saveTooltipText = !user
    ? "Save to your free cookbook"
    : !currentRecipe?._id
      ? "Recipe is still loading. Please wait a moment."
      : isRecipeSaved
        ? "Remove from your cookbook"
        : "Save to your free cookbook";

  // Check if recipe diet doesn't match user's primary diet
  const isDietMismatch = user?.primaryDiet && currentRecipe.recipeDiet && user.primaryDiet !== currentRecipe.recipeDiet;

  return (
    <Card sx={{
      borderRadius: '16px',
      position: 'relative',
      backgroundColor: '#FFF7E6',
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
    }}>
      <Box sx={{ position: 'relative' }}>
        {/* Show full menu for owned recipes */}
        {user?._id === currentRecipe?.generatedBy && (
          <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
            <RecipeCardMenu
              onUploadPhoto={handleUploadClick}
              onManagePhotos={handleManagePhotosClick}
              onToggleSave={handleSaveClick}
              isSaved={isRecipeSaved}
              onVisibilityChange={handleVisibilityChange}
              visibility={visibility}
              onCopyUrl={handleCopyUrl}
              onCopyRecipe={handleCopyRecipe}
              showFullMenu={true}
            />
          </Box>
        )}
        {/* Show copy-only menu for saved non-owned recipes */}
        {user?._id !== currentRecipe?.generatedBy && isRecipeSaved && currentRecipe?._id && (
          <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
            <RecipeCardMenu
              onCopyRecipe={handleCopyRecipe}
              visibility={visibility}
              showFullMenu={false}
            />
          </Box>
        )}
        <CardMedia
          component="img"
          height="200"
          image={getRecipeImage()}
          alt={currentRecipe.recipeTitle}
          sx={{ filter: (isUploading || isGeneratingImage) ? 'blur(4px)' : 'none', objectFit: 'cover' }}
        />
        {(isUploading || isGeneratingImage) && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 3,
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress sx={{ color: 'white' }} />
              {isGeneratingImage && (
                <Typography variant="body2" sx={{ color: 'white', mt: 1, fontWeight: 'bold' }}>
                  Visualizing recipe...
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </Box>

      <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <Typography gutterBottom variant="h5" component="div" sx={{ fontWeight: 'bold', textAlign: 'left' }}>
          {currentRecipe.recipeTitle}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'left', my: 1 }}>
          <Rating name="read-only-rating" value={currentRecipe.averageRating || null} precision={0.5} readOnly size="small" />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            ({ratingCount} cooks loved this)
          </Typography>
        </Box>

        <Typography variant="body1" color="text.secondary" sx={{ minHeight: '60px', textAlign: 'left', flexGrow: 1 }}>
          {currentRecipe.recipeDescription}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, my: 1.5, justifyContent: 'left' }}>
          {currentRecipe.totalTime && <Chip icon={<AccessTimeIcon />} label={currentRecipe.totalTime} size="small" sx={{ bgcolor: '#E0E0E0' }} />}
          {uniqueTags.map(tag => {
            // Show warning on diet chip if it doesn't match user's primary diet
            const isDietTag = tag === currentRecipe.recipeDiet;
            const showWarning = isDietTag && isDietMismatch;

            if (showWarning) {
              return (
                <Tooltip
                  key={tag}
                  title="This recipe may not align with your therapeutic diet in your profile"
                  placement="top"
                  componentsProps={{
                    tooltip: { sx: { fontSize: '1rem' } }
                  }}
                >
                  <Chip
                    icon={<WarningIcon sx={{ color: '#B45309' }} />}
                    label={tag}
                    size="small"
                    sx={{ bgcolor: '#FEF3C7', borderColor: '#F59E0B', border: '1px solid' }}
                  />
                </Tooltip>
              );
            }
            return <Chip key={tag} label={tag} size="small" sx={{ bgcolor: '#E0E0E0' }} />;
          })}
        </Box>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Tooltip title={"View ingredients and instructions"} placement="top">
            <span>
              <Button
                variant="outlined"
                startIcon={<InfoIcon />}
                onClick={handleCardClick}
                disabled={isSaving}
                sx={{
                  flexGrow: 1,
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 'bold',
                }}
              >
                View Details
              </Button>
            </span>
          </Tooltip>
          <Tooltip title={saveTooltipText} placement="top">
            <span>
              <Button
                variant="contained"
                startIcon={isRecipeSaved ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                onClick={handleSaveClick}
                disabled={isSaveDisabled}
                sx={{
                  flexGrow: 1,
                  backgroundColor: isRecipeSaved ? 'primary.light' : 'primary.main',
                  '&:hover': { backgroundColor: isRecipeSaved ? 'grey.700' : 'primary.dark' },
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 'bold',
                }}
              >
                {isSaving ? 'Saving...' : (isRecipeSaved ? 'Unsave Recipe' : 'Save Recipe')}
              </Button>
            </span>
          </Tooltip>
        </Box>
      </CardContent>
      <UpgradeModal_v2
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        message={upgradeModalMessage}
        recipeImage={modalImageUrl}
      />
      <ManagePhotosModal
        open={isManagePhotosModalOpen}
        onClose={() => setIsManagePhotosModalOpen(false)}
        recipeId={currentRecipe._id}
        currentCover={currentRecipe.recipeImage?.thumbnail}
        onCoverSet={handleCoverSet}
        onImageChange={handleImageChange}
      />
      <UploadPhotoModal
        open={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        recipeId={currentRecipe._id}
        onUploadSuccess={handleUploadSuccess}
      />
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      <ConfirmActionModal
        open={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmMakePublicAndCopy}
        title="Make Recipe Shareable?"
        message="This recipe is currently private. To share it, we'll make it accessible via link (unlisted). It won't appear in public listings. Do you want to proceed?"
      />
      <CopyRecipeModal
        open={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        onCopyAndStay={handleCopyAndStay}
        onCopyAndNavigate={handleCopyAndNavigate}
        originalTitle={currentRecipe.recipeTitle}
      />
    </Card>
  );
};

GeneratedRecipeSummaryCard.propTypes = {
  recipe: PropTypes.shape({
    _id: PropTypes.string,
    slug: PropTypes.string,
    recipeTitle: PropTypes.string.isRequired,
    recipeDescription: PropTypes.string,
    recipeImage: PropTypes.oneOfType([
      PropTypes.string, // For backward compatibility
      PropTypes.shape({
        thumbnail: PropTypes.string,
        display: PropTypes.string,
        original: PropTypes.string,
      }),
    ]),
    recipeDiet: PropTypes.string,
    mealType: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    totalTime: PropTypes.string,
    averageRating: PropTypes.number,
    ratings: PropTypes.arrayOf(PropTypes.object),
    generatedBy: PropTypes.string,
  }).isRequired,
  showSaveButton: PropTypes.bool,
};

export default React.memo(GeneratedRecipeSummaryCard);
