import React from 'react';
import PropTypes from 'prop-types';
import { Box, TextField, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { Search as SearchIcon } from 'lucide-react';

/**
 * FoodSearch - Handles search and filtering of food items
 * 
 * @param {Object} props - Component props
 * @param {string} props.searchQuery - Current search query
 * @param {string} props.filter - Current filter ('ALL', 'ALLOWED', 'NOT_ALLOWED')
 * @param {Function} props.onSearchChange - Handler for search input changes
 * @param {Function} props.onFilterChange - Handler for filter changes
 * @returns {JSX.Element} The rendered FoodSearch component
 */
const FoodSearch = ({ 
  searchQuery = '', 
  filter = 'ALL', 
  onSearchChange = () => {}, 
  onFilterChange = () => {} 
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search foods..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        InputProps={{
          startAdornment: <SearchIcon style={{ marginRight: 8, color: 'action.active' }} />,
        }}
        sx={{ mb: 2 }}
      />
      
      {/* This needs to be removed, not using "allowed" or "not allowed" language anymore */}
      <ToggleButtonGroup
        value={filter}
        exclusive
        onChange={(_, newFilter) => {
          if (newFilter !== null) onFilterChange(newFilter);
        }}
        aria-label="food filter"
        fullWidth
      >
        <ToggleButton value="ALL" aria-label="show all">
          All
        </ToggleButton>
        <ToggleButton value="ALLOWED" aria-label="show allowed">
          A Good Match
        </ToggleButton>
        <ToggleButton value="NOT_ALLOWED" aria-label="show not allowed">
          Poor alignment
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

FoodSearch.propTypes = {
  searchQuery: PropTypes.string,
  filter: PropTypes.oneOf(['ALL', 'ALLOWED', 'NOT_ALLOWED']),
  onSearchChange: PropTypes.func,
  onFilterChange: PropTypes.func,
};

export default FoodSearch;
