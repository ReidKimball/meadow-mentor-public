import React, { useState } from 'react';
import { Box, Typography, Button, Stack, CircularProgress } from '@mui/material';
import { Settings, Add } from '@mui/icons-material';
import MealPlanCard from './MealPlanCard';

/**
 * Meal Plans Library View
 * Displays all saved meal plan templates with expandable cards
 */
const MealPlansLibrary = ({
  savedMealPlans,
  loadingPlans,
  onOpenSettings,
  onGenerateNewPlan,
  onAssignPlan,
  onViewPlan,
  onDuplicatePlan,
  onDeletePlan,
  isAdmin,
  onVisibilityChange,
  onEditPlanName,
  editingPlanId,
  editingPlanName,
  onStartEditingPlanName,
  onSaveEditedPlanName,
  onCancelEditingPlanName,
  isGenerating,
}) => {
  const [expandedPlanId, setExpandedPlanId] = useState(null);

  const handleToggleExpand = (planId) => {
    setExpandedPlanId(expandedPlanId === planId ? null : planId);
  };

  return (
    <Box>
      {/* Header with Settings and Generate buttons */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Your Meal Plans
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Settings />}
            onClick={onOpenSettings}
            sx={{ textTransform: 'none' }}
          >
            Settings
          </Button>
          <Button
            variant="contained"
            startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <Add />}
            onClick={onGenerateNewPlan}
            disabled={isGenerating}
            sx={{ textTransform: 'none' }}
          >
            {isGenerating ? 'Generating...' : 'Generate New Plan'}
          </Button>
        </Box>
      </Box>

      {/* Loading State */}
      {loadingPlans && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Empty State */}
      {!loadingPlans && savedMealPlans.length === 0 && (
        <Box 
          sx={{ 
            textAlign: 'center', 
            py: 8,
            px: 2,
            bgcolor: 'background.default',
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" gutterBottom color="text.secondary">
            No meal plans yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Generate your first meal plan to get started!
          </Typography>
          <Button
            variant="contained"
            startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <Add />}
            onClick={onGenerateNewPlan}
            disabled={isGenerating}
            sx={{ textTransform: 'none' }}
          >
            {isGenerating ? 'Generating...' : 'Generate New Plan'}
          </Button>
        </Box>
      )}

      {/* Meal Plan Cards */}
      {!loadingPlans && savedMealPlans.length > 0 && (
        <Stack spacing={2}>
          {savedMealPlans.map((plan) => (
            <MealPlanCard
              key={plan._id}
              plan={plan}
              isAdmin={isAdmin}
              onVisibilityChange={onVisibilityChange}
              isExpanded={expandedPlanId === plan._id}
              onToggleExpand={() => handleToggleExpand(plan._id)}
              onAssign={() => onAssignPlan(plan)}
              onView={() => onViewPlan(plan)}
              onDuplicate={() => onDuplicatePlan(plan)}
              onDelete={() => onDeletePlan(plan)}
              isEditingName={editingPlanId === plan._id}
              editingName={editingPlanName}
              onStartEditingName={(e) => onStartEditingPlanName(plan, e)}
              onSaveEditedName={onSaveEditedPlanName}
              onCancelEditingName={onCancelEditingPlanName}
              onEditNameChange={onEditPlanName}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default MealPlansLibrary;
