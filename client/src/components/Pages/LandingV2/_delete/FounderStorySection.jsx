import React from 'react';
import { Box, Container, Typography, Grid, Avatar } from '@mui/material';
import { Heart } from 'lucide-react';

const founderPhoto07 = 'https://storage.googleapis.com/meadow_mentor_public_media/images/2025_reidkimball_07.webp';

/**
 * FounderStorySection - "Not Just an App. A Lifeline Built from Experience"
 * 
 * Purpose: Prove authenticity and credibility right before the final ask
 * Features:
 * - Subtle, not overly prominent
 * - Personal story builds trust
 * - Emphasizes shared experience and understanding
 */
const FounderStorySection = () => {
  return (
    <Box
      sx={{
        py: { xs: 6, md: 8 },
        backgroundColor: '#f8f9fa',
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
          <Typography
            variant="h3"
            sx={{
              fontFamily: 'var(--font-heading)',
              fontSize: { xs: '1.75rem', md: '2.25rem' },
              fontWeight: 600,
              color: '#1a1a1a',
              mb: 2,
              lineHeight: 1.3,
            }}
          >
            Not Just an App. A Lifeline Built from Experience.
          </Typography>
        </Box>

        <Grid container spacing={{ xs: 3, md: 4 }} alignItems="center">
          {/* Left side - Founder photo placeholder */}
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: { xs: '50%', md: '50%' },
                  height: { xs: '50%', md: '50%' },
                  backgroundColor: '#f5f5f5',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '8px solid #bdc',
                  position: 'relative',
                  //background: 'lightblue',
                  overflow: 'hidden', // To contain the circular image
                }}
              >
                <img
                  src={founderPhoto07}
                  alt="Reid Kimball"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
              
              <Typography variant="h6" sx={{ fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
                Reid Kimball
              </Typography>
              <Typography
                sx={{
                  fontFamily: 'var(--font-body)',
                  color: '#666',
                  fontSize: '0.9rem',
                }}
              >
                Founder & Fellow Patient
              </Typography>
            </Box>
          </Grid>

          {/* Right side - Story */}
          <Grid item xs={12} md={8}>
            <Box
              sx={{
                backgroundColor: 'white',
                p: { xs: 3, md: 4 },
                borderRadius: 3,
                border: '1px solid #e0e0e0',
                position: 'relative',
              }}
            >
              {/* Heart icon */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -12,
                  left: 20,
                  backgroundColor: '#2e7d32',
                  borderRadius: '50%',
                  p: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Heart size={20} color="white" />
              </Box>

              <Typography
                sx={{
                  fontFamily: 'var(--font-body)',
                  fontSize: { xs: '1rem', md: '1.1rem' },
                  lineHeight: 1.7,
                  color: '#333',
                  mt: 1,
                }}
              >
                I'm not just the founder of Meadow Mentor; I'm a patient. My own battle with Crohn's disease led me to find relief through therapeutic diets like SCD and GAPS. I built this app because I know the fear and confusion of starting this journey.
              </Typography>
              
              <Typography
                sx={{
                  fontFamily: 'var(--font-body)',
                  fontSize: { xs: '1rem', md: '1.1rem' },
                  lineHeight: 1.7,
                  color: '#333',
                  mt: 2,
                }}
              >
                Our guidance isn't just based on the scientifically-backed principles of the SCD, GAPS, Paleo AIP, and Mediterranean diets—it's filtered through real-world experience. We get it, because we've lived it.
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Subtle credibility indicators */}
        <Box
          sx={{
            mt: { xs: 4, md: 6 },
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: { xs: 2, md: 4 },
            opacity: 0.7,
          }}
        >
          <Typography
            sx={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              color: '#666',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            ✓ Evidence-based therapeutic diets
          </Typography>
          <Typography
            sx={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              color: '#666',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            ✓ Real patient experience
          </Typography>
          <Typography
            sx={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              color: '#666',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            ✓ Continuous improvement
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default FounderStorySection;
