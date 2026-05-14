import { useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useUserFeedback } from '../context/UserFeedbackContext';
import { saveRecipeById, createRecipe, claimPublicRecipeAdaptations } from '../services/recipeService';
import { useRecipes } from '../context/RecipeContext';

/**
 * Custom hook to handle actions after a user logs in, such as saving a recipe.
 */
export const useAuthRedirect = () => {
  const { user, getFreshIdToken } = useUser();
  const { showSuccessSnackbar, showErrorSnackbar } = useUserFeedback();
  const { refetchSavedRecipes } = useRecipes();

  useEffect(() => {
    const handlePostLoginActions = async () => {
      const recipeId = localStorage.getItem('recipeToSaveAfterLogin');
      const recipeDataRaw = localStorage.getItem('recipeDataToSaveAfterLogin');
      const recipeData = recipeDataRaw ? safelyParse(recipeDataRaw) : null;
      const anonSessionId = localStorage.getItem('anonSessionIdToClaimAfterLogin');

      console.log('[useAuthRedirect] Post-login handler:', {
        hasUser: !!user,
        recipeId,
        anonSessionId,
        hasRecipeData: !!recipeDataRaw,
      });

      // Proceed only if there's something to do and a logged-in user
      if (user && (recipeId || recipeData || anonSessionId)) {
        try {
          if (anonSessionId) {
            console.log('[useAuthRedirect] Claiming public recipe adaptations for anon session:', anonSessionId);
            await claimPublicRecipeAdaptations(anonSessionId, getFreshIdToken);
            console.log('[useAuthRedirect] Claim complete.');
          }

          if (!recipeId && !recipeData) {
            return;
          }

          console.log('[useAuthRedirect] Starting post-login save flow...');
          let ensuredRecipeId = recipeId;
          if (!ensuredRecipeId && recipeData) {
            // Create the recipe first, then save
            console.log('[useAuthRedirect] No recipeId found. Creating recipe first...');
            const created = await createRecipe(recipeData, getFreshIdToken);
            ensuredRecipeId = created?.data?._id;
            if (!ensuredRecipeId) {
              throw new Error('Failed to create recipe before saving.');
            }
            console.log('[useAuthRedirect] Recipe created with id:', ensuredRecipeId);
          }

          console.log('[useAuthRedirect] Saving recipe by id:', ensuredRecipeId);
          const response = await saveRecipeById(ensuredRecipeId, getFreshIdToken);
          if (response.success) {
            showSuccessSnackbar('Recipe saved successfully!');
            console.log('[useAuthRedirect] Save success. Triggering refetch of saved recipes...');
            try {
              await refetchSavedRecipes();
              console.log('[useAuthRedirect] Refetch complete.');
            } catch (e) {
              console.warn('[useAuthRedirect] Refetch failed:', e);
            }
          } else {
            // If the backend responds with a specific error message, use it
            throw new Error(response.message || 'Failed to save recipe after login.');
          }
        } catch (error) {
          console.error('Error saving recipe post-login:', error);
          showErrorSnackbar(error.message || 'Could not save the recipe.');
        } finally {
          // Always remove the item from localStorage to prevent re-triggering
          localStorage.removeItem('recipeToSaveAfterLogin');
          localStorage.removeItem('recipeDataToSaveAfterLogin');
          localStorage.removeItem('anonSessionIdToClaimAfterLogin');
          console.log('[useAuthRedirect] Cleared post-login localStorage keys.');
        }
      }
    };

    handlePostLoginActions();
    // Dependencies ensure this runs when the user object becomes available
  }, [user, getFreshIdToken, showSuccessSnackbar, showErrorSnackbar, refetchSavedRecipes]);

  // Helper: safe JSON.parse
  function safelyParse(json) {
    try {
      return JSON.parse(json);
    } catch (e) {
      console.error('Failed to parse recipeDataToSaveAfterLogin JSON:', e);
      return null;
    }
  }
};
