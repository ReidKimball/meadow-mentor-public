import React from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  ListItemIcon,
  CircularProgress,
  Chip
} from '@mui/material';
import { CheckCircle, XCircle } from 'lucide-react';

/**
 * FoodDbList - Displays a list of food items with their status
 * 
 * @param {Object} props - Component props
 * @param {Array} props.foods - Array of food items to display
 * @param {boolean} props.isLoading - Loading state
 * @param {Function} props.onSelectFood - Handler for food item selection
 * @returns {JSX.Element} The rendered FoodDbList component
 */
const FoodDbList = ({ foods = [], isLoading = false, onSelectFood = () => {} }) => {
  console.log('FoodDbList - foods:', foods); // Debug log
  console.log('FoodDbList - isLoading:', isLoading); // Debug log

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!foods.length) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No foods found. Try adjusting your search or filters.
        </Typography>
        <Typography variant="caption" color="text.secondary" component="div">
          (Total items: {foods.length})
        </Typography>
      </Box>
    );
  }

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {foods.map((food, index) => (
        <ListItem 
          key={food._id || index}
          disablePadding
          divider={index < foods.length - 1}
          onClick={() => onSelectFood(food)}
          sx={{
            '&:hover': {
              backgroundColor: 'action.hover',
              cursor: 'pointer',
            },
          }}
        >
          <ListItemButton>
            <ListItemIcon>
              {food.status === 'ALLOWED' ? (
                <CheckCircle color="success" />
              ) : (
                <XCircle color="error" />
              )}
            </ListItemIcon>
            <ListItemText 
              primary={food.name}
              primaryTypographyProps={{
                fontWeight: 'medium',
                color: food.status === 'ALLOWED' ? 'success.main' : 'error.main',
              }}
              secondary={food.description ? food.description.substring(0, 100) + (food.description.length > 100 ? '...' : '') : null}
              secondaryTypographyProps={{ color: 'text.secondary' }}
            />
            {food.category && (
              <Chip 
                label={food.category} 
                size="small" 
                sx={{ ml: 1 }} 
              />
            )}
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
};

FoodDbList.propTypes = {
  foods: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      status: PropTypes.oneOf(['ALLOWED', 'NOT_ALLOWED']).isRequired,
      category: PropTypes.string,
    })
  ),
  isLoading: PropTypes.bool,
  onSelectFood: PropTypes.func,
};

export default FoodDbList;
