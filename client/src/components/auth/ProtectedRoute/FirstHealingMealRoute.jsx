import React from 'react';
import { Navigate } from 'react-router';
import { useUser } from '../../../context/UserContext.jsx';
import { CircularProgress, Box } from '@mui/material';

/**
 * Legacy route for /first-healing-meal
 * Now redirects all users to /ask-kay where the new intro flow handles first-time users.
 */
const FirstHealingMealRoute = () => {
  const { loading } = useUser();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Always redirect to /ask-kay - the new intro flow will handle first-time users
  return <Navigate to="/ask-kay" replace />;
};

export default FirstHealingMealRoute;
