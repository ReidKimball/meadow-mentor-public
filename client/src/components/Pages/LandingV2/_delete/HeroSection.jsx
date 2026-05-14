import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Chip,
  CircularProgress,
  Paper
} from '@mui/material';
import { Search as SearchIcon, CheckCircle, XCircle } from 'lucide-react';
import foodDbService, { getDietDetailsByCode } from '../../../services/foodDbService';

// Import diet-specific images
const scdImage = 'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/scd_recipe_card_header.webp';
const gapsImage = 'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/gaps_recipe_card_header.webp';
const paleoImage = 'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/paleo_aip_recipe_card_header.webp';
const medImage = 'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/mediterranean_recipe_card_header.webp';

/**
 * HeroSection - "Instantly Know Which Foods Are Safe"
 * 
 * Features:
 * - Live ingredient search demo
 * - Diet selection dropdown
 * - Real-time results from food database
 * - Immediate value demonstration
 */
const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiet, setSelectedDiet] = useState('SCD');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allFoods, setAllFoods] = useState([]);
  const [currentImage, setCurrentImage] = useState(scdImage); // Default image
  const [dietDetails, setDietDetails] = useState(null);

  // Available therapeutic diets
  const diets = [
    { code: 'SCD', name: 'Specific Carbohydrate Diet' },
    { code: 'GAPS', name: 'GAPS Protocol' },
    { code: 'Paleo AIP', name: 'Paleo Autoimmune Protocol' },
    { code: 'Mediterranean', name: 'Mediterranean Diet' },
  ];

  const dietImageMap = {
    SCD: scdImage,
    GAPS: gapsImage,
    'Paleo AIP': paleoImage,
    Mediterranean: medImage,
  };

  // Update image when diet changes
  useEffect(() => {
    setCurrentImage(dietImageMap[selectedDiet]);
  }, [selectedDiet]);

  // Fetch diet details when a diet is selected
  useEffect(() => {
    const fetchDietDetails = async () => {
      if (!selectedDiet) return;
      try {
        const details = await getDietDetailsByCode(selectedDiet);
        setDietDetails(details);
      } catch (error) {
        console.error('Failed to fetch diet details', error);
        setDietDetails(null); // Reset on error
      }
    };

    fetchDietDetails();
  }, [selectedDiet]);

  // Fetch food list when a diet is selected
  useEffect(() => {
    const fetchFoods = async () => {
      if (selectedDiet) {
        setIsLoading(true);
        setAllFoods([]); // Clear previous options
        try {
          // Use the new public function to fetch food names
          const foodObjects = await foodDbService.getPublicFoodsByDiet(selectedDiet);
          // The public endpoint returns an array of objects
          console.log('[HeroSection] Fetched data from API:', foodObjects);
          setAllFoods(foodObjects);
          console.log(`[HeroSection] Successfully fetched and set ${foodObjects.length} foods for diet: ${selectedDiet}`);
        } catch (error) {
          console.error("[HeroSection] Error fetching food list:", error);
          // Optionally, set an error state to show in the UI
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchFoods();
  }, [selectedDiet]);

  // Filter foods based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    if (allFoods.length > 0) {
      console.log('[HeroSection] Inspecting first food item:', allFoods[0]);
    }

    console.log(`[HeroSection] Filtering allFoods (${allFoods.length} items) with query: "${searchQuery}"`);

    const filtered = allFoods
      .filter(food => 
        food && food.food_name && food.food_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 5); // Show top 5 results

    console.log('[HeroSection] Filtered results:', filtered);
    setSearchResults(filtered);
  }, [searchQuery, allFoods]);

  const handleDietChange = (event) => {
    setSelectedDiet(event.target.value);
    setSearchQuery(''); // Clear search when diet changes
    setSearchResults([]);
  };

  return (
    <Box
      sx={{
        py: { xs: 6, md: 10 },
        background: 'linear-gradient(135deg, #e3f2fd 0%, #f1f8e9 100%)', // Soft blue to green gradient
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            gap: { xs: 4, md: 8 },
          }}
        >
          {/* Left side - Copy */}
          <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
            <Typography
              variant="h1"
              sx={{
                fontFamily: 'var(--font-heading)', // Apply font directly here
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                fontWeight: 700,
                color: '#1a1a1a',
                mb: 3,
                lineHeight: 1.2,
              }}
            >
              Instantly Know Which Foods Are Safe
            </Typography>
            
            <Typography
              variant="h6"
              sx={{
                fontFamily: 'var(--font-body)', // Apply font directly here
                fontSize: { xs: '1.1rem', md: '1.25rem' },
                color: '#555',
                mb: 4,
                lineHeight: 1.6,
                maxWidth: '500px',
                mx: { xs: 'auto', md: 0 },
              }}
            >
              Stop the endless, confusing Google searches. Just type in an ingredient to get a clear 'aligned' or 'not aligned' answer for your therapeutic diet.
            </Typography>

            {/* Dynamic Food Image */}
            <Box
              sx={{
                width: { xs: '90%', sm: '75%', md: '480px' },
                height: { xs: '300px', sm: '75%', md: '480px' },
                borderRadius: 2,
                overflow: 'hidden',
                display: 'flex',
                mx: { xs: 'auto', md: 0 },
                mb: 2,
                position: 'relative', // Needed for AnimatePresence
              }}
            >
              <AnimatePresence>
                <motion.img
                  key={currentImage} // Animate when the image key (source) changes
                  src={currentImage}
                  alt={`Image representing the ${selectedDiet} diet`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    position: 'static',
                  }}
                />
              </AnimatePresence>
            </Box>
            {dietDetails && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6" sx={{ fontFamily: 'var(--font-heading)', fontWeight: 600, color: '#1a1a1a' }}>
                  {dietDetails.diet_name}
                </Typography>
                <Typography sx={{ fontFamily: 'var(--font-body)', color: '#666', lineHeight: 1.6 }}>
                  {dietDetails.description}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Right side - Live Demo */}
          <Box sx={{ flex: 1, width: '100%', maxWidth: '500px' }}>
            <Paper
              elevation={3}
              sx={{
                p: 4,
                borderRadius: 3,
                backgroundColor: 'white',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontFamily: 'var(--font-heading)',
                  mb: 3,
                  fontWeight: 600,
                  color: '#1a1a1a',
                  textAlign: 'center',
                }}
              >
                Try it now - Search any ingredient
              </Typography>

              {/* Diet Selection */}
              <FormControl fullWidth sx={{ fontFamily: 'var(--font-body)', mb: 3 }}>
                <InputLabel>Select Your Diet</InputLabel>
                <Select
                  value={selectedDiet}
                  onChange={handleDietChange}
                  label="Select Your Diet"
                >
                  {diets.map((diet) => (
                    <MenuItem key={diet.code} value={diet.code}>
                      {diet.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Search Input */}
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Try typing 'apple', 'wheat', or 'honey'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon style={{ marginRight: 8, color: '#999' }} />,
                }}
                sx={{ fontFamily: 'var(--font-body)', mb: 2 }}
              />

              {/* Loading State */}
              {isLoading && (
                <Box sx={{ fontFamily: 'var(--font-body)', display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )}

              {/* Search Results Container with Animation */}
              <Box> 
                <AnimatePresence>
                  {searchResults.length > 0 && !isLoading && (
                    <motion.div
                      layout // This prop enables smooth animation of size and position changes
                      style={{ transformOrigin: 'top' }} // Ensures the animation expands downwards
                      initial={{ opacity: 0, scaleY: 0.8 }} // Start slightly scaled down
                      animate={{ opacity: 1, scaleY: 1 }}
                      exit={{ opacity: 0, scaleY: 0.8 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                      <Typography variant="subtitle2" sx={{ fontFamily: 'var(--font-body)', mb: 2, color: '#666', mt: 2 }}>
                        Results for "{searchQuery}":
                      </Typography>
                      {searchResults.map((food, index) => (
                        <motion.div
                          key={food.food_name} // Use a stable key for animation
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              py: 1.5,
                              px: 2,
                              mb: 1,
                              backgroundColor: food.allowed ? '#e8f5e8' : '#ffeaea',
                              borderRadius: 2,
                              border: `1px solid ${food.allowed ? '#c8e6c9' : '#ffcdd2'}`,
                            }}
                          >
                            <Typography sx={{ fontFamily: 'var(--font-body)', fontWeight: 500, textTransform: 'capitalize' }}>
                              {food.food_name}
                            </Typography>
                            <Chip
                              icon={food.allowed ? <CheckCircle size={16} /> : <XCircle size={16} />}
                              label={food.allowed ? 'Aligned' : 'Not Aligned'}
                              size="small"
                              sx={{
                                fontFamily: 'var(--font-body)',
                                backgroundColor: food.allowed ? '#4caf50' : '#f44336',
                                color: 'white',
                                fontWeight: 600,
                              }}
                            />
                          </Box>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Box>

              {/* No Results Message */}
              {searchQuery && searchResults.length === 0 && !isLoading && (
                <Typography
                  sx={{
                    fontFamily: 'var(--font-body)',
                    textAlign: 'center',
                    color: '#666',
                    py: 2,
                    fontStyle: 'italic',
                  }}
                >
                  No results found. Try a different ingredient.
                </Typography>
              )}
            </Paper>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default HeroSection;
