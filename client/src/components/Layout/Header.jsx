/**
 * @file Header.jsx
 * @module Header
 * @description Header component for the authenticated app experience.
 * The public landing page header is now handled by the Next.js marketing site.
 */

import { Link } from 'react-router';
import { AppBar, Toolbar, Container, Box, Button, Typography } from '@mui/material';
import ArticleIcon from '@mui/icons-material/Article';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import LoginButton from '../auth/LoginButton.jsx';
import UserMenu from './UserMenu.jsx';
import CreditBalanceBadge from '../CreditBalanceBadge.jsx';
import { useUser } from '../../context/UserContext.jsx';
import { getAuth } from 'firebase/auth';
import { app } from '../../config/firestore.js';
import { MARKETING_BASE_URL } from '../../env-config.js';

const Chef_Kay = 'https://storage.googleapis.com/meadow_mentor_public_media/images/chef_kay_in_sun_v4_headerbar.webp';

export function AppHeader() {
  const { user: contextUser } = useUser();
  const auth = getAuth(app);
  const currentUser = auth.currentUser;

  {/* ADD APP LINKS TO HEADER HERE */ }
  const appLinks = [
    // {
    //   label: 'Quick Start Guide',
    //   type: 'internal',
    //   path: '/quick_start_guide',
    //   icon: TipsAndUpdatesIcon,
    // }
  ];

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: 'linear-gradient(to right, #dcfce7, #dbeafe)',
        py: 1,
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          {/* change the below link to the next.js marketing site root landing page */}
          <a href={`${MARKETING_BASE_URL}/`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Box
              component="img"
              src={Chef_Kay}
              alt="Chef Kay"
              sx={{
                width: { xs: 48, md: 64 },
                height: { xs: 48, md: 64 },
                borderRadius: '50%',
              }}
            />
            <Box>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '1.5rem', md: '2rem' },
                  fontWeight: 700,
                  color: '#013D1D',
                  lineHeight: 1.2,
                  fontFamily: 'Montserrat, sans-serif',
                }}
              >
                Meadow Mentor
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#013D1D',
                  fontWeight: 600,
                  display: { xs: 'none', sm: 'block' },
                  fontSize: { sm: '0.875rem', md: '1rem' },
                  fontFamily: '"Source Sans Pro", sans-serif',
                }}
              >
                Your personal guide for gut health
              </Typography>
            </Box>
          </a>

          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            {appLinks.map(({ label, type, path, href }) => (
              type === 'internal' ? (
                <Link key={label} to={path} style={{ textDecoration: 'none' }}>
                  <Button
                    sx={{
                      color: '#013D1D',
                      textTransform: 'none',
                      fontWeight: 600,
                      fontFamily: 'Montserrat, sans-serif',
                      fontSize: '1rem'
                    }}
                  >
                    {label}
                  </Button>
                </Link>
              ) : (
                <a key={label} href={href} style={{ textDecoration: 'none' }} target="_blank" rel="noopener noreferrer">
                  <Button
                    sx={{
                      color: '#013D1D',
                      textTransform: 'none',
                      fontWeight: 600,
                      fontFamily: 'Montserrat, sans-serif',
                      fontSize: '1rem'
                    }}
                  >
                    {label}
                  </Button>
                </a>
              )
            ))}

            {currentUser ? (
              <>
                <CreditBalanceBadge size="small" />
                <UserMenu
                  user={currentUser}
                  userFirstName={contextUser?.firstName || ''}
                  userLastName={contextUser?.lastName || ''}
                  customProfileImageUrl={contextUser?.profileImageUrl}
                  avatarSize={40}
                />
              </>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <LoginButton link="/login" />
                <Button
                  component={Link}
                  to="/signup"
                  variant="contained"
                  sx={{
                    bgcolor: '#013D1D',
                    color: 'white',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: '1rem',
                    borderRadius: 2,
                    px: 3,
                    py: 1,
                    '&:hover': { bgcolor: '#047857', color: 'white' },
                  }}
                >
                  Sign Up Free
                </Button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
