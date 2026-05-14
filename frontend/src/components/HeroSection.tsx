'use client';

import { Box } from '@mui/material';
import CTAButton from './CTAButton';

const HeroImage = 'https://storage.googleapis.com/meadow_mentor_public_media/images/meadow_mentor_product_hero_clean_v2.webp';

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
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center',
        pb: 8,
      }}
    >
      <CTAButton>
        Get Started Free
      </CTAButton>
    </Box>
  );
}
