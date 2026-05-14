/**
 * @file MealSlot component for meal planner cards.
 * @description Renders a single meal slot, including placeholder actions and image state.
 * @author Cascade
 * @version 1.0.0
 * @date 2026-01-19
 */

// React/Third-Party Libraries
import React, { useState } from 'react';
import { Paper, Typography, Box, Button, Chip, TextField, CircularProgress, IconButton, Tooltip } from '@mui/material';
import { Restaurant, AutoAwesome, SwapHoriz, Edit, Check, Close, Shuffle, Delete } from '@mui/icons-material';

/**
 * Meal Slot Component
 * Displays a single meal with optional actions and inline editing
 * @param {boolean} readOnly - If true, hides action buttons
 * @param {Function} onGeneratePlaceholder - Callback to generate a placeholder meal idea
 * @param {Function} onRemoveMeal - Callback to remove/clear a meal from the slot
 */
const MealSlot = ({ mealType, meal, onMealClick, onGenerateRecipe, onReplaceMeal, onSurpriseMe, onEditMeal, onGeneratePlaceholder, onRemoveMeal, dayIndex, readOnly = false, isGenerating = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  
  
  const handleStartEdit = (e) => {
    e.stopPropagation();
    setEditedTitle(meal?.recipeTitle || meal?.title || '');
    setEditedDescription(meal?.recipeDescription || meal?.description || '');
    setIsEditing(true);
  };
  
  const handleSaveEdit = (e) => {
    e.stopPropagation();
    if (onEditMeal) {
      onEditMeal(editedTitle, editedDescription);
    }
    setIsEditing(false);
  };
  
  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setIsEditing(false);
  };
  const mealTypeColors = {
    breakfast: '#FF6B6B',
    lunch: '#4ECDC4',
    dinner: '#45B7D1',
    snack: '#FFA07A',
  };

  // Handle null meal case
  const isEmptySlot = !meal;

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: meal?.recipeId ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        '&:hover': meal?.recipeId ? {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        } : {},
        borderTop: 4,
        borderColor: mealTypeColors[mealType] || 'primary.main',
        opacity: isEmptySlot ? 0.6 : 1,
      }}
      onClick={() => meal?.recipeId && onMealClick(meal)}
    >
      {/* Meal Type Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography
          variant="overline"
          sx={{
            fontWeight: 'bold',
            color: mealTypeColors[mealType] || 'primary.main',
            fontSize: '0.875rem',
            letterSpacing: 1,
          }}
        >
          {mealType}
        </Typography>
        <Restaurant sx={{ color: mealTypeColors[mealType] || 'primary.main' }} />
      </Box>

      {/* Meal Content - Image + Title/Description */}
      {isEmptySlot ? (
        // Empty slot state
        <Box sx={{ mb: 2, textAlign: 'center', py: 3 }}>
          <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            No recipe assigned
          </Typography>
        </Box>
      ) : isEditing ? (
        <>
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Recipe Title"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              size="small"
              sx={{ mb: 2 }}
              onClick={(e) => e.stopPropagation()}
            />
            <TextField
              fullWidth
              label="Recipe Description"
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              multiline
              rows={3}
              size="small"
              onClick={(e) => e.stopPropagation()}
            />
          </Box>
          
          {/* Save and Cancel buttons immediately after text fields */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Close />}
              onClick={handleCancelEdit}
              sx={{ textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              color="primary"
              startIcon={<Check />}
              onClick={handleSaveEdit}
              sx={{ textTransform: 'none' }}
            >
              Save
            </Button>
          </Box>
        </>
      ) : (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            mb: 2,
          }}
        >
          {/* Recipe Image */}
          {meal.recipeImage?.thumbnail ? (
            <Box
              component="img"
              src={meal.recipeImage.thumbnail}
              alt={meal.recipeTitle || meal.title}
              sx={{
                width: { xs: '100%', sm: 140 },
                height: { xs: 200, sm: 140 },
                objectFit: 'cover',
                borderRadius: 2,
                flexShrink: 0,
              }}
            />
          ) : meal.isImageGenerating ? (
            <Box
              sx={{
                width: { xs: '100%', sm: 140 },
                height: { xs: 200, sm: 140 },
                borderRadius: 2,
                flexShrink: 0,
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default',
              }}
            >
              <CircularProgress size={32} />
            </Box>
          ) : null}
          
          {/* Title and Description */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              {meal.recipeTitle || meal.title}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {meal.recipeDescription || meal.description}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Placeholder Badge */}
      {meal?.isPlaceholder && (
        <Chip
          label="Placeholder"
          size="small"
          color="warning"
          sx={{ mb: 2, alignSelf: 'flex-start' }}
        />
      )}

      {/* Action Buttons - Only show if not readOnly and not editing */}
      {!readOnly && !isEditing && (
        <Box sx={{ display: 'flex', gap: 1, mt: 'auto', flexWrap: 'wrap' }}>
          {/* Three buttons for empty slots */}
          {isEmptySlot && (
            <>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Restaurant />}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onReplaceMeal) {
                    onReplaceMeal();
                  }
                }}
                sx={{ textTransform: 'none' }}
              >
                Add Recipe
              </Button>
              
              <Button
                size="small"
                variant="outlined"
                color="secondary"
                startIcon={<Shuffle />}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSurpriseMe) {
                    onSurpriseMe();
                  }
                }}
                sx={{ textTransform: 'none' }}
              >
                Surprise Me
              </Button>
              
              <Button
                size="small"
                color="primary"
                variant="contained"
                startIcon={isGenerating ? <CircularProgress size={16} color="inherit" /> : <AutoAwesome />}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onGeneratePlaceholder) {
                    onGeneratePlaceholder();
                  }
                }}
                disabled={isGenerating}
                sx={{ textTransform: 'none' }}
              >
                {isGenerating ? 'Generating...' : 'Generate New Meal Idea'}
              </Button>
            </>
          )}
          
          {/* Generate Recipe button for placeholders */}
          {!isEmptySlot && meal.isPlaceholder && onGenerateRecipe && (
            <Button
              size="small"
              variant="contained"
              startIcon={isGenerating ? <CircularProgress size={16} color="inherit" /> : <AutoAwesome />}
              onClick={(e) => {
                e.stopPropagation();
                onGenerateRecipe();
              }}
              disabled={isGenerating}
              sx={{ textTransform: 'none' }}
            >
              {isGenerating ? 'Generating...' : 'Generate Recipe'}
            </Button>
          )}
          
          {/* Edit button for placeholders */}
          {!isEmptySlot && meal.isPlaceholder && onEditMeal && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<Edit />}
              onClick={handleStartEdit}
              sx={{ textTransform: 'none' }}
            >
              Edit
            </Button>
          )}
          
          {/* Replace and Surprise Me buttons for non-placeholders */}
          {!isEmptySlot && !meal.isPlaceholder && (
            <>
              {onReplaceMeal && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<SwapHoriz />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReplaceMeal();
                  }}
                  sx={{ textTransform: 'none' }}
                >
                  Replace
                </Button>
              )}
              
              {onSurpriseMe && (
                <Button
                  size="small"
                  variant="outlined"
                  color="secondary"
                  startIcon={<Shuffle />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSurpriseMe();
                  }}
                  sx={{ textTransform: 'none' }}
                >
                  Surprise Me
                </Button>
              )}
            </>
          )}
          
          {/* Remove button - show at bottom for all non-empty slots */}
          {!isEmptySlot && onRemoveMeal && (
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={(e) => {
                e.stopPropagation();
                onRemoveMeal();
              }}
              sx={{ 
                textTransform: 'none',
                ml: 'auto'  // Push to the right
              }}
            >
              Remove
            </Button>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default MealSlot;
