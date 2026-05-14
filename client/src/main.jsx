import './output.css' // Compiled Tailwind CSS file, needs to be first
import './index.css' // main.jsx index.css file
import React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { useNavigate } from 'react-router'
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import { UserFeedbackProvider } from './context/UserFeedbackContext.jsx';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';

// The onRedirectCallback function here uses useNavigate, which is a hook.
// Hooks can only be called inside the body of a function component or a custom hook.
// This function likely needs to be moved inside a component where navigation occurs,
// or refactored depending on how Auth0 (or similar) is configured.
// Consider commenting it out as it's likely causing errors.
// Add onRedirectCallback function
const onRedirectCallback = (appState) => {
  const navigate = useNavigate();
  navigate('/profile');
}

createRoot(document.getElementById('root')).render(

  <StrictMode>
    <ThemeProvider theme={theme}>
      <HelmetProvider>
        <UserFeedbackProvider>
          <App />
        </UserFeedbackProvider>
      </HelmetProvider>
    </ThemeProvider>
  </StrictMode>,
)