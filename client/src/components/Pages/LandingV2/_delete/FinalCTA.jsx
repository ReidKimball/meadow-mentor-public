import React from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router';

/**
 * FinalCTA - "Start Eating with Confidence"
 * 
 * Purpose: The final, low-friction, high-promise action
 * Features:
 * - Prominent, confident CTA
 * - Reinforces the main value proposition
 * - Clean, uncluttered design
 * - Strong visual hierarchy
 */
const FinalCTA = () => {
  const navigate = useNavigate();
  const handleCTAClick = () => {
    // Track the button click with Umami before navigating
    if (typeof window !== 'undefined' && window.umami) {
      window.umami.track('final_cta_click', {
        source: 'landing_page_v2',
        location: 'final_cta_section',
        button_text: 'Start Eating with Confidence',
      });
    }

    navigate('/signup');
    console.log('Final CTA clicked - navigate to signup');
  };

  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        background: 'linear-gradient(135deg, #1976d2 0%, #2e7d32 100%)', // Blue to green gradient
        color: 'white',
        textAlign: 'center',
      }}
    >
      <Container maxWidth="md">
        <Typography
          variant="h2"
          sx={{
            fontFamily: 'var(--font-heading)',
            fontSize: { xs: '2.25rem', md: '3rem' },
            fontWeight: 700,
            mb: 3,
            lineHeight: 1.2,
          }}
        >
          Start Eating with Confidence
        </Typography>
        
        <Typography
          variant="h6"
          sx={{
            fontFamily: 'var(--font-body)',
            fontSize: { xs: '1.1rem', md: '1.25rem' },
            mb: 5,
            lineHeight: 1.6,
            opacity: 0.9,
            maxWidth: '600px',
            mx: 'auto',
          }}
        >
          Join thousands who've transformed their relationship with food. Stop guessing, start healing, and finally feel confident in every meal choice.
        </Typography>

        <Button
          variant="contained"
          size="large"
          onClick={handleCTAClick}
          endIcon={<ArrowRight size={24} />}
          sx={{
            backgroundColor: 'white',
            color: '#1976d2',
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: { xs: '1.1rem', md: '1.25rem' },
            px: { xs: 4, md: 6 },
            py: { xs: 2, md: 2.5 },
            borderRadius: 3,
            textTransform: 'none',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            '&:hover': {
              backgroundColor: '#f5f5f5',
              boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
              transform: 'translateY(-2px)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          Start Eating with Confidence
        </Button>

        {/* Subtle reassurance */}
        <Box sx={{ mt: 4, opacity: 0.8 }}>
          <Typography
            sx={{
              fontFamily: 'var(--font-body)',
              fontSize: { xs: '0.875rem', md: '1rem' },
              mb: 1,
            }}
          >
            ✓ Free to start • ✓ No credit card required • ✓ Instant access
          </Typography>
          <Typography
            sx={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              opacity: 0.7,
            }}
          >
            Join over 10,000 people managing their therapeutic diets with confidence
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default FinalCTA;
