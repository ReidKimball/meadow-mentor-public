// client/src/theme.js
// Brand theme matching frontend/src/app/theme.ts
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
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
    fontFamily: '"Source Sans Pro", Helvetica, Arial, sans-serif',
    h1: {
      fontFamily: '"Montserrat", Helvetica, Arial, sans-serif',
      fontWeight: 700,
      letterSpacing: '0.015em',
      lineHeight: 1.2,
    },
    h2: {
      fontFamily: '"Montserrat", Helvetica, Arial, sans-serif',
      fontWeight: 600,
      letterSpacing: '0.01em',
      lineHeight: 1.3,
    },
    h3: {
      fontFamily: '"Montserrat", Helvetica, Arial, sans-serif',
      fontWeight: 600,
      letterSpacing: '0.01em',
      lineHeight: 1.3,
    },
    h4: {
      fontFamily: '"Montserrat", Helvetica, Arial, sans-serif',
      fontWeight: 500,
      letterSpacing: '0.01em',
      lineHeight: 1.3,
    },
    h5: {
      fontFamily: '"Montserrat", Helvetica, Arial, sans-serif',
      fontWeight: 500,
      letterSpacing: '0.01em',
      lineHeight: 1.3,
    },
    h6: {
      fontFamily: '"Montserrat", Helvetica, Arial, sans-serif',
      fontWeight: 500,
      letterSpacing: '0.01em',
      lineHeight: 1.3,
    },
    body1: {
      fontFamily: '"Source Sans Pro", Helvetica, Arial, sans-serif',
      fontWeight: 400,
      letterSpacing: '-0.01em',
      lineHeight: 1.6,
    },
    body2: {
      fontFamily: '"Source Sans Pro", Helvetica, Arial, sans-serif',
      fontWeight: 300,
      letterSpacing: '-0.01em',
      lineHeight: 1.6,
    },
    button: {
      fontFamily: '"Montserrat", Helvetica, Arial, sans-serif',
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        contained: {
          backgroundColor: '#013D1D',
          '&:hover': {
            backgroundColor: '#047857',
          },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: '"Source Sans Pro", Helvetica, Arial, sans-serif',
        },
      },
    },
  },
});

export default theme;