'use client';

import { Box, Container, Typography } from '@mui/material';
import CTAButton from './CTAButton';
import Image from 'next/image';
import SeeRecipePageButton from './SeeRecipePageButton';

const HeroImage = 'https://storage.googleapis.com/meadow_mentor_public_media/images/meadow_mentor_product_hero_clean_v3.webp';
const KayImage = 'https://storage.googleapis.com/meadow_mentor_public_media/images/chef_kay_in_sun_v4_headerbar.webp'

export default function HeroSection() {
  return (
    <Box
      sx={{
        height: '100vh',
        width: '100%',
        backgroundImage: `url(${HeroImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        alignItems: 'center', // Vertically center the content
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            // Layout & Positioning
            maxWidth: { xs: '100%', md: '500px', lg: '550px' }, // Fixed max-widths for better control
            display: 'flex',
            flexDirection: 'column',
            alignItems: { xs: 'center', md: 'flex-start' }, // Center on mobile, left align on desktop
            textAlign: { xs: 'center', md: 'left' },
            gap: 3,

            // Glass Card Styling
            backgroundColor: 'rgba(255, 255, 255, 0.85)', // Semi-transparent white
            backdropFilter: 'blur(12px)', // Blurs the background behind the card
            borderRadius: '24px', // Rounded corners
            p: { xs: 4, md: 5 }, // Padding inside the card
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)', // Soft shadow for depth
            border: '1px solid rgba(255, 255, 255, 0.5)', // Subtle border

            // Margin adjustments for mobile spacing
            mx: { xs: 2, md: 0 },
          }}
        >
          <Typography
            variant="h1"
            sx={{
              fontWeight: 700,
              color: 'primary.main',
              fontFamily: 'var(--font-heading)',
              fontSize: { xs: '2rem', md: '2.5rem' },
            }}
          >
            Your personal guide for gut health.
          </Typography>

          {/* <Image 
            src={KayImage}
            alt="Kay"            
            width={175}
            height={175}
          /> */}

          <Typography
            variant="h5"
            sx={{
              color: 'text.primary',
              fontWeight: 600,
              fontFamily: 'var(--font-heading)',
              fontSize: { xs: '1rem', md: '1.25rem' },
            }}
          >
            Navigate your gut health journey and thrive, one meal at a time.
          </Typography>

          <Box sx={{ mt: 2 }}>
            <SeeRecipePageButton trackingLocation="hero">
              See Recipes
            </SeeRecipePageButton>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
