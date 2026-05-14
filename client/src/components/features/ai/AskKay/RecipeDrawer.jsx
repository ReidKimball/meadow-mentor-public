import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useRecipes } from '../../../context/RecipeContext';
import RecipeCard from './RecipeCard';

const RecipeDrawer = () => {
  const { recipes } = useRecipes();

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 100,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: 600,
        p: 3,
        bgcolor: 'background.paper',
        boxShadow: 6,
        borderRadius: 2,
        overflowY: 'auto',
        maxHeight: '80vh',
        zIndex: 2000, // higher than meadow background
      }}
    >
      <Typography variant="h6" gutterBottom>
        Generated Recipes
      </Typography>
      {recipes.length > 0 ? (
        recipes.map((recipe, index) => (
          <RecipeCard key={index} recipe={recipe} />
        ))
      ) : (
        <Paper elevation={0} sx={{ p: 2, textAlign: 'center', backgroundColor: '#f5f5f5' }}>
          <Typography>Recipes you generate will appear here.</Typography>
        </Paper>
      )}
    </Box>
  );
};

export default RecipeDrawer;
