import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  IconButton,
  Button,
  Collapse,
  Chip,
  Stack,
  TextField,
  Tooltip,
  Divider,
  MenuItem,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  CalendarMonth,
  Visibility,
  ContentCopy,
  Delete,
  Edit,
  Check,
  Close,
} from '@mui/icons-material';
import dayjs from 'dayjs';

/**
 * Expandable Meal Plan Card Component
 * Shows plan summary when collapsed, full details when expanded
 */
const MealPlanCard = ({
  plan,
  isAdmin,
  onVisibilityChange,
  isExpanded,
  onToggleExpand,
  onAssign,
  onView,
  onDuplicate,
  onDelete,
  isEditingName,
  editingName,
  onStartEditingName,
  onSaveEditedName,
  onCancelEditingName,
  onEditNameChange,
}) => {
  // Use ref for better performance (prevents re-renders on every keystroke)
  const nameInputRef = React.useRef(null);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSaveEditedName(nameInputRef.current?.value);
    } else if (e.key === 'Escape') {
      onCancelEditingName();
    }
  };

  const handleSaveClick = () => {
    onSaveEditedName(nameInputRef.current?.value);
  };

  const currentVisibility = plan.visibility || 'private';

  return (
    <Card 
      elevation={2}
      sx={{
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          elevation: 4,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent>
        {/* Header - Always Visible */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1, mr: 2 }}>
            {/* Plan Name - Editable */}
            {isEditingName ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  inputRef={nameInputRef}
                  defaultValue={editingName}
                  onKeyDown={handleKeyPress}
                  size="small"
                  autoFocus
                  fullWidth
                  sx={{ maxWidth: 400 }}
                />
                <Tooltip title="Save" arrow>
                  <IconButton size="small" onClick={handleSaveClick} color="primary">
                    <Check fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Cancel" arrow>
                  <IconButton size="small" onClick={onCancelEditingName}>
                    <Close fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {plan.planName}
                </Typography>
                <Tooltip title="Edit plan name" arrow>
                  <IconButton size="small" onClick={onStartEditingName}>
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}

            {/* Metadata */}
            <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
              <Chip 
                label={`${plan.duration} ${plan.duration === 1 ? 'day' : 'days'}`}
                size="small"
                color="primary"
                variant="outlined"
              />
              {plan.timesUsed > 0 && (
                <Typography variant="body2" color="text.secondary">
                  Used {plan.timesUsed} {plan.timesUsed === 1 ? 'time' : 'times'}
                </Typography>
              )}
              {plan.lastUsedDate && (
                <Typography variant="body2" color="text.secondary">
                  Last: {dayjs(plan.lastUsedDate).format('MMM DD, YYYY')}
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isAdmin && (
              <TextField
                select
                size="small"
                value={currentVisibility}
                onChange={(e) => onVisibilityChange && onVisibilityChange(plan, e.target.value)}
                sx={{ minWidth: 140 }}
              >
                <MenuItem value="private">Private</MenuItem>
                <MenuItem value="unlisted">Unlisted</MenuItem>
                <MenuItem value="public">Public</MenuItem>
              </TextField>
            )}

            {/* Expand/Collapse Button */}
            <Tooltip title={isExpanded ? 'Collapse' : 'Expand'} arrow>
              <IconButton onClick={onToggleExpand}>
                {isExpanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Expanded Content */}
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <Divider sx={{ my: 2 }} />
          
          {/* Meal Details */}
          <Stack spacing={2} sx={{ mb: 3 }}>
            {plan.days?.map((day, index) => (
              <Box key={index}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Day {day.dayNumber || index + 1}
                </Typography>
                <Stack spacing={0.5} sx={{ pl: 2 }}>
                  {['breakfast', 'lunch', 'dinner', 'snack'].map((mealType) => {
                    const meal = day.meals[mealType];
                    if (!meal) return null;
                    
                    return (
                      <Typography key={mealType} variant="body1" color="text.secondary">
                        • <strong>{mealType.charAt(0).toUpperCase() + mealType.slice(1)}:</strong>{' '}
                        {meal.recipeTitle || meal.title}
                        {meal.isPlaceholder && (
                          <Chip 
                            label="Placeholder" 
                            size="small" 
                            color="warning" 
                            sx={{ ml: 1, height: 20 }} 
                          />
                        )}
                      </Typography>
                    );
                  })}
                </Stack>
              </Box>
            ))}
          </Stack>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<CalendarMonth />}
              onClick={onAssign}
              sx={{ textTransform: 'none' }}
            >
              Assign to Date
            </Button>
            <Button
              variant="outlined"
              startIcon={<Visibility />}
              onClick={onView}
              sx={{ textTransform: 'none' }}
            >
              View Details
            </Button>
            <Button
              variant="outlined"
              startIcon={<ContentCopy />}
              onClick={onDuplicate}
              sx={{ textTransform: 'none' }}
            >
              Duplicate
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={onDelete}
              sx={{ textTransform: 'none' }}
            >
              Delete
            </Button>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default MealPlanCard;
