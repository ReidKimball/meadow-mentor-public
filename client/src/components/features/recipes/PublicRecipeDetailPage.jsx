import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import MetaTags from '../../Common/MetaTags.jsx';
import { getRecipeBySlug, getPublicRecipeBySlug } from '../../../services/recipeService.js';
import RecipeCard from './RecipeCard.jsx';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { useUser } from '../../../context/UserContext.jsx';

const PublicRecipeDetailPage = () => {
  const { slug } = useParams();
  const { user, getFreshIdToken } = useUser(); // Use the user context
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        let response;
        if (user) {
          // User is logged in, try fetching via the authenticated route first
          response = await getRecipeBySlug(slug, getFreshIdToken);
        } else {
          // User is not logged in, use the public route
          response = await getPublicRecipeBySlug(slug);
        }

        if (response.success) {
          setRecipe(response.data);
        } else {
          throw new Error(response.message || 'Failed to fetch recipe.');
        }
      } catch (err) {
        console.error("Error fetching recipe:", err);
        setError(err.message || 'Failed to load recipe. It may have been removed or the link is incorrect.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [slug, user, getFreshIdToken]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>;
  }

  if (!recipe) {
    return <Typography sx={{ textAlign: 'center', mt: 4 }}>Recipe not found.</Typography>;
  }

  // Prepare props for the custom MetaTags component
  const pageInfo = {
    title: recipe.recipeTitle,
    description: recipe.recipeDescription,
    url: `https://meadowmentor.com/recipes/${slug}`,
    imageUrl: recipe.recipeImage,
  };

  return (
    <>
      <MetaTags {...pageInfo} />
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        px: { xs: 0, sm: 3 },
        py: { xs: 0, sm: 4 }
      }}>
        <Box sx={{ width: '100%', maxWidth: '600px' }}>
          <RecipeCard recipe={recipe} showSaveButton={true} />
        </Box>
      </Box>
    </>
  );
};

export default PublicRecipeDetailPage;
