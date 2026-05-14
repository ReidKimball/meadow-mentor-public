/**
 * @file UpgradePage.jsx
 * @module components/features/payments/UpgradePage
 * @description Upgrade page for logged-in users to purchase credit packages.
 * Styled to match brand guidelines and the Next.js marketing site.
 */

import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import CreditPricingTable from '../../../components/CreditPricingTable.jsx';

export default function UpgradePage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#FFFFFF',
        pb: 10,
        // Override parent layout padding
        mx: { xs: 0, sm: -2 },
        mt: { xs: -2, sm: -2 },
        width: { xs: '100vw', sm: 'calc(100% + 32px)' },
      }}
    >
      {/* Hero Section - Optional, but CreditPricingTable now has its own header */}
      {/* We keep it minimal to let the pricing table shine */}

      <Container maxWidth="xl" disableGutters sx={{ px: 0 }}>
        <CreditPricingTable />
      </Container>

      {/* Trust Badges or extra info could go here */}
      <Container maxWidth="lg" sx={{ mt: -4, mb: 10 }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: { xs: 4, md: 8 },
          flexWrap: 'wrap',
          opacity: 0.6,
          filter: 'grayscale(100%)'
        }}>
          {/* You could add partner logos or security badges here */}
        </Box>
      </Container>
    </Box>
  );
}
