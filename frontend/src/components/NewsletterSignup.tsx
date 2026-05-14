'use client';

/**
 * @file Defines the `NewsletterSignup` component.
 * @description Renders a full-width inline newsletter signup card designed for blog post content.
 * The component is protected by Cloudflare Turnstile (spam prevention) and submits to the existing
 * backend endpoint: `POST /api/newsletter/subscribe`.
 *
 * This component is intended to be embedded inside Sanity Portable Text via a custom block type.
 *
 * @requires module:react - React.
 * @requires module:next/image - Optimized image rendering for the Chef Kay asset.
 * @requires module:@mui/material - MUI UI primitives.
 * @requires module:@marsidev/react-turnstile - Cloudflare Turnstile widget.
 * @requires module:../hooks/useNewsletterSubscription - Shared subscription hook.
 * @author Cascade
 * @version 1.0.0
 * @date 2026-01-30
 */

// React/Third-Party Libraries
import Image from 'next/image'; // Next.js image optimization.
import { Turnstile } from '@marsidev/react-turnstile'; // Cloudflare Turnstile widget.
import { Box, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material'; // MUI components.

// Internal Modules
import { useNewsletterSubscription } from '../hooks/useNewsletterSubscription'; // Shared newsletter subscription logic.

/**
 * @typedef {object} NewsletterSignupProps
 * @property {string} [headline] - Primary headline shown above the form.
 * @property {string} [subheadline] - Supporting copy shown under the headline.
 * @property {string} [ctaText] - CTA button text.
 * @property {'light'|'dark'} [variant] - Visual context (light for blog cards, dark for footer-like contexts).
 */
export type NewsletterSignupProps = {
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  variant?: 'light' | 'dark';
};

const CHEF_KAY_IMAGE_URL =
  'https://storage.googleapis.com/meadow_mentor_public_media/images/chef_kay_in_sun_v4_sm.webp';

/**
 * @component NewsletterSignup
 * @description Full-width newsletter signup card for embedding mid-article.
 *
 * Uses Meadow Mentor brand defaults:
 * - Light context: Deep Forest Green (`#013D1D`) CTA with white text.
 * - Dark context: Amber (`#FFBF00`) CTA with Deep Forest Green text (never white on amber).
 *
 * @param {NewsletterSignupProps} props - Component props.
 * @returns {JSX.Element} The rendered newsletter signup card.
 */
export default function NewsletterSignup({
  headline = 'Enjoying this article?',
  subheadline = 'Subscribe for more articles like this one sent every Sunday morning so you can start your week right.',
  ctaText = 'Subscribe',
  variant = 'light',
}: NewsletterSignupProps) {
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

  const isLight = variant === 'light';

  const cardStyles = isLight
    ? {
        bgcolor: '#FFFFFF',
        border: '2px solid #DCFCE7',
        color: '#013D1D',
      }
    : {
        bgcolor: '#013D1D',
        border: '2px solid #DCFCE7',
        color: '#FFFFFF',
      };

  const buttonStyles = isLight
    ? {
        bgcolor: '#013D1D',
        color: '#FFFFFF',
        '&:hover': {
          bgcolor: '#047857',
        },
        '&:disabled': {
          bgcolor: '#ccc',
          color: '#666',
        },
      }
    : {
        bgcolor: '#FFBF00',
        color: '#013D1D',
        '&:hover': {
          bgcolor: '#FFF8E5',
          boxShadow: '0 4px 10px rgba(255, 191, 0, 0.5)',
        },
        '&:disabled': {
          bgcolor: '#ccc',
          color: '#666',
        },
      };

  return (
    <Box
      sx={{
        ...cardStyles,
        borderRadius: 3,
        px: { xs: 2.5, sm: 4 },
        py: { xs: 3, sm: 4 },
        my: 5,
        boxShadow: isLight ? '0 10px 40px rgba(0, 0, 0, 0.08)' : '0 10px 40px rgba(0, 0, 0, 0.2)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          gap: { xs: 3, md: 4 },
        }}
      >
        {/* Chef Kay image */}
        <Box
          sx={{
            width: { xs: 140, md: 160 },
            height: { xs: 140, md: 160 },
            position: 'relative',
            flexShrink: 0,
            borderRadius: '999px',
            overflow: 'hidden',
            bgcolor: '#013D1D',
            boxShadow: 'inset 0 0 20px rgba(255, 160, 0, 0.6)',
          }}
        >
          <Image src={CHEF_KAY_IMAGE_URL} alt="Chef Kay mascot" fill style={{ objectFit: 'contain' }} />
        </Box>

        {/* Copy + form */}
        <Box sx={{ width: '100%' }}>
          <Typography
            variant="h5"
            sx={{
              mb: 1,
              fontWeight: 700,
              color: isLight ? '#013D1D' : '#FFFFFF',
              fontFamily: 'var(--font-heading, Montserrat)',
            }}
          >
            {headline}
          </Typography>

          <Typography
            variant="body1"
            sx={{
              mb: 3,
              lineHeight: 1.6,
              color: isLight ? '#013D1D' : '#FFFFFF',
              opacity: isLight ? 1 : 0.9,
              fontFamily: 'var(--font-body, "Source Sans 3")',
            }}
          >
            {subheadline}
          </Typography>

          {status === 'success' ? (
            <Alert severity="success" sx={{ bgcolor: '#edf7ed', color: '#1e4620' }}>
              Thanks! Check your inbox.
            </Alert>
          ) : (
            <>
              <TextField
                fullWidth
                placeholder="Email address"
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'loading'}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSubscribe();
                  }
                }}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    color: isLight ? '#013D1D' : '#FFFFFF',
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
                    color: isLight ? 'rgba(1, 61, 29, 0.6)' : 'rgba(255, 255, 255, 0.7)',
                    opacity: 1,
                  },
                }}
              />

              <Box sx={{ my: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Turnstile
                  ref={turnstileRef}
                  siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || ''}
                  onSuccess={(t) => setToken(t)}
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
                  sx={{
                    mt: 2,
                    bgcolor: status === 'error' ? '#fdeded' : '#edf7ed',
                    color: status === 'error' ? '#5f2120' : '#1e4620',
                  }}
                >
                  {message}
                </Alert>
              )}

              <Button
                fullWidth
                variant="contained"
                onClick={handleSubscribe}
                disabled={status === 'loading' || !token}
                sx={{
                  ...buttonStyles,
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  py: 1.5,
                  textTransform: 'uppercase',
                }}
              >
                {status === 'loading' ? <CircularProgress size={24} color="inherit" /> : ctaText}
              </Button>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
