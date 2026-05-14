'use client';

import { Box, Container, Typography } from '@mui/material';
import CTAButton from './CTAButton';

const Chef_Kay = 'https://storage.googleapis.com/meadow_mentor_public_media/images/chef_kay.webp';
const Recipe_Card = 'https://storage.googleapis.com/meadow_mentor_public_media/images/landing_hero_recipe_card.webp';

export default function HeroSection() {
  return (
    <Box
      sx={{
        background: 'linear-gradient(to right, #dcfce7, #dbeafe)',
        py: { xs: 6, md: 10 },
        minHeight: { md: '600px' },
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
          {/* Left side - Text content */}
          <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
            {/* Chef Kay with amber ring */}
            <Box
              sx={{
                display: 'inline-block',
                position: 'relative',
                mb: 3,
              }}
            >
              <Box
                sx={{
                  width: { xs: 180, md: 240 },
                  height: { xs: 180, md: 240 },
                  borderRadius: '50%',
                  border: '8px solid #FFBF00',                  
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: { xs: 'auto', md: 0 },
                }}
              >
                <Box
                  component="img"
                  src={Chef_Kay}
                  alt="Chef Kay - Your AI cooking assistant"
                  sx={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
              </Box>
            </Box>

            {/* Brand name */}
            <Typography
              variant="h1"
              sx={{
                fontWeight: 700,
                color: '#013D1D',
                mb: 2,
                fontSize: { xs: '2.5rem', md: '3.5rem' },
              }}
            >
              Meadow Mentor
            </Typography>

            {/* Tagline */}
            <Typography
              variant="h5"
              sx={{
                color: '#1f2937',
                mb: 4,
                fontWeight: 400,
                fontSize: { xs: '1.25rem', md: '1.5rem' },
              }}
            >
              Your personal guide for gut health
            </Typography>

            {/* CTA Button */}
            <CTAButton>
              Get Started Free
            </CTAButton>
          </Box>

          {/* Right side - Recipe card image */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Box
              component="img"
              src={Recipe_Card}
              alt="Savory Mediterranean Chicken & Cauliflower Rice Bowl recipe card"
              sx={{
                width: '100%',
                maxWidth: { xs: '100%', md: '450px' },
                height: 'auto',
                borderRadius: '22px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
              }}
            />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
