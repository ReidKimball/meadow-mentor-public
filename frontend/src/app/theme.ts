'use client';

import { createTheme, responsiveFontSizes } from '@mui/material/styles';
export let theme = createTheme({
  palette: {
    primary: {
      main: '#013D1D', // Deep Forest Green
      light: '#047857', // Emerald
      contrastText: '#fff',
    },
    secondary: {
      main: '#FF6B35', // Orange Vibrant
      light: '#FF8C42', // Orange Soft
      contrastText: '#fff',
    },
    error: {
      main: '#ef4444', // Red accent
    },
    background: {
      default: '#fafafa', // Gray light
      paper: '#fff',
    },
    text: {
      primary: '#1f2937', // Gray dark
      secondary: '#6b7280',
    },
  },
  typography: {
    fontFamily: 'var(--font-body), Helvetica, Arial, sans-serif',
    h1: {
      fontFamily: 'var(--font-heading), Helvetica, Arial, sans-serif',
      fontWeight: 700,
      letterSpacing: '0.015em',
      lineHeight: 1.2,
    },
    h2: {
      fontFamily: 'var(--font-heading), Helvetica, Arial, sans-serif',
      fontWeight: 600,
      letterSpacing: '0.01em',
      lineHeight: 1.3,
    },
    h3: {
      fontFamily: 'var(--font-heading), Helvetica, Arial, sans-serif',
      fontWeight: 600,
      letterSpacing: '0.01em',
      lineHeight: 1.3,
    },
    h4: {
      fontFamily: 'var(--font-heading), Helvetica, Arial, sans-serif',
      fontWeight: 500,
      letterSpacing: '0.01em',
      lineHeight: 1.3,
    },
    h5: {
      fontFamily: 'var(--font-heading), Helvetica, Arial, sans-serif',
      fontWeight: 500,
      letterSpacing: '0.01em',
      lineHeight: 1.3,
    },
    h6: {
      fontFamily: 'var(--font-heading), Helvetica, Arial, sans-serif',
      fontWeight: 500,
      letterSpacing: '0.01em',
      lineHeight: 1.3,
    },
    body1: {
      fontFamily: 'var(--font-body), Helvetica, Arial, sans-serif',
      fontWeight: 400,
      letterSpacing: '-0.01em',
      lineHeight: 1.6,
    },
    body2: {
      fontFamily: 'var(--font-body), Helvetica, Arial, sans-serif',
      fontWeight: 300,
      letterSpacing: '-0.01em',
      lineHeight: 1.6,
    },
    button: {
      fontFamily: 'var(--font-heading), Helvetica, Arial, sans-serif',
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: 'var(--font-body), Helvetica, Arial, sans-serif',
        },
      },
    },
  },
});
theme = responsiveFontSizes(theme);
