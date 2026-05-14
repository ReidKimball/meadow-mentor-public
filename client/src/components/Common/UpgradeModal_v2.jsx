import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
  IconButton,
  Box,
} from '@mui/material';
import { LockOpen as LockOpenIcon, Close as CloseIcon } from '@mui/icons-material';

const UpgradeModal_v2 = ({ open, onClose, message, recipeImage }) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate('/upgrade');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      BackdropProps={{ sx: { backgroundColor: 'rgba(0, 0, 0, 0.5)' } }} // Use a semi-transparent backdrop
      PaperProps={{
        sx: {
          borderRadius: '24px',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          p: 2,
          backgroundColor: 'transparent', // Make paper transparent to see pseudo-elements
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${recipeImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(8px)',
            transform: 'scale(1.1)', // Prevents blurred edges
            zIndex: -2,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: -1,
          },
        },
      }}
    >
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
      >
        <CloseIcon />
      </IconButton>
      <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
        <LockOpenIcon sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
          Upgrade for Unlimited Recipes
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center' }}>
        <DialogContentText sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
          {message}
        </DialogContentText>
        <Typography variant="h6" sx={{ mt: 2, color: 'rgba(255, 255, 255, 0.9)' }}>
          The <strong>Early Adopter</strong> plan offers unlimited access to saved recipes and shopping list items.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2 }}>

        <Button
          onClick={handleUpgrade}
          variant="contained"
          sx={{
            backgroundColor: 'black',
            color: 'white',
            borderRadius: '20px',
            textTransform: 'none',
            fontWeight: 'bold',
            '&:hover': {
              backgroundColor: '#333'
            }
          }}
        >
          Upgrade
        </Button>
      </DialogActions>
    </Dialog>
  );
};

UpgradeModal_v2.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  message: PropTypes.string.isRequired,
  recipeImage: PropTypes.string.isRequired,
};

export default UpgradeModal_v2;
