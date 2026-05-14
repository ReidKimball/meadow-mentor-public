'use client';

import posthog from 'posthog-js';

import { useState } from 'react';
import { APP_BASE_URL } from '@/lib/api';
import Link from 'next/link';
import { AppBar, Toolbar, Container, Box, Button, Typography, IconButton, Menu, MenuItem, ListItemIcon } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import InfoIcon from '@mui/icons-material/Info';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ArticleIcon from '@mui/icons-material/Article';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import HealingIcon from '@mui/icons-material/Healing';

const Chef_Kay = 'https://storage.googleapis.com/meadow_mentor_public_media/images/chef_kay_in_sun_v4_headerbar.webp';

export default function Header() {
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
  const [anchorElApp, setAnchorElApp] = useState<null | HTMLElement>(null);

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleOpenAppMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElApp(event.currentTarget);
  };

  const handleCloseAppMenu = () => {
    setAnchorElApp(null);
  };

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
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                }}
              >
                Your personal guide for gut health
              </Typography>
            </Box>
          </Link>

          {/* Mobile Menu Icon */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1 }}>

            <IconButton
              size="large"
              aria-label="navigation menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              sx={{ color: '#013D1D' }}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              disableScrollLock={true}
              sx={{
                display: { xs: 'block', md: 'none' },
                '& .MuiPaper-root': {
                  borderRadius: 2,
                  minWidth: 180,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                }
              }}
            >
              <MenuItem onClick={handleCloseNavMenu} component={Link} href="/diets">
                <ListItemIcon>
                  <HealingIcon fontSize="small" sx={{ color: '#013D1D' }} />
                </ListItemIcon>
                <Typography textAlign="center" color="#013D1D">Diets</Typography>
              </MenuItem>
              
              <MenuItem onClick={handleCloseNavMenu} component={Link} href="/recipes">
                <ListItemIcon>
                  <RestaurantMenuIcon fontSize="small" sx={{ color: '#013D1D' }} />
                </ListItemIcon>
                <Typography textAlign="center" color="#013D1D">Recipes</Typography>
              </MenuItem>
              
              {/* <MenuItem onClick={handleCloseNavMenu} component={Link} href="/plans">
                <ListItemIcon>
                  <MenuBookIcon fontSize="small" sx={{ color: '#013D1D' }} />
                </ListItemIcon>
                <Typography textAlign="center" color="#013D1D">Plans</Typography>
              </MenuItem> */}
              
              <MenuItem onClick={handleCloseNavMenu} component={Link} href="/app">
                <ListItemIcon>
                  <AutoAwesomeIcon fontSize="small" sx={{ color: '#013D1D' }} />
                </ListItemIcon>
                <Typography textAlign="center" color="#013D1D">App</Typography>
              </MenuItem>

              <MenuItem onClick={handleCloseNavMenu} component={Link} href="/app">
                <Typography textAlign="center" color="#013D1D" sx={{ pl: 4 }}>App info</Typography>
              </MenuItem>

              <MenuItem onClick={handleCloseNavMenu} component={Link} href={`${APP_BASE_URL}/login`}>
                <Typography textAlign="center" color="#013D1D" sx={{ pl: 4 }}>Log in</Typography>
              </MenuItem>

              <MenuItem
                onClick={() => {
                  handleCloseNavMenu();
                  posthog.capture('signup_clicked', { location: 'header_mobile' });
                }}
                component={Link}
                href={`${APP_BASE_URL}/signup`}
              >
                <Typography textAlign="center" color="#013D1D" sx={{ pl: 4, fontWeight: 600 }}>Sign Up</Typography>
              </MenuItem>
              
              {/* <MenuItem onClick={handleCloseNavMenu} component={Link} href="/about">
                <ListItemIcon>
                  <InfoIcon fontSize="small" sx={{ color: '#013D1D' }} />
                </ListItemIcon>
                <Typography textAlign="center" color="#013D1D">About</Typography>
              </MenuItem> */}
              
              <MenuItem onClick={handleCloseNavMenu} component={Link} href="/blog">
                <ListItemIcon>
                  <ArticleIcon fontSize="small" sx={{ color: '#013D1D' }} />
                </ListItemIcon>
                <Typography textAlign="center" color="#013D1D">Blog</Typography>
              </MenuItem>

              <MenuItem onClick={handleCloseNavMenu} component={Link} href="/#pricing">
                <ListItemIcon>
                  <LocalOfferIcon fontSize="small" sx={{ color: '#013D1D' }} />
                </ListItemIcon>
                <Typography textAlign="center" color="#013D1D">Pricing</Typography>
              </MenuItem>

            </Menu>
          </Box>

          {/* Desktop Navigation */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, alignItems: 'center' }}>

            <Link href="/diets" style={{ textDecoration: 'none' }}>
              <Button sx={{ color: '#013D1D' }}>
                Diets
              </Button>
            </Link>

            <Link href="/recipes" style={{ textDecoration: 'none' }}>
              <Button sx={{ color: '#013D1D' }}>
                Recipes
              </Button>
            </Link>

            {/* <Link href="/plans" style={{ textDecoration: 'none' }}>
              <Button sx={{ color: '#013D1D' }}>
                Plans
              </Button>
            </Link> */}

            <Button
              onClick={handleOpenAppMenu}
              sx={{ color: '#013D1D' }}
              endIcon={
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              }
            >
              App
            </Button>
            <Menu
              anchorEl={anchorElApp}
              open={Boolean(anchorElApp)}
              onClose={handleCloseAppMenu}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              disableScrollLock
              sx={{
                '& .MuiPaper-root': {
                  borderRadius: 2,
                  minWidth: 140,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                }
              }}
            >
              <MenuItem onClick={handleCloseAppMenu} component={Link} href="/app">
                <Typography textAlign="center" color="#013D1D">App info</Typography>
              </MenuItem>
              <MenuItem onClick={handleCloseAppMenu} component={Link} href={`${APP_BASE_URL}/login`}>
                <Typography textAlign="center" color="#013D1D">Log in</Typography>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleCloseAppMenu();
                  posthog.capture('signup_clicked', { location: 'header' });
                }}
                component={Link}
                href={`${APP_BASE_URL}/signup`}
              >
                <Typography textAlign="center" color="#013D1D" sx={{ fontWeight: 600 }}>Sign Up</Typography>
              </MenuItem>
            </Menu>

            {/* <Link href="/about" style={{ textDecoration: 'none' }}>
              <Button sx={{ color: '#013D1D' }}>
                About
              </Button>
            </Link> */}

            <Link href="/blog" style={{ textDecoration: 'none' }}>
              <Button sx={{ color: '#013D1D' }}>
                Blog
              </Button>
            </Link>

            <Link href="/#pricing" style={{ textDecoration: 'none' }}>
              <Button sx={{ color: '#013D1D' }}>
                Pricing
              </Button>
            </Link>

            

          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
