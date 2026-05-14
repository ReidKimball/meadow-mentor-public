// client/src/components/Common/UpgradeModal.jsx
import React from 'react';
import { useNavigate } from 'react-router';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from '@mui/material';

/**
 * A modal dialog to prompt users to upgrade their plan when they hit a usage limit.
 * @param {object} props - The properties for the component.
 * @param {boolean} props.open - Whether the dialog is open.
 * @param {function} props.onClose - Function to call when the dialog should be closed.
 * @param {string} props.title - The title of the modal.
 * @param {string} props.message - The message to display in the modal body.
 * @returns {JSX.Element}
 */
const UpgradeModal = ({ open, onClose, title, message }) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate('/pricing');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
        <Typography variant="body2" sx={{ mt: 2 }}>
          The <strong>Early Adopter</strong> plan offers unlimited access to all features, including saved recipes and shopping list items.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Maybe Later
        </Button>
        <Button onClick={handleUpgrade} color="primary" variant="contained">
          Upgrade
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpgradeModal;
