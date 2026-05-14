import React, { useEffect } from 'react';
import { Box, Container, Typography, Button, CircularProgress, Card, CardContent, Fade } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router';
import { Check, Sparkles, PartyPopper } from 'lucide-react';
import { useQueryInvalidation } from '../../../hooks/useUserQueries.js';
import { useUser } from '../../../context/UserContext.jsx';

export default function CreditPurchaseSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { invalidateUser } = useQueryInvalidation();
  const { user } = useUser();

  const isSuccessfulPurchase = searchParams.get('success') === 'true';

  useEffect(() => {
    if (!isSuccessfulPurchase) {
      navigate('/upgrade', { replace: true });
      return;
    }
    // Invalidate user data to refetch fresh credit balance
    if (user) invalidateUser();
  }, [user, invalidateUser, isSuccessfulPurchase, navigate]);

  if (!isSuccessfulPurchase) return null;

  const handleContinue = () => navigate('/guidebook');
  const handleBuyMore = () => navigate('/upgrade');

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #FFF8E5 0%, #FFFFFF 100%)', // Morning Sun background
        py: { xs: 4, md: 8 },
        px: { xs: 2, md: 4 },
        boxSizing: 'border-box',
        // Override parent AppLayout padding (py: 2, px: 2) to remove the "gap"
        mx: { xs: 0, sm: -2 },
        mt: { xs: -2, sm: -2 },
        mb: { xs: -7, sm: -7 }, // Offset the BottomNavigation padding
        width: { xs: '100vw', sm: 'calc(100% + 32px)' },
      }}
    >
      <Container maxWidth="sm">
        <Fade in timeout={800}>
          <Card
            sx={{
              textAlign: 'center',
              borderRadius: 6,
              overflow: 'visible',
              boxShadow: '0 20px 40px rgba(1, 61, 29, 0.08)',
              border: '1px solid #DCFCE7', // Soft Mint
              position: 'relative'
            }}
          >
            <CardContent sx={{ p: { xs: 4, sm: 6 } }}>
              {/* Success Icon with Brand Treatment */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4, position: 'relative' }}>
                <Box
                  sx={{
                    width: 100,
                    height: 100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    background: '#FFBF00', // Amber Rich
                    boxShadow: 'inset 0 0 20px rgba(255, 160, 0, 0.6), 0 10px 20px rgba(255, 191, 0, 0.3)',
                    color: '#013D1D', // Deep Forest Green
                    zIndex: 2
                  }}
                >
                  <Check size={48} strokeWidth={3} />
                </Box>

                {/* Decorative Elements */}
                <Box sx={{ position: 'absolute', top: -10, right: '30%', color: '#FFBF00', zIndex: 1 }}>
                  <Sparkles size={24} />
                </Box>
                <Box sx={{ position: 'absolute', bottom: 0, left: '30%', color: '#DCFCE7', zIndex: 1 }}>
                  <PartyPopper size={32} />
                </Box>
              </Box>

              {/* Success Message */}
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  color: '#013D1D',
                  mb: 2,
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: { xs: '2rem', sm: '2.5rem' }
                }}
              >
                Order Confirmed!
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  color: '#013D1D',
                  mb: 4,
                  fontWeight: 600,
                  fontFamily: '"Source Sans 3", sans-serif',
                  lineHeight: 1.5,
                  maxWidth: '90%',
                  mx: 'auto'
                }}
              >
                Success! Your Meadow Credits have been added and are ready to use.
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: '#444',
                  mb: 5,
                  lineHeight: 1.6,
                  fontFamily: '"Source Sans 3", sans-serif',
                }}
              >
                Go ahead and explore—use your credits to generate personalized recipes or create your next meal plan.
              </Typography>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleContinue}
                  sx={{
                    py: 2,
                    borderRadius: 3,
                    bgcolor: '#013D1D',
                    color: '#FFFFFF',
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    fontFamily: 'Montserrat, sans-serif',
                    boxShadow: '0 4px 14px rgba(1, 61, 29, 0.3)',
                    '&:hover': {
                      bgcolor: '#047857',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(1, 61, 29, 0.4)',
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  Start Creating Now
                </Button>

                <Button
                  variant="text"
                  onClick={handleBuyMore}
                  sx={{
                    color: '#013D1D',
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    fontFamily: '"Source Sans 3", sans-serif',
                    textDecoration: 'underline',
                    '&:hover': {
                      background: 'transparent',
                      color: '#047857',
                    }
                  }}
                >
                  Top up more credits
                </Button>
              </Box>

              {/* Footer Info */}
              <Box sx={{ mt: 6, pt: 4, borderTop: '1px solid #eee' }}>
                <Typography
                  variant="body2"
                  sx={{ color: '#666', fontFamily: '"Source Sans 3", sans-serif', fontStyle: 'italic' }}
                >
                  A receipt has been sent to your email address.
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ mt: 1, color: '#013D1D', fontWeight: 600, fontFamily: '"Source Sans 3", sans-serif' }}
                >
                  Questions? Reach us at <a href="mailto:support@meadowmentor.com" style={{ color: 'inherit' }}>support@meadowmentor.com</a>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Fade>
      </Container>
    </Box>
  );
}
