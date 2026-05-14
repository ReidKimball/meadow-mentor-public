'use client';

import { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, TextField, Select, MenuItem, FormControl, InputLabel, Chip, CircularProgress } from '@mui/material';
import { Search as SearchIcon, CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { getPublicFoodsByDiet, getDietDetailsByCode, FoodItem, DietDetails } from '@/lib/api';

const gapsImage = 'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/chefs_prep_table_gaps_nbp_v3.webp';
const medImage = 'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/chefs_prep_table_mediterranean_nbp_v1.webp';
const paleoImage = 'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/chefs_prep_table_paleo_aip_nbp_v1.webp';
const scdImage = 'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/chefs_prep_table_scd_nbp_v3.webp';
const lowfiberImage = 'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/chefs_prep_table_low_fiber_concept_nbp_v2.webp'

/**
 * SafeFoodsSection - "Instantly Know Which Foods Are Safe"
 * 
 * Features:
 * - Live ingredient search demo
 * - Diet selection dropdown
 * - Real-time results from food database
 */
export default function SafeFoodsSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiet, setSelectedDiet] = useState('SCD');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allFoods, setAllFoods] = useState<FoodItem[]>([]);
  const [currentImage, setCurrentImage] = useState(scdImage);
  const [dietDetails, setDietDetails] = useState<DietDetails | null>(null);

  const diets = [
    { 
      code: 'SCD', 
      name: 'Specific Carbohydrate Diet',
      description: 'A therapeutic diet designed to help manage digestive conditions by eliminating complex carbohydrates and focusing on nutrient-dense, easily digestible foods.'
    },
    { 
      code: 'GAPS', 
      name: 'GAPS Protocol',
      description: 'Gut and Psychology Syndrome diet that heals the gut lining and restores healthy gut flora through nutrient-dense, easily digestible foods.'
    },
    { 
      code: 'Paleo AIP', 
      name: 'Paleo Autoimmune Protocol',
      description: 'An elimination diet that removes foods that may trigger inflammation and autoimmune responses, focusing on nutrient-dense whole foods.'
    },
    { 
      code: 'Mediterranean', 
      name: 'Mediterranean Diet',
      description: 'A heart-healthy eating pattern rich in fruits, vegetables, whole grains, legumes, and healthy fats, inspired by traditional Mediterranean cuisine.'
    },
    { 
      code: 'Low Fiber', 
      name: 'Low Fiber',
      description: 'A diet that eliminates high fiber foods to help manage digestive conditions.',
    },
  ];

  const dietImageMap: Record<string, string> = {
    SCD: scdImage,
    GAPS: gapsImage,
    'Paleo AIP': paleoImage,
    Mediterranean: medImage,
    'Low Fiber': lowfiberImage,
  };

  // Update image when diet changes
  useEffect(() => {
    setCurrentImage(dietImageMap[selectedDiet]);
  }, [selectedDiet]);

  // Fetch diet details when a diet is selected
  useEffect(() => {
    const fetchDietDetails = async () => {
      if (!selectedDiet) return;
      const details = await getDietDetailsByCode(selectedDiet);
      setDietDetails(details);
    };

    fetchDietDetails();
  }, [selectedDiet]);

  // Fetch food list when a diet is selected
  useEffect(() => {
    const fetchFoods = async () => {
      if (selectedDiet) {
        setIsLoading(true);
        setAllFoods([]);
        try {
          const foodObjects = await getPublicFoodsByDiet(selectedDiet);
          setAllFoods(foodObjects);
          console.log(`[SafeFoodsSection] Successfully fetched ${foodObjects.length} foods for diet: ${selectedDiet}`);
        } catch (error) {
          console.error('[SafeFoodsSection] Error fetching food list:', error);
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

    const filtered = allFoods
      .filter(food => 
        food && food.food_name && food.food_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 5);

    setSearchResults(filtered);
  }, [searchQuery, allFoods]);

  const handleDietChange = (event: any) => {
    setSelectedDiet(event.target.value);
    setSearchQuery('');
    setSearchResults([]);
  };
  return (
    <Box
      sx={{
        py: { xs: 6, md: 10 },
        background: 'linear-gradient(135deg, #e3f2fd 0%, #f1f8e9 100%)',
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
              variant="h2"
              sx={{
                fontSize: { xs: '2rem', md: '2.75rem' },
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
                width: { xs: '90%', sm: '75%', md: '100%' },
                height: { xs: '300px', sm: '400px', md: '480px' },
                borderRadius: 2,
                overflow: 'hidden',
                mx: { xs: 'auto', md: 0 },
                mb: 2,
                position: 'relative',
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  style={{ width: '100%', height: '100%', position: 'relative' }}
                >
                  <Image
                    src={currentImage}
                    alt={`Image representing the ${selectedDiet} diet`}
                    fill
                    style={{ objectFit: 'cover' }}
                    priority
                  />
                </motion.div>
              </AnimatePresence>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                {dietDetails?.diet_name || diets.find(d => d.code === selectedDiet)?.name}
              </Typography>
              <Typography sx={{ color: '#666', lineHeight: 1.6 }}>
                {dietDetails?.description || diets.find(d => d.code === selectedDiet)?.description}
              </Typography>
            </Box>
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
                  mb: 3,
                  fontWeight: 600,
                  color: '#1a1a1a',
                  textAlign: 'center',
                }}
              >
                Try it now - Search any ingredient
              </Typography>

              {/* Diet Selection */}
              <FormControl fullWidth sx={{ mb: 3 }}>
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
                  startAdornment: <SearchIcon style={{ marginRight: 8, color: '#999' }} size={20} />,
                }}
                sx={{ mb: 2 }}
              />

              {/* Loading State */}
              {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )}

              {/* Search Results */}
              <Box>
                <AnimatePresence>
                  {searchResults.length > 0 && !isLoading && (
                    <motion.div
                      initial={{ opacity: 0, scaleY: 0.8 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      exit={{ opacity: 0, scaleY: 0.8 }}
                      transition={{ duration: 0.3 }}
                      style={{ transformOrigin: 'top' }}
                    >
                      <Typography variant="subtitle2" sx={{ mb: 2, color: '#666', mt: 2 }}>
                        Results for "{searchQuery}":
                      </Typography>
                      {searchResults.map((food, index) => (
                        <motion.div
                          key={food.food_name}
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
                            <Typography sx={{ fontWeight: 500, textTransform: 'capitalize' }}>
                              {food.food_name}
                            </Typography>
                            <Chip
                              icon={food.allowed ? <CheckCircle size={16} /> : <XCircle size={16} />}
                              label={food.allowed ? 'Aligned' : 'Not Aligned'}
                              size="small"
                              sx={{
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
}
