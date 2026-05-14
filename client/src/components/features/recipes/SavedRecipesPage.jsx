/**
 * @file Defines the SavedRecipesPage component.
 * @description Renders saved, public, and combined recipe lists with filtering and inline guidance when onboarding data is incomplete.
 * @requires module:react
 * @requires module:@mui/material
 * @requires module:@mui/lab
 * @requires module:react-router-dom
 * @version 1.0.0
 * @date 2025-12-24
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Typography, CircularProgress, Alert, Snackbar, FormControl, InputLabel, Select, MenuItem, Grid, Paper, FormGroup, FormControlLabel, Checkbox, Button } from '@mui/material';
import { Masonry } from '@mui/lab';
import { Link as RouterLink } from 'react-router';
import { useUser } from '../../../context/UserContext';
import { useSavedRecipesQuery, useGeneratedRecipesQuery } from '../../../hooks/useRecipeQueries';
import { getPublicRecipes } from '../../../services/recipeService';
import RecipeCard from './RecipeCard.jsx';
import GeneratedRecipeSummaryCard from './GeneratedRecipeSummaryCard.jsx';
import RecipeSkeletonLoader from '../ai/AskKay/RecipeSkeletonLoader.jsx';

const SavedRecipesPage = () => {
  const { user, getFreshIdToken } = useUser();
  
  // TanStack Query: Cached recipe data that auto-updates on invalidation
  const { savedRecipes, isLoading: savedLoading } = useSavedRecipesQuery();
  const { generatedRecipes, isLoading: generatedLoading } = useGeneratedRecipesQuery();
  const recipesLoading = savedLoading || generatedLoading;
  
  const [publicRecipes, setPublicRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [filter, setFilter] = useState('saved'); // Default to showing saved recipes
  const [mealTypeFilters, setMealTypeFilters] = useState({
    breakfast: true,
    lunch: true,
    dinner: true,
    snack: true,
  });

  // Show all saved recipes (don't filter by diet - user may have saved recipes before choosing their diet)
  const allUserRecipes = useMemo(() => {
    console.log('[SavedRecipesPage] Total saved recipes from TanStack Query:', savedRecipes.length);
    return savedRecipes;
  }, [savedRecipes]);

  const fetchPublicRecipes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const publicResponse = await getPublicRecipes(user.primaryDiet);

      if (publicResponse.success) {
        setPublicRecipes(publicResponse.data);
      } else {
        throw new Error(publicResponse.message || 'Failed to fetch public recipes.');
      }

    } catch (err) {
      setError(err.message);
      console.error('Error fetching public recipes:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPublicRecipes();
  }, [fetchPublicRecipes]);

  const handleUnsave = (recipeId) => {
    // The recipe will be removed from context by the component itself
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  const handleMealTypeFilterChange = (mealType) => {
    setMealTypeFilters(prev => ({
      ...prev,
      [mealType]: !prev[mealType],
    }));
  };

  const filteredRecipes = useMemo(() => {
    let recipes = [];

    if (filter === 'all') {
      const allRecipesMap = new Map();
      allUserRecipes.forEach(recipe => allRecipesMap.set(recipe._id, recipe));
      publicRecipes.forEach(recipe => allRecipesMap.set(recipe._id, recipe));
      recipes = Array.from(allRecipesMap.values());
    } else if (filter === 'saved') {
      recipes = [...allUserRecipes];
    } else if (filter === 'public') {
      recipes = [...publicRecipes];
    }

    // Filter by meal type
    const activeMealTypes = Object.keys(mealTypeFilters).filter(key => mealTypeFilters[key]);
    if (activeMealTypes.length > 0 && activeMealTypes.length < 4) {
      recipes = recipes.filter(recipe => {
        const recipeMealType = recipe.mealType?.toLowerCase();
        return activeMealTypes.includes(recipeMealType);
      });
    }

    // Sort by creation date: most recent first
    return recipes.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA; // Descending order (newest first)
    });
  }, [allUserRecipes, publicRecipes, filter, mealTypeFilters]);

  const isHealthProfileIncomplete = useMemo(
    () => !user?.primaryDiet || !user?.conditionTreating,
    [user?.primaryDiet, user?.conditionTreating]
  );

  if (loading || recipesLoading) {
    return (
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <Typography variant="h4" gutterBottom component="h1" sx={{ mb: 2 }}>
          My Recipes
        </Typography>
        <FormControl sx={{ m: 1, minWidth: 240, mb: 4 }}>
          <InputLabel id="recipe-filter-label">View Recipes</InputLabel>
          <Select
            labelId="recipe-filter-label"
            id="recipe-filter"
            value={filter}
            label="View Recipes"
            disabled
          >
            <MenuItem value="saved">My Saved Recipes</MenuItem>
            <MenuItem value="public">Community Recipes</MenuItem>
            <MenuItem value="all">All Recipes</MenuItem>
          </Select>
        </FormControl>
        <Masonry columns={{ xs: 1, sm: 2, md: 3 }} spacing={3} sx={{ width: '100%' }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Box key={i}>
              <RecipeSkeletonLoader />
            </Box>
          ))}
        </Masonry>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>

      {isHealthProfileIncomplete && (
        <Alert
          severity="warning"
          sx={{
            mb: 3,
            fontSize: '1rem',
            fontWeight: 'normal',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
            '& .MuiAlert-icon': { fontSize: '2rem' },
          }}
        >
          <Button
            component={RouterLink}
            to="/quick_start_guide"
            color="inherit"
            size="normal"
            variant="outlined"            
          >
            Set up diet plan
          </Button>
          <Typography variant="body1" sx={{ fontWeight: 'normal', py: 1 }}>
            Finish setting your primary diet and condition to personalize your recipes.
          </Typography>
        </Alert>
      )}

      <Typography variant="h4" gutterBottom component="h1" sx={{ mb: 2 }}>
        My Recipes
      </Typography>      

      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <FormControl sx={{ minWidth: 240 }}>
          <InputLabel id="recipe-filter-label">View Recipes</InputLabel>
          <Select
            labelId="recipe-filter-label"
            id="recipe-filter"
            value={filter}
            label="View Recipes"
            onChange={handleFilterChange}
          >
            <MenuItem value="saved">My Saved Recipes</MenuItem>
            <MenuItem value="public">Community Recipes</MenuItem>
            <MenuItem value="all">All Recipes</MenuItem>
          </Select>
        </FormControl>

        <Paper sx={{ p: 2, flex: 1, minWidth: 280 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
            Meal Types
          </Typography>
          <FormGroup row>
            {['breakfast', 'lunch', 'dinner', 'snack'].map((mealType) => (
              <FormControlLabel
                key={mealType}
                control={
                  <Checkbox
                    checked={mealTypeFilters[mealType]}
                    onChange={() => handleMealTypeFilterChange(mealType)}
                    size="small"
                  />
                }
                label={mealType.charAt(0).toUpperCase() + mealType.slice(1)}
              />
            ))}
          </FormGroup>
        </Paper>
      </Box>

      {filteredRecipes.length > 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', mt: 2 }}>
          <Masonry columns={{ xs: 1, sm: 2, md: 3 }} spacing={3} sx={{ maxWidth: '100%' }}>
            {filteredRecipes.map((recipe) => {
              const userRatingObj = recipe.ratings?.find(r => r.user === user?._id);
              const initialUserRating = userRatingObj ? userRatingObj.rating : 0;
              const isSaved = allUserRecipes.some(userRecipe => userRecipe._id === recipe._id);
              return (
                <GeneratedRecipeSummaryCard
                  key={recipe._id}
                  recipe={recipe}
                  initialUserRating={initialUserRating}
                  showSaveButton={true}
                  initialIsSaved={isSaved}
                  onUnsave={() => handleUnsave(recipe._id)}
                />
              );
            })}
          </Masonry>
        </Box>
      ) : (
        <Typography variant="body1">No recipes found for this filter.</Typography>
      )}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          Recipe unsaved successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SavedRecipesPage;
