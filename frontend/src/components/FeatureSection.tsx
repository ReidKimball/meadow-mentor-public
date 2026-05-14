'use client';

import { Box, Container, Typography } from '@mui/material';
import { ChefHat, Sparkles, Heart, ForkKnife } from 'lucide-react';
import Image from 'next/image';
import SeeFeaturesButton from './SeeFeaturesButton';

const waffles = 'https://storage.googleapis.com/meadow_mentor_public_media/images/scd_waffles.webp';
const energyBalls = 'https://storage.googleapis.com/meadow_mentor_public_media/images/mediterranean_energy_date_balls_SCD.webp';
const proscuittoDates = 'https://storage.googleapis.com/meadow_mentor_public_media/images/proscuitto_wrapped_dates_goat_cheese.webp';

/**
 * FeatureSection - "Go From 'What Can I Eat?' to 'What Do I Want to Eat?'"
 * 
 * Purpose: Counter the despair of a restrictive diet with possibility
 */
export default function FeatureSection() {
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

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 4, md: 8 },
            alignItems: 'center',
          }}
        >
          {/* Left side - Features */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
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
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1a1a1a' }}>
                  Create Recipes
                </Typography>
                <Typography sx={{ color: '#666', lineHeight: 1.6 }}>
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
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1a1a1a' }}>
                  Adapt Any Meal
                </Typography>
                <Typography sx={{ color: '#666', lineHeight: 1.6 }}>
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
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1a1a1a' }}>
                  Find Community Recipes
                </Typography>
                <Typography sx={{ color: '#666', lineHeight: 1.6 }}>
                  Discover easy, delicious recipes shared by others who are on the same journey.
                </Typography>
              </Box>
            </Box>

            {/* Feature 4 */}
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
                <ForkKnife size={28} color="#f57c00" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1a1a1a' }}>
                  Create Meal Plans for 1-14 Days
                </Typography>
                <Typography sx={{ color: '#666', lineHeight: 1.6 }}>
                  Generate meal plans based on your dietary needs and preferences, in seconds.
                </Typography>
              </Box>
            </Box>

            {/* Mini CTA */}
            <Box sx={{ mt: 2 }}>
              <SeeFeaturesButton size="large" trackingLocation="recipe_section">
                View Features
              </SeeFeaturesButton>
            </Box>
          </Box>

          {/* Right side - Recipe imagery */}
          <Box
            sx={{
              flex: 1,
              width: '100%', // Ensure it takes full width on mobile
              display: 'flex',
              gap: { xs: 2, sm: 4 },
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {/* Image 1: Waffles */}
            <Box
              sx={{
                width: { xs: '160px', sm: '40%', md: '45%' },
                aspectRatio: '1',
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: '0 10px 20px rgba(0,0,0,0.08)',
                transform: 'translateY(-15px) rotate(-8deg)',
                position: 'relative',
              }}
            >
              <Image
                src={waffles}
                alt="Delicious gluten-free waffles"
                fill
                style={{ objectFit: 'cover' }}
              />
            </Box>

            {/* Image 2: Energy Balls */}
            <Box
              sx={{
                width: { xs: '160px', sm: '40%', md: '45%' },
                aspectRatio: '1',
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: '0 10px 20px rgba(0,0,0,0.08)',
                transform: 'translateY(15px) rotate(8deg)',
                position: 'relative',
              }}
            >
              <Image
                src={energyBalls}
                alt="Healthy energy balls snack"
                fill
                style={{ objectFit: 'cover' }}
              />
            </Box>

            {/* Image 3: Prosciutto Dates */}
            <Box
              sx={{
                width: { xs: '160px', sm: '40%', md: '45%' },
                aspectRatio: '1',
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                transform: 'rotate(2deg) scale(1.05)',
                position: 'relative',
              }}
            >
              <Image
                src={proscuittoDates}
                alt="Prosciutto wrapped dates"
                fill
                style={{ objectFit: 'cover' }}
              />
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
