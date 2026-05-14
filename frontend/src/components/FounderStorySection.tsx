'use client';

import { Box, Container, Typography } from '@mui/material';
import { Heart } from 'lucide-react';
import Image from 'next/image';

const founderPhoto = 'https://storage.googleapis.com/meadow_mentor_public_media/images/2026_reidkimball_profile_warm_wide_cropped.webp';

/**
 * FounderStorySection - "Not Just an App. A Lifeline Built from Experience"
 * 
 * Purpose: Prove authenticity and credibility right before the final ask
 */
export default function FounderStorySection() {
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
              fontSize: { xs: '1.5rem', md: '2rem' },
              fontWeight: 600,
              color: '#1a1a1a',
              mb: 2,
              lineHeight: 1.3,
            }}
          >
            Not Just an App. A Lifeline Built from Experience.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 3, md: 4 },
            alignItems: 'center',
          }}
        >
          {/* Left side - Founder photo */}
          <Box
            sx={{
              flex: { md: '0 0 33%' },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: { xs: 180, md: 200 },
                height: { xs: 180, md: 200 },
                borderRadius: '50%',
                // border: '8px solid #bbddcc',
                border: '8px solid #FFBF00',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <Image
                src={founderPhoto}
                alt="Reid Kimball, Founder"
                fill
                style={{ objectFit: 'cover' }}
              />
            </Box>
            
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Reid Kimball
            </Typography>
            <Typography
              sx={{
                color: '#666',
                fontSize: '0.9rem',
              }}
            >
              Founder & Fellow Patient
            </Typography>
          </Box>

          {/* Right side - Story */}
          <Box sx={{ flex: 1 }}>
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
                <Heart size={20} color="white" fill="white" />
              </Box>

              <Typography
                sx={{
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
                  fontSize: { xs: '1rem', md: '1.1rem' },
                  lineHeight: 1.7,
                  color: '#333',
                  mt: 2,
                }}
              >
                Our guidance isn't just based on the scientifically-backed principles of the SCD, GAPS, Paleo AIP, and Mediterranean diets—it's filtered through real-world experience. We get it, because we've lived it.
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Credibility indicators */}
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
}
