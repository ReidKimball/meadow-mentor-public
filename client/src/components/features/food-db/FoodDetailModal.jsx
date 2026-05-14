import React from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  IconButton,
} from '@mui/material';
import { X } from 'lucide-react';

/**
 * FoodDetailModal - Displays detailed information about a selected food item
 * 
 * @param {Object} props - Component props
 * @param {Object} props.food - The food item to display
 * @param {boolean} props.open - Whether the modal is open
 * @param {Function} props.onClose - Handler for closing the modal
 * @returns {JSX.Element} The rendered FoodDetailModal component
 */
const FoodDetailModal = ({ food = null, open = false, onClose = () => {} }) => {
  if (!food) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="food-detail-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="food-detail-title" sx={{ m: 0, p: 2 }}>
        {food.name}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[400],
          }}
        >
          <X size={20} />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <Chip
            label={food.status === 'ALLOWED' ? '🟢 A Good Match' : '🔴 Poor Alignment'}
            //color={food.status === 'ALLOWED' ? 'primary' : 'secondary'}
            size="small"
            sx={{ mb: 1 }}
          />
        </Box>
        
        {food.description && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Description
            </Typography>
            <Typography variant="body1" paragraph>
              {food.description}
            </Typography>
          </Box>
        )}
        
        {food.notes && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Notes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {food.notes}
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} autoFocus>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

FoodDetailModal.propTypes = {
  food: PropTypes.shape({
    name: PropTypes.string,
    status: PropTypes.oneOf(['ALLOWED', 'NOT_ALLOWED']),
    description: PropTypes.string,
    notes: PropTypes.string,
  }),
  open: PropTypes.bool,
  onClose: PropTypes.func,
};

export default FoodDetailModal;
