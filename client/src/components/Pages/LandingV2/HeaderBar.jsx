import React from 'react';
import { AppBar, Toolbar, Box, Button, Typography } from '@mui/material';

/**
 * HeaderBar - Clean, minimal header with CTA button
 * 
 * Features:
 * - Sticky header for easy CTA access
 * - Calm-inspired design with ample padding
 * - Mobile-responsive layout
 */
const HeaderBar = () => {
  const handleCTAClick = () => {
    // TODO: Navigate to signup/onboarding flow
    console.log('CTA clicked - navigate to signup');
  };

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e0e0e0',
        py: 1,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 4 } }}>
        {/* Logo/Brand */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: '#2e7d32', // Green for health/nature theme
              fontSize: { xs: '1.25rem', md: '1.5rem' },
            }}
          >
            Meadow Mentor
          </Typography>
        </Box>

        {/* CTA Button */}
        <Button
          variant="contained"
          onClick={handleCTAClick}
          sx={{
            backgroundColor: '#1976d2', // Calm-inspired blue
            color: 'white',
            fontWeight: 600,
            fontSize: { xs: '0.875rem', md: '1rem' },
            px: { xs: 2, md: 3 },
            py: { xs: 1, md: 1.5 },
            borderRadius: 2,
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: '#1565c0',
              boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
            },
          }}
        >
          Start Eating with Confidence
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default HeaderBar;
