import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { useUser } from '../../../context/UserContext';
import foodDbService from '../../../services/foodDbService';
import FoodSearch from './FoodSearch';
import FoodDbList from './FoodDbList';
import FoodDetailModal from './FoodDetailModal';

/**
 * FoodCompassPage - Main container component for the Food Compass feature
 * Fetches and displays food items based on the user's primary diet
 * 
 * @returns {JSX.Element} The rendered FoodCompassPage component
 */
const FoodCompassPage = () => {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [foods, setFoods] = useState([]);
  const [filteredFoods, setFilteredFoods] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [selectedFood, setSelectedFood] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch foods when component mounts or user changes
  useEffect(() => {
    const fetchFoods = async () => {
      console.log('Fetching foods...');
      if (!user?.primaryDiet) {
        console.log('No primary diet selected');
        setError('No primary diet selected');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        console.log('Calling getFoodsByDiet with diet:', user.primaryDiet);
        const foodItems = await foodDbService.getFoodsByDiet(user.primaryDiet);
        console.log('Received food items:', foodItems);
        setFoods(foodItems);
        setFilteredFoods(foodItems);
      } catch (err) {
        console.error('Error loading foods:', err);
        setError('Failed to load food database. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFoods();
  }, [user?.primaryDiet]);

  // Apply search and filter to foods
  useEffect(() => {
    let result = [...foods];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(food => 
        food.name.toLowerCase().includes(query) ||
        (food.description && food.description.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter
    if (filter !== 'ALL') {
      result = result.filter(food => food.status === filter);
    }
    
    setFilteredFoods(result);
  }, [foods, searchQuery, filter]);

  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  const handleSelectFood = (food) => {
    setSelectedFood(food);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedFood(null);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {user?.primaryDiet} Food Compass
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Get instant clarity on any food.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Debug Info */}
      {user?.isAdmin && (
      <div style={{ marginBottom: '1rem' }}>
        <Typography variant="subtitle2" color="text.secondary">
          Debug Info:
        </Typography>
        <Typography variant="caption" component="div">
          User Diet: {user?.primaryDiet || 'Not set'}
        </Typography>
        <Typography variant="caption" component="div">
          Loading: {isLoading ? 'Yes' : 'No'}
        </Typography>
        <Typography variant="caption" component="div">
          Total Foods: {foods.length}
        </Typography>
        <Typography variant="caption" component="div">
          Filtered Foods: {filteredFoods.length}
        </Typography>
      </div>
      )}
      
      <FoodSearch 
        searchQuery={searchQuery}
        filter={filter}
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
      />

      <FoodDbList 
        foods={filteredFoods}
        isLoading={isLoading}
        onSelectFood={handleSelectFood}
      />

      {selectedFood && (
        <FoodDetailModal
          food={selectedFood}
          open={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </Box>
  );
};

export default FoodCompassPage;
