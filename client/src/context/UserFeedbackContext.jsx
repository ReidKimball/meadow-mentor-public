// client/src/context/UserFeedbackContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';

const UserFeedbackContext = createContext();

export const useUserFeedback = () => {
  const context = useContext(UserFeedbackContext);
  if (!context) {
    throw new Error('useUserFeedback must be used within a UserFeedbackProvider');
  }
  return context;
};

export const UserFeedbackProvider = ({ children }) => {
  const [feedback, setFeedback] = useState({
    open: false,
    message: '',
    severity: 'info', // 'error', 'warning', 'info', 'success'
    duration: 6000, // Default duration for snackbar
  });

  const showSnackbar = useCallback((message, severity = 'success', duration = 6000) => {
    setFeedback({ open: true, message, severity, duration });
  }, []);

  const showErrorSnackbar = useCallback((message, duration = 6000) => {
    showSnackbar(message, 'error', duration);
  }, [showSnackbar]);
  
  const showSuccessSnackbar = useCallback((message, duration = 6000) => {
    showSnackbar(message, 'success', duration);
  }, [showSnackbar]);

  const showWarningSnackbar = useCallback((message, duration = 6000) => {
    showSnackbar(message, 'warning', duration);
  }, [showSnackbar]);

  const showInfoSnackbar = useCallback((message, duration = 6000) => {
    showSnackbar(message, 'info', duration);
  }, [showSnackbar]);


  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setFeedback(prev => ({ ...prev, open: false }));
  };

  return (
    <UserFeedbackContext.Provider value={{ showSnackbar, showErrorSnackbar, showSuccessSnackbar, showWarningSnackbar, showInfoSnackbar }}>
      {children}
      <Snackbar
        open={feedback.open}
        autoHideDuration={feedback.duration}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleClose} severity={feedback.severity} sx={{ width: '100%' }} variant="filled">
          {feedback.message}
        </Alert>
      </Snackbar>
    </UserFeedbackContext.Provider>
  );
};
