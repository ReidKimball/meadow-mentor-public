'use client';

import { useNewsletterSubscription } from '../hooks/useNewsletterSubscription';
import Link from 'next/link';
import Image from 'next/image';
import { Box, Container, Typography, Stack, TextField, Button, Alert, CircularProgress } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { ChefHat } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';

export default function Footer() {
  const {
    email,
    setEmail,
    status,
    setStatus,
    message,
    setMessage,
    token,
    setToken,
    turnstileRef,
    handleSubscribe,
  } = useNewsletterSubscription();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#013D1D',
        color: '#DCFCE7',
        py: 6,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 6,
            mb: 6,
          }}
        >
          {/* Brand Section */}
          <Box sx={{ flex: { md: '1 1 30%' } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <ChefHat size={32} strokeWidth={2} />
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  color: '#DCFCE7',
                }}
              >
                Meadow Mentor
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FavoriteIcon sx={{ color: '#ef4444', fontSize: '1.25rem' }} />
              <Typography variant="body1" sx={{ color: '#DCFCE7', width: '60%' }}>
                Your personal guide for gut health. Thrive, one meal at a time.
              </Typography>
            </Box>
          </Box>

          {/* Product Links */}
          <Box sx={{ flex: { md: '1 1 20%' } }}>
            <Typography variant="h6" sx={{ color: '#DCFCE7', mb: 2, fontWeight: 600 }}>
              Product
            </Typography>
            <Stack spacing={1.5}>

              <Link href="/diets" style={{ textDecoration: 'none' }}>
                <Typography
                  variant="body1"
                  sx={{
                    color: '#DCFCE7',
                    fontWeight: 600,
                    //style the link with underline
                    textDecoration: 'underline',
                    '&:hover': { color: '#DCFCE7', textDecoration: 'none' }, // keep the mint color but do something else on hover
                    transition: 'color 0.2s',
                  }}
                >
                  Therapeutic Diets
                </Typography>
              </Link>

              <Link href="/features" style={{ textDecoration: 'none' }}>
                <Typography
                  variant="body1"
                  sx={{
                    color: '#DCFCE7',
                    fontWeight: 600,
                    //style the link with underline
                    textDecoration: 'underline',
                    '&:hover': { color: '#DCFCE7', textDecoration: 'none' }, // keep the mint color but do something else on hover
                    transition: 'color 0.2s',
                  }}
                >
                  Features
                </Typography>
              </Link>

              <Link href="/recipes" style={{ textDecoration: 'none' }}>
                <Typography
                  variant="body1"
                  sx={{
                    color: '#DCFCE7',
                    fontWeight: 600,
                    //style the link with underline
                    textDecoration: 'underline',
                    '&:hover': { color: '#DCFCE7', textDecoration: 'none' }, // keep the mint color but do something else on hover
                    transition: 'color 0.2s',
                  }}
                >
                  Recipes
                </Typography>
              </Link>
              <Link href="https://app.meadowmentor.com/signup" style={{ textDecoration: 'none' }}>
                <Typography
                  variant="body1"
                  sx={{
                    color: '#DCFCE7',
                    fontWeight: 600,
                    textDecoration: 'underline',
                    '&:hover': { color: '#DCFCE7', textDecoration: 'none' }, // keep the mint color but do something else on hover
                    transition: 'color 0.2s',
                  }}
                >
                  Sign Up
                </Typography>
              </Link>
              <Link href="/pricing" style={{ textDecoration: 'none' }}>
                <Typography
                  variant="body1"
                  sx={{
                    color: '#DCFCE7',
                    fontWeight: 600,
                    textDecoration: 'underline',
                    '&:hover': { color: '#DCFCE7', textDecoration: 'none' },
                    transition: 'color 0.2s',
                  }}
                >
                  Pricing
                </Typography>
              </Link>
            </Stack>
          </Box>

          {/* Company Links */}
          <Box sx={{ flex: { md: '1 1 20%' } }}>
            <Typography variant="h6" sx={{ color: '#DCFCE7', mb: 2, fontWeight: 600 }}>
              Company
            </Typography>
            <Stack spacing={1.5}>
              <Link href="/" style={{ textDecoration: 'none' }}>
                <Typography
                  variant="body1"
                  sx={{
                    color: '#DCFCE7',
                    fontWeight: 600,
                    textDecoration: 'underline',
                    '&:hover': { color: '#DCFCE7', textDecoration: 'none' },
                    transition: 'color 0.2s',
                  }}
                >
                  About
                </Typography>
              </Link>

              <Link href="/blog" style={{ textDecoration: 'none' }}>
                <Typography
                  variant="body1"
                  sx={{
                    color: '#DCFCE7',
                    fontWeight: 600,
                    textDecoration: 'underline',
                    '&:hover': { color: '#DCFCE7', textDecoration: 'none' },
                    transition: 'color 0.2s',
                  }}
                >
                  Blog
                </Typography>
              </Link>

              <Link href="https://www.facebook.com/groups/guthealthsupportrecipes" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <Typography
                  variant="body1"
                  sx={{
                    color: '#DCFCE7',
                    fontWeight: 600,
                    textDecoration: 'underline',
                    '&:hover': { color: '#DCFCE7', textDecoration: 'none' },
                    transition: 'color 0.2s',
                  }}
                >
                  Facebook Support Group
                </Typography>
              </Link>

              <Link href="/privacy" style={{ textDecoration: 'none' }}>
                <Typography
                  variant="body1"
                  sx={{
                    color: '#DCFCE7',
                    fontWeight: 600,
                    textDecoration: 'underline',
                    '&:hover': { color: '#DCFCE7', textDecoration: 'none' },
                    transition: 'color 0.2s',
                  }}
                >
                  Privacy policy
                </Typography>
              </Link>
              <Link href="/terms" style={{ textDecoration: 'none' }}>
                <Typography
                  variant="body1"
                  sx={{
                    color: '#DCFCE7',
                    fontWeight: 600,
                    textDecoration: 'underline',
                    '&:hover': { color: '#DCFCE7', textDecoration: 'none' },
                    transition: 'color 0.2s',
                  }}
                >
                  Terms of service
                </Typography>
              </Link>
            </Stack>
          </Box>
        </Box>

        {/* Newsletter Section */}
        <Box
          sx={{
            position: 'relative',
            mb: 4,
          }}
        >
          {/* Chef Kay Image - positioned absolutely on desktop */}
          <Box
            sx={{
              position: { xs: 'relative', md: 'absolute' },
              left: { md: '5%' },
              top: { md: '50%' },
              transform: { md: 'translateY(-50%)' },
              width: { xs: '150px', md: '180px' },
              height: { xs: '150px', md: '180px' },
              mx: { xs: 'auto', md: 0 },
              mb: { xs: 3, md: 0 },
            }}
          >
            <Image
              src="https://storage.googleapis.com/meadow_mentor_public_media/images/chef_kay_in_sun_v4_sm.webp"
              alt="Chef Kay mascot"
              fill
              style={{ objectFit: 'contain' }}
            />
          </Box>

          {/* Newsletter Form - centered */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" sx={{ color: '#DCFCE7', mb: 1, fontWeight: 600 }}>
              Join our Newsletter
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(220, 252, 231, 0.7)', mb: 3 }}>
              Get healing recipes and gut health tips delivered to your inbox.
            </Typography>
            <Box sx={{ maxWidth: '420px', mx: 'auto' }}>
              <TextField
                fullWidth
                placeholder="Email address"
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'loading' || status === 'success'}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSubscribe();
                  }
                }}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    backgroundColor: 'transparent',
                    '& fieldset': {
                      borderColor: '#DCFCE7',
                      borderWidth: '2px',
                    },
                    '&:hover fieldset': {
                      borderColor: '#DCFCE7',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#DCFCE7',
                    },
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: 'rgba(255, 255, 255, 0.6)',
                    opacity: 1,
                  },
                }}
              />
              <Box sx={{ my: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Turnstile
                  ref={turnstileRef}
                  siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || ''}
                  onSuccess={(token) => setToken(token)}
                  onError={() => {
                    setStatus('error');
                    setMessage('Security check failed. Please try again.');
                    setToken(null);
                  }}
                  onExpire={() => setToken(null)}
                  options={{
                    theme: 'auto',
                    size: 'normal',
                  }}
                />
              </Box>
              {message && (
                <Alert
                  severity={status === 'error' ? 'error' : 'success'}
                  sx={{ mt: 2, bgcolor: status === 'error' ? '#fdeded' : '#edf7ed', color: status === 'error' ? '#5f2120' : '#1e4620' }}
                >
                  {message}
                </Alert>
              )}
              <Button
                fullWidth
                variant="contained"
                onClick={handleSubscribe}
                disabled={status === 'loading' || status === 'success' || !token}
                sx={{
                  bgcolor: '#FFBF00',
                  color: '#013D1D',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  py: 1.5,
                  textTransform: 'uppercase',
                  '&:hover': {
                    bgcolor: '#FFF8E5', // add glow effect on hover
                    boxShadow: '0 4px 10px rgba(255, 191, 0, 0.5)',
                  },
                  '&:disabled': {
                    bgcolor: '#ccc',
                    color: '#666',
                  }
                }}
              >
                {status === 'loading' ? <CircularProgress size={24} color="inherit" /> : (status === 'success' ? 'Subscribed!' : 'Subscribe')}
              </Button>

            </Box>
          </Box>
        </Box>

        {/* Copyright */}
        <Box sx={{ pt: 4, borderTop: '1px solid rgba(255, 255, 255, 0.2)', textAlign: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 300, color: 'rgba(255, 255, 255, 0.8)' }}>
            © {new Date().getFullYear()} Meadow Mentor by Reid Kimball Design. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
