import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  Button,
  CircularProgress,
  Alert,
  TextField,
  Box,
  useMediaQuery,
  useTheme,
  AppBar,
  Toolbar
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { uploadRecipeImage } from '../../../services/recipeService';
import { useUser } from '../../../context/UserContext';

const DEEP_FOREST_GREEN = '#013D1D';
const AMBER_RICH = '#FFBF00';
const PALE_CREAM = '#FFF8E5';
const SOFT_MINT = '#DCFCE7';

const UploadPhotoModal = ({ open, onClose, recipeId, onUploadSuccess, onUploadError }) => {
  const { getFreshIdToken } = useUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setError(null);

    if (file && file.size > 5 * 1024 * 1024) { // 5 MB limit
      setError('File is too large. Please select a file under 5 MB.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await uploadRecipeImage(recipeId, selectedFile, getFreshIdToken);
      if (response && response.imageUrls) {
        if (onUploadSuccess) {
          onUploadSuccess(response.imageUrls);
        }
        setSelectedFile(null);
      } else {
        throw new Error(response.message || 'Failed to upload image.');
      }
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred.';
      if (onUploadError) {
        onUploadError(errorMessage);
      } else {
        setError(errorMessage);
      }
      console.error('Error uploading recipe image:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog
      fullScreen={isMobile}
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : '22px',
          backgroundColor: '#ffffff',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
        },
      }}
    >
      {isMobile ? (
        <AppBar sx={{ position: 'relative', backgroundColor: DEEP_FOREST_GREEN }}>
          <Toolbar>
            <Typography sx={{ ml: 2, flex: 1, fontFamily: 'Montserrat', fontWeight: 700 }} variant="h6">
              Upload Photo
            </Typography>
            <IconButton edge="start" color="inherit" onClick={handleClose} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
      ) : (
        <DialogTitle sx={{
          m: 0,
          p: 3,
          fontFamily: 'Montserrat',
          fontWeight: 700,
          color: DEEP_FOREST_GREEN,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          Upload a Photo
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{ color: (theme) => theme.palette.grey[500] }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
      )}

      <DialogContent sx={{ p: { xs: 3, md: 4 }, backgroundColor: '#fafafa' }}>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          py: 2
        }}>
          <Box sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: SOFT_MINT,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: DEEP_FOREST_GREEN
          }}>
            <CloudUploadIcon sx={{ fontSize: 40 }} />
          </Box>

          <Typography variant="body1" sx={{ textAlign: 'center', fontFamily: 'Source Sans 3', color: '#444' }}>
            Personalize your recipe with a photo!
          </Typography>

          <TextField
            type="file"
            onChange={handleFileChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
            variant="outlined"
            error={!!error}
            helperText={error}
            inputProps={{ accept: 'image/*' }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                backgroundColor: '#ffffff'
              }
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, backgroundColor: '#ffffff', justifyContent: 'space-between' }}>
        <Button
          onClick={handleClose}
          sx={{
            color: DEEP_FOREST_GREEN,
            fontFamily: 'Montserrat',
            fontWeight: 600,
            textTransform: 'none'
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={isLoading || !selectedFile}
          sx={{
            backgroundColor: DEEP_FOREST_GREEN,
            color: '#FFFFFF',
            borderRadius: '25px',
            px: 4,
            py: 1,
            fontFamily: 'Montserrat',
            fontWeight: 700,
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#047857',
            },
            '&.Mui-disabled': {
              backgroundColor: '#e0e0e0'
            }
          }}
        >
          {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Upload Photo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

UploadPhotoModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  recipeId: PropTypes.string.isRequired,
  onUploadSuccess: PropTypes.func,
  onUploadError: PropTypes.func,
};

UploadPhotoModal.defaultProps = {
  onUploadSuccess: () => { },
  onUploadError: () => { },
};

export default UploadPhotoModal;

