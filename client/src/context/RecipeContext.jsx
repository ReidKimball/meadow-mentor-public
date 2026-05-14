import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useUser } from './UserContext';
import { getSavedRecipes, saveRecipeById, unsaveRecipeById, getGeneratedRecipes } from '../services/recipeService';

export const RecipeContext = createContext();

export const useRecipes = () => useContext(RecipeContext);

export const RecipeProvider = ({ children }) => {
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [generatedRecipes, setGeneratedRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, getFreshIdToken, isNewUser } = useUser();

  useEffect(() => {
    console.log('(RecipeContext.jsx) useEffect triggered: ', { hasUser: !!user, isNewUser });
    const fetchRecipes = async () => {
      if (!user) {
        console.log('(RecipeContext.jsx) No user. Clearing recipes and skipping fetch.');
        setSavedRecipes([]);
        setGeneratedRecipes([]);
        setIsLoading(false);
        return;
      }

      if (isNewUser) {
        console.log('(RecipeContext.jsx) Signup in progress (isNewUser=true). Skipping fetch to avoid flicker.');
        setSavedRecipes([]);
        setGeneratedRecipes([]);
        setIsLoading(false);
        return;
      }

      try {
        console.log('(RecipeContext.jsx) Fetching saved and generated recipes...');
        setIsLoading(true);
        setError(null);

        const [savedResponse, generatedResponse] = await Promise.all([
          getSavedRecipes(getFreshIdToken),
          getGeneratedRecipes(getFreshIdToken)
        ]);

        const savedRecipesData = Array.isArray(savedResponse) ? savedResponse : savedResponse.data || [];
        const generatedRecipesData = Array.isArray(generatedResponse) ? generatedResponse : generatedResponse.data || [];

        console.log('(RecipeContext.jsx) Saved recipes fetched. Count:', savedRecipesData.length);
        console.log('(RecipeContext.jsx) Generated recipes fetched. Count:', generatedRecipesData.length);

        setSavedRecipes(savedRecipesData);
        setGeneratedRecipes(generatedRecipesData);
      } catch (err) {
        setError(err.message || 'Failed to fetch recipes.');
        console.error('(RecipeContext.jsx) Error fetching recipes:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipes();
  }, [user?.firebaseUID, getFreshIdToken, isNewUser]);

  // Allow manual refresh after actions like post-login save
  const refetchSavedRecipes = useCallback(async () => {
    console.log('(RecipeContext.jsx) refetchSavedRecipes called.');
    if (!user) {
      console.log('(RecipeContext.jsx) No user on refetch. Clearing and returning.');
      setSavedRecipes([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const response = await getSavedRecipes(getFreshIdToken);
      const recipes = Array.isArray(response) ? response : response.data || [];
      console.log('(RecipeContext.jsx) Refetched saved recipes. Count:', recipes.length);
      setSavedRecipes(recipes);
    } catch (err) {
      setError(err.message || 'Failed to refetch saved recipes.');
      console.error('(RecipeContext.jsx) Error refetching saved recipes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, getFreshIdToken]);

  const refetchGeneratedRecipes = useCallback(async () => {
    console.log('(RecipeContext.jsx) refetchGeneratedRecipes called.');
    if (!user) {
      console.log('(RecipeContext.jsx) No user on refetch. Clearing and returning.');
      setGeneratedRecipes([]);
      return;
    }
    try {
      const response = await getGeneratedRecipes(getFreshIdToken);
      const recipes = Array.isArray(response) ? response : response.data || [];
      console.log('(RecipeContext.jsx) Refetched generated recipes. Count:', recipes.length);
      setGeneratedRecipes(recipes);
    } catch (err) {
      setError(err.message || 'Failed to refetch generated recipes.');
      console.error('(RecipeContext.jsx) Error refetching generated recipes:', err);
    }
  }, [user, getFreshIdToken]);

  const addRecipe = useCallback((newRecipe) => {
    setSavedRecipes((prevRecipes) => {
      // Avoid adding duplicates
      if (prevRecipes.find(r => r._id === newRecipe._id)) {
        return prevRecipes;
      }
      return [...prevRecipes, newRecipe];
    });
  }, []);

  const removeRecipe = useCallback((recipeId) => {
    setSavedRecipes((prevRecipes) => prevRecipes.filter(r => r._id !== recipeId));
  }, []);

  const addGeneratedRecipe = useCallback((newRecipe) => {
    setGeneratedRecipes((prevRecipes) => {
      if (prevRecipes.find((r) => r._id === newRecipe._id)) {
        return prevRecipes;
      }
      return [...prevRecipes, newRecipe];
    });
  }, []);

  const upsertSavedRecipe = useCallback((updatedRecipe) => {
    if (!updatedRecipe?._id) return;
    setSavedRecipes((prevRecipes) => {
      const index = prevRecipes.findIndex((r) => r._id === updatedRecipe._id);
      if (index === -1) return prevRecipes;
      const next = [...prevRecipes];
      next[index] = { ...prevRecipes[index], ...updatedRecipe };
      return next;
    });
  }, []);

  const upsertGeneratedRecipe = useCallback((updatedRecipe) => {
    if (!updatedRecipe?._id) return;
    setGeneratedRecipes((prevRecipes) => {
      const index = prevRecipes.findIndex((r) => r._id === updatedRecipe._id);
      if (index === -1) return prevRecipes;
      const next = [...prevRecipes];
      next[index] = { ...prevRecipes[index], ...updatedRecipe };
      return next;
    });
  }, []);

  const saveRecipe = useCallback(async (recipe) => {
    if (!user) throw new Error('User not authenticated.');
    if (!recipe?._id) throw new Error('Invalid recipe data provided.');

    try {
      await saveRecipeById(recipe._id, getFreshIdToken);
      addRecipe(recipe); // Add the full recipe object to local state on success
    } catch (error) {
      console.error('Failed to save recipe in context:', error);
      throw error; // Re-throw to be caught in the component
    }
  }, [user, getFreshIdToken, addRecipe]);

  const unsaveRecipe = useCallback(async (recipeId) => {
    if (!user) throw new Error('User not authenticated.');
    try {
      await unsaveRecipeById(recipeId, getFreshIdToken);
      removeRecipe(recipeId); // This correctly removes from local state by ID
    } catch (error) {
      console.error('Failed to unsave recipe in context:', error);
      throw error; // Re-throw to be caught in the component
    }
  }, [user, getFreshIdToken, removeRecipe]);

  const savedRecipeIds = new Set(savedRecipes.map(r => r._id));

  const value = useMemo(() => ({
    savedRecipes,
    generatedRecipes,
    isLoading,
    error,
    saveRecipe,
    unsaveRecipe,
    refetchSavedRecipes,
    refetchGeneratedRecipes,
    savedRecipeIds,
    addRecipe,
    removeRecipe,
    addGeneratedRecipe,
    upsertSavedRecipe,
    upsertGeneratedRecipe,
  }), [
    savedRecipes,
    generatedRecipes,
    isLoading,
    error,
    saveRecipe,
    unsaveRecipe,
    refetchSavedRecipes,
    refetchGeneratedRecipes,
    savedRecipeIds,
    addRecipe,
    removeRecipe,
    addGeneratedRecipe,
    upsertSavedRecipe,
    upsertGeneratedRecipe,
  ]);

  return (
    <RecipeContext.Provider value={value}>
      {children}
    </RecipeContext.Provider>
  );
};

RecipeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
