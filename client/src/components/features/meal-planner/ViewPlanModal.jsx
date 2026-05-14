/**
 * @file Defines the ViewPlanModal component.
 * @description Renders a detailed meal plan preview modal with per-meal actions and bulk utilities.
 * @requires module:react - React library for state management.
 * @requires module:@mui/material - UI components for layout and controls.
 * @author Cascade
 * @version 1.0.0
 * @date 2026-01-18
 */

// React/Third-Party Libraries
import React, { useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  IconButton,
  Stack,
  Tooltip,
  Divider,
  Button,
  CircularProgress,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import dayjs from 'dayjs';

// Internal Components
import MealSlot from './MealSlot';
import RecipePickerModal from './RecipePickerModal';

/**
 * @component ViewPlanModal
 * @description Displays a meal plan template in a modal with per-meal actions and bulk list actions.
 * @param {object} props - Component props.
 * @param {boolean} props.open - Whether the modal is open.
 * @param {Function} props.onClose - Handler to close the modal.
 * @param {object} props.plan - Meal plan data to display.
 * @param {Function} props.onMealClick - Handler for clicking a meal slot.
 * @param {Function} props.onGenerateRecipe - Handler for generating a recipe.
 * @param {Function} props.onGeneratePlaceholder - Handler for generating placeholders.
 * @param {Function} props.onReplaceMeal - Handler for replacing a meal with a saved recipe.
 * @param {Function} props.onSurpriseMe - Handler for surprise recipe selection.
 * @param {Function} props.onEditMeal - Handler for editing meal text fields.
 * @param {Function} props.onRemoveMeal - Handler for removing a meal.
 * @param {string|null} props.generatingRecipe - Current meal type being generated.
 * @param {Function} props.onAddPlanIngredients - Handler to add all plan ingredients to shopping list.
 * @param {boolean} props.isAddingPlanIngredients - Whether the bulk add action is in progress.
 * @returns {JSX.Element|null} The rendered modal or null if no plan is provided.
 */
const ViewPlanModal = ({ 
  open, 
  onClose, 
  plan,
  onMealClick,
  onGenerateRecipe,
  onGeneratePlaceholder,
  onReplaceMeal,
  onSurpriseMe,
  onEditMeal,
  onRemoveMeal,
  generatingRecipe,
  onAddPlanIngredients,
  isAddingPlanIngredients,
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedMealForReplace, setSelectedMealForReplace] = useState(null);
  
  if (!plan) return null;
  
  const handleOpenPicker = (dayIndex, mealType, meal) => {
    console.log('Opening recipe picker for:', dayIndex, mealType);
    
    // Get recipeDiet from the meal, or find it from any existing meal in the plan
    let recipeDiet = meal?.recipeDiet;
    if (!recipeDiet && plan?.days) {
      // Search through all days and meals to find a recipeDiet
      for (const day of plan.days) {
        for (const mealKey of ['breakfast', 'lunch', 'dinner', 'snack']) {
          if (day.meals[mealKey]?.recipeDiet) {
            recipeDiet = day.meals[mealKey].recipeDiet;
            break;
          }
        }
        if (recipeDiet) break;
      }
    }
    // Default to 'SCD' if no diet found
    recipeDiet = recipeDiet || 'SCD';
    
    setSelectedMealForReplace({ dayIndex, mealType, meal, recipeDiet });
    setPickerOpen(true);
  };
  
  const handleSelectRecipe = (recipe) => {
    console.log('Recipe selected from picker:', recipe.recipeTitle);
    if (selectedMealForReplace && onReplaceMeal) {
      onReplaceMeal(
        selectedMealForReplace.dayIndex,
        selectedMealForReplace.mealType,
        recipe
      );
    }
    setPickerOpen(false);
    setSelectedMealForReplace(null);
  };

  return (
    <>
    <Modal open={open} onClose={onClose} aria-labelledby="view-plan-modal-title">
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '100%', sm: '90%', md: '80%', lg: '70%' },
          height: { xs: '100%', sm: 'auto' },
          maxHeight: { xs: '100%', sm: '90vh' },
          overflow: 'auto',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: { xs: 2, sm: 3, md: 4 },
          borderRadius: { xs: 0, sm: 2 },
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography id="view-plan-modal-title" variant="h5" component="h2">
            {plan.planName || 'Meal Plan Preview'}
          </Typography>
          <Tooltip title="Close" arrow>
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Plan Metadata */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            <strong>Duration:</strong> {plan.duration} {plan.duration === 1 ? 'day' : 'days'}
          </Typography>
          {plan.lastUsedDate && (
            <Typography variant="body1" color="text.secondary" gutterBottom>
              <strong>Last used:</strong> {dayjs(plan.lastUsedDate).format('MMM DD, YYYY')}
            </Typography>
          )}
          {plan.timesUsed > 0 && (
            <Typography variant="body1" color="text.secondary">
              <strong>Times used:</strong> {plan.timesUsed}
            </Typography>
          )}
        </Box>

        {/* Bulk plan actions */}
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => onAddPlanIngredients && onAddPlanIngredients(plan)}
            disabled={!onAddPlanIngredients || isAddingPlanIngredients}
            startIcon={
              isAddingPlanIngredients ? <CircularProgress size={18} color="inherit" /> : null
            }
          >
            {isAddingPlanIngredients ? 'Adding Ingredients...' : 'Add All Ingredients to Shopping List'}
          </Button>
        </Box>

        {/* Display all days using MealSlot components */}
        <Stack spacing={4}>
          {plan.days?.map((day, dayIndex) => (
            <Box key={dayIndex}>
              {/* Day Header */}
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                Day {day.dayNumber || dayIndex + 1}
              </Typography>
              
              {/* Meal Slots */}
              <Stack spacing={2}>
                {['breakfast', 'lunch', 'dinner', 'snack'].map((mealType) => {
                  const meal = day.meals[mealType];

                  return (
                    <MealSlot
                      key={mealType}
                      mealType={mealType}
                      meal={meal}
                      dayIndex={dayIndex}
                      onMealClick={onMealClick}
                      onGenerateRecipe={() => onGenerateRecipe(dayIndex, mealType)}
                      onGeneratePlaceholder={() => onGeneratePlaceholder && onGeneratePlaceholder(dayIndex, mealType)}
                      onReplaceMeal={() => handleOpenPicker(dayIndex, mealType, meal)}
                      onSurpriseMe={() => onSurpriseMe && onSurpriseMe(dayIndex, mealType)}
                      onEditMeal={(newTitle, newDescription) => {
                        if (onEditMeal) {
                          onEditMeal(plan._id, dayIndex, mealType, newTitle, newDescription);
                        }
                      }}
                      onRemoveMeal={() => onRemoveMeal && onRemoveMeal(dayIndex, mealType)}
                      isGenerating={generatingRecipe === mealType}
                    />
                  );
                })}
              </Stack>
              
              {/* Divider between days (except last day) */}
              {dayIndex < plan.days.length - 1 && (
                <Divider sx={{ mt: 4 }} />
              )}
            </Box>
          ))}
        </Stack>
      </Box>
    </Modal>
    
    {/* Recipe Picker Modal - Outside parent modal to avoid nesting issues */}
    <RecipePickerModal
      open={pickerOpen}
      onClose={() => {
        setPickerOpen(false);
        setSelectedMealForReplace(null);
      }}
      onSelectRecipe={handleSelectRecipe}
      mealType={selectedMealForReplace?.mealType}
      recipeDiet={selectedMealForReplace?.recipeDiet}
    />
  </>
  );
};

export default ViewPlanModal;
