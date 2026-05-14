import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Slide,
} from '@mui/material';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

/**
 * A reusable confirmation modal dialog.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.open - Whether the dialog is open.
 * @param {Function} props.onClose - Function to call when the dialog is closed.
 * @param {Function} props.onConfirm - Function to call when the confirmation button is clicked.
 * @param {string} props.title - The title of the dialog.
 * @param {string} props.message - The confirmation message to display.
 * @param {string} [props.confirmText='Yes'] - The text for the confirm button.
 * @param {string} [props.cancelText='No'] - The text for the cancel button.
 */
const ConfirmActionModal = ({ 
  open, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Yes', 
  cancelText = 'No' 
}) => {
  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      keepMounted
      onClose={onClose}
      aria-labelledby="alert-dialog-slide-title"
      aria-describedby="alert-dialog-slide-description"
    >
      <DialogTitle id="alert-dialog-slide-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-slide-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          {cancelText}
        </Button>
        <Button onClick={onConfirm} color="primary" autoFocus>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmActionModal;
