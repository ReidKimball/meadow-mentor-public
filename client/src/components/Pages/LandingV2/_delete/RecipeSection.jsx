import React from 'react';
import { Box, Container, Typography, Grid } from '@mui/material';
import { ChefHat, Sparkles, Heart } from 'lucide-react';

// Import food images
const waffles = 'https://storage.googleapis.com/meadow_mentor_public_media/images/scd_waffles.webp';
const energyBalls = 'https://storage.googleapis.com/meadow_mentor_public_media/images/mediterranean_energy_date_balls_SCD.webp';
const proscuittoDates = 'https://storage.googleapis.com/meadow_mentor_public_media/images/proscuitto_wrapped_dates_goat_cheese.webp';
import FinalCTA from './FinalCTA';
import MiniCTA from './MiniCTA';
import RecentRecipesCarousel from './RecentRecipesCarousel';

/**
 * RecipeSection - "Go From 'What Can I Eat?' to 'What Do I Want to Eat?'"
 * 
 * Purpose: Counter the despair of a restrictive diet with possibility
 * Features:
 * - Inspiring headline and copy
 * - Visual elements showing recipe generation
 * - Placeholder for recipe/food imagery
 */
const RecipeSection = () => {
  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: 'white',
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
          <Typography
            variant="h2"
            sx={{
              fontFamily: 'var(--font-heading)',
              fontSize: { xs: '2rem', md: '2.75rem' },
              fontWeight: 700,
              color: '#1a1a1a',
              mb: 3,
              lineHeight: 1.2,
            }}
          >
            Go From "What Can I Eat?" to "What Do I Want to Eat?"
          </Typography>
          
          <Typography
            variant="h6"
            sx={{
              fontFamily: 'var(--font-body)',
              fontSize: { xs: '1.1rem', md: '1.25rem' },
              color: '#555',
              lineHeight: 1.6,
              maxWidth: '700px',
              mx: 'auto',
            }}
          >
            Feeling stuck in a cycle of bland, repetitive meals? Instantly generate delicious recipes using only ingredients that are safe for your specific diet. Stop stressing about meal planning and start enjoying food again.
          </Typography>
        </Box>

        {/* Carousel for recent recipes */}
      <RecentRecipesCarousel />

        <Grid container spacing={{ xs: 3, md: 6 }} alignItems="center">
          {/* Left side - Visual features */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Feature 1 */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                <Box
                  sx={{
                    backgroundColor: '#e3f2fd',
                    borderRadius: '50%',
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 60,
                    minHeight: 60,
                  }}
                >
                  <ChefHat size={28} color="#1976d2" />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontFamily: 'var(--font-body)', fontWeight: 600, mb: 1, color: '#1a1a1a' }}>
                    Create Recipes
                  </Typography>
                  <Typography sx={{ fontFamily: 'var(--font-body)', color: '#666', lineHeight: 1.6 }}>
                    Tell us what ingredients you have, and we'll create delicious recipes that fit your therapeutic diet perfectly.
                  </Typography>
                </Box>
              </Box>

              {/* Feature 2 */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                <Box
                  sx={{
                    backgroundColor: '#f1f8e9',
                    borderRadius: '50%',
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 60,
                    minHeight: 60,
                  }}
                >
                  <Sparkles size={28} color="#2e7d32" />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontFamily: 'var(--font-body)', fontWeight: 600, mb: 1, color: '#1a1a1a' }}>
                    Adapt Any Meal
                  </Typography>
                  <Typography sx={{ fontFamily: 'var(--font-body)', color: '#666', lineHeight: 1.6 }}>
                    Love a dish but can't eat it? Adapt any recipe into a version you can enjoy safely.
                  </Typography>
                </Box>
              </Box>

              {/* Feature 3 */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                <Box
                  sx={{
                    backgroundColor: '#fff3e0',
                    borderRadius: '50%',
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 60,
                    minHeight: 60,
                  }}
                >
                  <Heart size={28} color="#f57c00" />
                </Box>

                <Box>
                  <Typography variant="h6" sx={{ fontFamily: 'var(--font-body)', fontWeight: 600, mb: 1, color: '#1a1a1a' }}>
                    Find Quick Snacks
                  </Typography>
                  <Typography sx={{ fontFamily: 'var(--font-body)', color: '#666', lineHeight: 1.6 }}>
                    Discover easy, delicious snacks that fit your therapeutic diet.
                  </Typography>
                </Box>
              </Box>
              <MiniCTA />
            </Box>
            
          </Grid>

          {/* Right side - Recipe imagery */}
          <Grid 
            item 
            xs={12} 
            md={6}
            sx={{ 
              display: 'flex',
              width: '100%',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                paddingTop: 2,
                gap: { xs: 2, sm: 8 },
                flexWrap: 'wrap', // Ensures responsiveness on smaller screens
                width: '100%',
                //bgcolor: 'lightblue',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {/* Image 1: Waffles */}
              <Box
                sx={{
                  width: { xs: '35%', sm: '40%', md: '45%' },
                  height: { xs: '35%', sm: '40%', md: '45%' },
                  borderRadius: 3,
                  overflow: 'hidden',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.08)',
                  transform: 'translateY(-15px) rotate(-8deg)',
                  
                }}
              >
                <img
                  src={waffles}
                  alt="Delicious gluten-free waffles"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
              
              {/* Image 2: Energy Balls */}
              <Box
                sx={{
                  width: { xs: '35%', sm: '40%', md: '45%' },
                  height: { xs: '35%', sm: '40%', md: '45%' },
                  borderRadius: 3,
                  overflow: 'hidden',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.08)',
                  transform: 'translateY(15px) rotate(8deg)',
                  
                }}
              >
                <img
                  src={energyBalls}
                  alt="Healthy energy balls snack"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>

              {/* Image 3: Prosciutto Dates (Center) */}
              <Box
                sx={{
                  width: { xs: '35%', sm: '40%', md: '45%' },
                  height: { xs: '35%', sm: '40%', md: '45%' },
                  borderRadius: 3,
                  overflow: 'hidden',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  transform: 'rotate(2deg) scale(1.05)',
                }}
              >
                <img
                  src={proscuittoDates}
                  alt="Prosciutto wrapped dates"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default RecipeSection;
