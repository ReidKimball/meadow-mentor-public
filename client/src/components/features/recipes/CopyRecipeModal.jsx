import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  TextField,
  Slide,
  Box,
  Typography
} from '@mui/material';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

/**
 * A modal dialog for copying/duplicating a recipe with a new title.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.open - Whether the dialog is open.
 * @param {Function} props.onClose - Function to call when the dialog is closed.
 * @param {Function} props.onCopyAndStay - Function to call when "Copy & Stay" is clicked.
 * @param {Function} props.onCopyAndNavigate - Function to call when "Copy & See New Recipe" is clicked.
 * @param {string} props.originalTitle - The original recipe title.
 */
const CopyRecipeModal = ({ 
  open, 
  onClose, 
  onCopyAndStay, 
  onCopyAndNavigate, 
  originalTitle 
}) => {
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    if (open && originalTitle) {
      setNewTitle(`${originalTitle} (Copy)`);
    }
  }, [open, originalTitle]);

  const handleCopyAndStay = () => {
    if (newTitle.trim()) {
      onCopyAndStay(newTitle.trim());
    }
  };

  const handleCopyAndNavigate = () => {
    if (newTitle.trim()) {
      onCopyAndNavigate(newTitle.trim());
    }
  };

  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      keepMounted
      onClose={onClose}
      aria-labelledby="copy-recipe-dialog-title"
      aria-describedby="copy-recipe-dialog-description"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="copy-recipe-dialog-title">Copy Recipe</DialogTitle>
      <DialogContent>
        <DialogContentText id="copy-recipe-dialog-description" sx={{ mb: 2 }}>
          Create a duplicate of this recipe with a new title. You can edit the copy independently.
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          id="recipe-title"
          label="New Recipe Title"
          type="text"
          fullWidth
          variant="outlined"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && newTitle.trim()) {
              handleCopyAndStay();
            }
          }}
        />
        <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Button Options:</strong>
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            • <strong>Cancel:</strong> Close this dialog without copying
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            • <strong>Copy & Stay:</strong> Create the copy and remain on this page
          </Typography>
          <Typography variant="body2">
            • <strong>Copy & See New Recipe:</strong> Create the copy and navigate to view it
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button 
          onClick={handleCopyAndStay} 
          color="primary" 
          variant="outlined"
          disabled={!newTitle.trim()}
        >
          Copy & Stay
        </Button>
        <Button 
          onClick={handleCopyAndNavigate} 
          color="primary" 
          variant="contained"
          disabled={!newTitle.trim()}
        >
          Copy & See New Recipe
        </Button>
      </DialogActions>
    </Dialog>
  );
};

CopyRecipeModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCopyAndStay: PropTypes.func.isRequired,
  onCopyAndNavigate: PropTypes.func.isRequired,
  originalTitle: PropTypes.string.isRequired,
};

export default CopyRecipeModal;
