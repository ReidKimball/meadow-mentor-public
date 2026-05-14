import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem, Grid } from '@mui/material';
import { Masonry } from '@mui/lab';
import { getPublicRecipes } from '../../../services/recipeService';
import RecipeSummaryCard from './RecipeSummaryCard';
import MetaTags from '../../Common/MetaTags';
const publicRecipeImage = 'https://storage.googleapis.com/meadow_mentor_public_media/images/public_recipe_page_metaog_imagen4_ultra.webp';


const PublicRecipesPage = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDiet, setSelectedDiet] = useState('All');

  const diets = [
    { code: 'All', name: 'All Diets' },
    { code: 'SCD', name: 'Specific Carbohydrate Diet' },
    { code: 'GAPS', name: 'GAPS Protocol' },
    { code: 'Paleo AIP', name: 'Paleo Autoimmune Protocol' },
    { code: 'Mediterranean', name: 'Mediterranean Diet' },
  ];

  const fetchPublicRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPublicRecipes(selectedDiet);
      if (response.success) {
        console.log('Fetched public recipes:', response.data); // Log the fetched data
        const filteredRecipes = response.data.filter(recipe => !recipe.isFirstHealingMeal);
        setRecipes(filteredRecipes);
      } else {
        throw new Error(response.message || 'Failed to fetch public recipes.');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching public recipes:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDiet]);

  useEffect(() => {
    fetchPublicRecipes();
  }, [fetchPublicRecipes]);

  const handleDietChange = (event) => {
    setSelectedDiet(event.target.value);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
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

  // Prepare props for the custom MetaTags component
  const pageInfo = {
    title: "Community Recipes - Healthy Eating, Made Delicious", 
    description: "Explore recipes shared by the Meadow Mentor community.", 
    url: `https://meadowmentor.com/recipes`,
    imageUrl: "https://storage.googleapis.com/meadow_mentor_public_media/images/public_recipe_page_metaog_imagen4_ultra_.webp", 
    imageAlt: "Beautiful food photography of a tall glass of pink-purple shake with ingredients surrounding it of avocados, cinnamon, honey, blueberries, and raspberries. Text at the bottom reads Healthy Eating, Made Delicious",
  };

  return (
    <>
      <MetaTags {...pageInfo} />
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <Typography variant="h4" gutterBottom component="h1" sx={{ mb: 2 }}>
          Community Recipes
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
          Explore recipes shared by the Meadow Mentor community.
        </Typography>

        <FormControl sx={{ m: 1, minWidth: 240, mb: 4 }}>
          <InputLabel id="diet-filter-label">Filter by Diet</InputLabel>
          <Select
            labelId="diet-filter-label"
            id="diet-filter"
            value={selectedDiet}
            label="Filter by Diet"
            onChange={handleDietChange}
          >
            {diets.map((diet) => (
              <MenuItem key={diet.code} value={diet.code}>
                {diet.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {recipes.length > 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', mt: 2 }}>
            {(() => {
              if (recipes.length === 1) {
                // Special layout for a single card
                return (
                  <Box key={recipes[0]._id} sx={{ mt: 8, width: '100%', maxWidth: { xs: '100%', sm: '80%', md: '500px' } }}>
                    <RecipeSummaryCard recipe={recipes[0]} />
                  </Box>
                );
              } else if (recipes.length === 2) {
                // Special layout for two cards using Grid
                return (
                  <Grid container spacing={4} justifyContent="center" sx={{ mt: 4, maxWidth: '1200px' }}>
                    {recipes.map((recipe) => (
                      <Grid item key={recipe._id} xs={12} sm={6} md={5} sx={{ mb: 4 }}>
                        <RecipeSummaryCard recipe={recipe} />
                      </Grid>
                    ))}
                  </Grid>
                );
              } else {
                // Masonry layout for 3+ cards
                return (
                  <Masonry columns={{ xs: 1, sm: 1, md: 2, lg: 3, xl: 4 }} spacing={8} sx={{ width: '100%' }}>
                    {recipes.map((recipe) => (
                      <Box key={recipe._id} sx={{ mb: 4 }}>
                        <RecipeSummaryCard recipe={recipe} />
                      </Box>
                    ))}
                  </Masonry>
                );
              }
            })()}
          </Box>
        ) : (
          <Typography sx={{ textAlign: 'center', mt: 4 }}>No public recipes found for this filter.</Typography>
        )}
      </Box>
    </>
  );
};

export default PublicRecipesPage;
