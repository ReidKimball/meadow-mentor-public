import React from 'react';
import { Box, Typography, IconButton, Button, Paper, Grid, Chip, Tooltip } from '@mui/material';
import { ChevronLeft, ChevronRight, CalendarMonth, MenuBook, LinkOff } from '@mui/icons-material';
import MealSlot from './MealSlot';

/**
 * Calendar View Component
 * Shows the day view with meal slots (read-only, no action buttons)
 */
const CalendarView = ({
  selectedDate,
  onPrevDay,
  onNextDay,
  onOpenCalendar,
  generatedMealPlan,
  currentDayIndex,
  onMealClick,
  onUnassign,
}) => {
  const currentDay = generatedMealPlan?.days?.[currentDayIndex];

  return (
    <Box>
      {/* Date Navigation Header */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <IconButton onClick={onPrevDay}>
            <ChevronLeft />
          </IconButton>

          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {selectedDate.format('dddd')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {selectedDate.format('MMMM DD, YYYY')}
            </Typography>
            {generatedMealPlan && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 1 }}>
                <Chip
                  label={generatedMealPlan.planName}
                  size="small"
                  color="primary"
                />
                <Tooltip title="Unassign from this date" arrow>
                  <IconButton
                    size="small"
                    onClick={onUnassign}
                    sx={{
                      '&:hover': {
                        color: 'error.main',
                      },
                    }}
                  >
                    <LinkOff fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>

          <IconButton onClick={onNextDay}>
            <ChevronRight />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Tooltip title="Open calendar picker" arrow>
            <Button
              variant="outlined"
              startIcon={<CalendarMonth />}
              onClick={onOpenCalendar}
              sx={{ textTransform: 'none' }}
            >
              View Date
            </Button>
          </Tooltip>
        </Box>
      </Paper>

      {/* Meal Slots */}
      {currentDay ? (
        <Grid container spacing={3}>
          {['breakfast', 'lunch', 'dinner', 'snack'].map((mealType) => {
            const meal = currentDay.meals[mealType];
            if (!meal) return null;

            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={mealType} sx={{ width: '100%' }}>
                <MealSlot
                  mealType={mealType}
                  meal={meal}
                  onMealClick={onMealClick}
                  readOnly={true}
                />
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Paper 
          elevation={1} 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            bgcolor: 'background.default',
          }}
        >
          <MenuBook sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom color="text.secondary">
            No meal plan for this date
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Generate a new plan or assign an existing one from the Meal Plans tab
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default CalendarView;
