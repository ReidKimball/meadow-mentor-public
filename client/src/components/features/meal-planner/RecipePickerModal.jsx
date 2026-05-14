import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  TextField,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Search, Close } from '@mui/icons-material';
import { useUser } from '../../../context/UserContext';
import { getSavedRecipes } from '../../../services/recipeService';

/**
 * RecipePickerModal Component
 * Allows users to select a recipe from their saved recipes to replace a meal
 */
const RecipePickerModal = ({ open, onClose, onSelectRecipe, mealType, recipeDiet }) => {
  const { getFreshIdToken } = useUser();
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Load recipes when modal opens
  useEffect(() => {
    if (open) {
      loadRecipes();
    }
  }, [open, mealType, recipeDiet]);

  // Filter recipes based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredRecipes(recipes);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = recipes.filter(
        (recipe) =>
          recipe.recipeTitle.toLowerCase().includes(query) ||
          recipe.recipeDescription?.toLowerCase().includes(query)
      );
      setFilteredRecipes(filtered);
    }
  }, [searchQuery, recipes]);

  const loadRecipes = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Loading recipes for picker...');
      console.log('Meal type:', mealType);
      console.log('Recipe diet:', recipeDiet);

      const allRecipes = await getSavedRecipes(getFreshIdToken);
      console.log('All user recipes:', allRecipes.length);

      // Filter by mealType and recipeDiet
      const filtered = allRecipes.filter((recipe) => {
        const matchesMealType = recipe.mealType?.toLowerCase() === mealType?.toLowerCase();
        const matchesDiet = recipe.recipeDiet === recipeDiet;
        return matchesMealType && matchesDiet;
      });

      console.log('Filtered recipes:', filtered.length);
      
      // Sort by creation date: newest first
      const sorted = filtered.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA; // Descending order (newest first)
      });
      
      setRecipes(sorted);
      setFilteredRecipes(sorted);
    } catch (err) {
      console.error('Error loading recipes:', err);
      setError('Failed to load recipes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRecipe = (recipe) => {
    console.log('Recipe selected:', recipe.recipeTitle);
    onSelectRecipe(recipe);
    onClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '80vh',
        },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Choose a Recipe</Typography>
          <Button onClick={handleClose} startIcon={<Close />} size="small">
            Close
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search recipes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          sx={{ mb: 3 }}
        />

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* No Recipes Found */}
        {!loading && !error && filteredRecipes.length === 0 && (
          <Alert severity="info">
            No recipes found for {mealType}. Try generating some recipes first!
          </Alert>
        )}

        {/* Recipe Grid */}
        {!loading && !error && filteredRecipes.length > 0 && (
          <Grid container spacing={2}>
            {filteredRecipes.map((recipe) => (
              <Grid item xs={12} sm={6} key={recipe._id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => handleSelectRecipe(recipe)}
                >
                  {/* Recipe Image */}
                  {recipe.recipeImage?.thumbnail && (
                    <CardMedia
                      component="img"
                      height="140"
                      image={recipe.recipeImage.thumbnail}
                      alt={recipe.recipeTitle}
                      sx={{ objectFit: 'cover' }}
                    />
                  )}

                  {/* Recipe Info */}
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {recipe.recipeTitle}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {recipe.recipeDescription}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>

      <DialogActions>
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1, ml: 2 }}>
          {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''} available
        </Typography>
      </DialogActions>
    </Dialog>
  );
};

export default RecipePickerModal;
