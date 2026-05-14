import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useUser } from '../../../context/UserContext';
import { Box, CircularProgress } from '@mui/material';

const ProtectedRoute = ({ children }) => {
  const { user, loading, isNewUser } = useUser();
  const location = useLocation();

  if (loading || isNewUser) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh', 
        bgcolor: '#FFF7E6' 
      }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  // If the user is not authenticated, redirect them to the login page.
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If the user is authenticated but has not completed onboarding, 
  // and they have not skipped the quick start guide,
  // and they are not already on the getting started page, redirect them.
  if (user && !user.onboarding?.onboardingComplete && !user.onboarding?.quickStartSkipped && location.pathname !== '/quick_start_guide') {
    return <Navigate to="/quick_start_guide" replace />;
  }

  // Otherwise, the user is authorized to see the page.
  return children;
};

export default ProtectedRoute;
