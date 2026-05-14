'use client';

import { Box, Container, Typography } from '@mui/material';
import CTAButton from './CTAButton';

/**
 * FinalCTA - "Start Eating with Confidence"
 * 
 * Purpose: The final, low-friction, high-promise action
 */
export default function FinalCTA() {
  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        background: 'linear-gradient(to right, #dcfce7, #dbeafe)',
        textAlign: 'center',
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="h2"
          sx={{
            fontSize: { xs: '2rem', md: '2.75rem' },
            fontWeight: 700,
            color: '#013D1D',
            mb: 2,
            lineHeight: 1.2,
          }}
        >
          Start Eating with Confidence
        </Typography>

        <Typography
          variant="h6"
          sx={{
            fontSize: { xs: '1.1rem', md: '1.25rem' },
            color: '#1f2937',
            mb: 5,
            lineHeight: 1.6,
            maxWidth: '600px',
            mx: 'auto',
          }}
        >
          Join thousands using food as medicine to manage their health. Stop guessing, start healing, and finally feel confident in every meal choice.
        </Typography>

        <CTAButton variant="primary" trackingLocation="final_cta">
          Start Eating with Confidence
        </CTAButton>

        {/* Reassurance */}
        <Box sx={{ mt: 4, opacity: 0.9 }}>
          <Typography
            sx={{
              fontSize: { xs: '0.875rem', md: '1rem' },
              mb: 1,
              color: '#1f2937',
              fontWeight: 500,
            }}
          >
            ✓ Free to start • ✓ No credit card required • ✓ Instant access
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
