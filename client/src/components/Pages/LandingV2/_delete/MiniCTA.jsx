import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router';

/**
 * MiniCTA - A compact call-to-action component.
 *
 * Purpose: To provide a clear, next-step action within a content section.
 * Features:
 * - Simple, direct text.
 * - A clear, prominent button.
 * - Designed to be embedded within other components.
 */
const MiniCTA = () => {
  const navigate = useNavigate();

  const handleCTAClick = () => {
    // Track the button click with Umami before navigating
    if (typeof window !== 'undefined' && window.umami) {
      window.umami.track('mini_cta_click', {
        source: 'landing_page_v2',
        location: 'recipe_section',
        button_text: 'Start Your Journey',
      });
    }
    navigate('/signup');
    console.log('Mini CTA clicked - navigate to signup');
  };

  return (
    <Box sx={{ mt: 6, textAlign: 'left' }}>
      <Typography
        variant="h5"
        sx={{
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          mb: 2,
          color: '#1a1a1a',
        }}
      >
        Ready to feel confident about your food?
      </Typography>
      <Button
        variant="contained"
        size="large"
        onClick={handleCTAClick}
        endIcon={<ArrowRight size={20} />}
        sx={{
          backgroundColor: '#1976d2', // Primary blue
          color: 'white',
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          textTransform: 'none',
          borderRadius: 2,
          px: 4,
          py: 1.5,
          '&:hover': {
            backgroundColor: '#1565c0', // Darker blue on hover
          },
        }}
      >
        Start Your Journey
      </Button>
    </Box>
  );
};

export default MiniCTA;