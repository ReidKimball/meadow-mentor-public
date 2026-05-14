import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router';
import { Box, CircularProgress, Typography, Container } from '@mui/material';
import { getRecipeById, getRecipeBySlug } from '../../../services/recipeService';
import { useUser } from '../../../context/UserContext';
import RecipeCard from './RecipeCard';

const MyRecipeDetailPage = () => {
  const { slug } = useParams();
  const { getFreshIdToken } = useUser();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isMongoId = typeof slug === 'string' && /^[0-9a-f]{24}$/i.test(slug);

  const refetchRecipe = useCallback(async () => {
    try {
      setLoading(true);
      const response = isMongoId
        ? await getRecipeById(slug, getFreshIdToken)
        : await getRecipeBySlug(slug, getFreshIdToken);
      setRecipe(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch recipe. It may be private or not exist.');
      console.error('Error fetching recipe by slug:', err);
    } finally {
      setLoading(false);
    }
  }, [getFreshIdToken, isMongoId, slug]);

  useEffect(() => {
    if (slug && getFreshIdToken) {
      refetchRecipe();
    }
  }, [slug, getFreshIdToken, refetchRecipe]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Typography color="error" sx={{ textAlign: 'center', mt: 4 }}>{error}</Typography>;
  }

  if (!recipe) {
    return <Typography sx={{ textAlign: 'center', mt: 4 }}>Recipe not found.</Typography>;
  }

  return (
    <Box sx={{ 
      display: 'flex',
      justifyContent: 'center',
      width: '100%',
      px: { xs: 0, sm: 3 },
      py: { xs: 0, sm: 4 }      
    }}>
      <Box sx={{ width: '100%', maxWidth: '600px' }}>
        <RecipeCard recipe={recipe} onDataChange={refetchRecipe} />
      </Box>
    </Box>
  );
};

export default MyRecipeDetailPage;
