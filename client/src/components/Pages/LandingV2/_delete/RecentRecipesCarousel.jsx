import React, { useState, useEffect } from 'react';
import Slider from 'react-slick';
import { Box, Typography, CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { getRecentPublicRecipes } from '../../../services/recipeService';
import RecipeSummaryCard from '../../features/recipes/RecipeSummaryCard';

// Import slick-carousel styles
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const dietOptions = [
  'All',
  'SCD',
  'GAPS',
  'Paleo AIP',
  'Mediterranean',
];

const RecentRecipesCarousel = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDiet, setSelectedDiet] = useState('All');

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        const response = await getRecentPublicRecipes(selectedDiet);
        if (response.success) {
          setRecipes(response.data);
        } else {
          setError(response.message || 'Failed to fetch recipes.');
        }
      } catch (err) {
        setError(err.message || 'An error occurred while fetching recipes.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [selectedDiet]);

  const handleDietChange = (event) => {
    setSelectedDiet(event.target.value);
  };

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{
      py: 4,
      px: 2,
      '& .slick-dots': {
        bottom: -30, // Adjust position to be lower
      },
      '& .slick-dots li button:before': {
        fontSize: '12px', // Increase dot size
        color: 'primary.main',
      },
      '& .slick-dots li.slick-active button:before': {
        opacity: 1,
        color: 'secondary.main',
      },
    }}>
        <Typography variant="h4" component="h2" textAlign="center" gutterBottom>
            Latest Community Recipes
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <FormControl sx={{ m: 1, minWidth: 200, mb: 3 }}>
            <InputLabel id="diet-filter-label">Filter by Diet</InputLabel>
            <Select
              labelId="diet-filter-label"
              id="diet-filter-select"
              value={selectedDiet}
              label="Filter by Diet"
              onChange={handleDietChange}
            >
              {dietOptions.map((diet) => (
                <MenuItem key={diet} value={diet}>
                  {diet}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

      <Slider {...settings}>
        {recipes.map((recipe) => (
          <Box key={recipe._id} sx={{ p: 2 }}>
            <RecipeSummaryCard recipe={recipe} />
          </Box>
        ))}
      </Slider>
    </Box>
  );
};

export default RecentRecipesCarousel;
