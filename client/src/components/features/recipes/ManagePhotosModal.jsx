import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  Box,
  CircularProgress,
  Alert,
  Button,
  Tooltip,
  Snackbar,
  useMediaQuery,
  useTheme,
  AppBar,
  Toolbar,
  Card,
  CardMedia,
  CardActions
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import PhotoCameraFrontIcon from '@mui/icons-material/PhotoCameraFront';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import { motion, AnimatePresence } from 'framer-motion';
import { getRecipeImageVersions, deleteRecipeImage, setRecipeCoverImage, rotateRecipeImage } from '../../../services/recipeService';
import { useUser } from '../../../context/UserContext';
import Swal from 'sweetalert2';

const DEEP_FOREST_GREEN = '#013D1D';
const AMBER_RICH = '#FFBF00';
const PALE_CREAM = '#FFF8E5';
const SOFT_MINT = '#DCFCE7';
const DANGER_RED = '#740D06';

const ManagePhotosModal = ({ open, onClose, recipeId, currentCover, onCoverSet, onImageChange }) => {
  const { getFreshIdToken } = useUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState({});
  const [settingCover, setSettingCover] = useState({});
  const [rotating, setRotating] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [previewImage, setPreviewImage] = useState(null);

  const fetchImages = useCallback(async () => {
    if (open && recipeId) {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getRecipeImageVersions(recipeId, getFreshIdToken);
        if (response.success) {
          setImages(response.images);
        } else {
          throw new Error(response.message || 'Failed to fetch images.');
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching recipe images:', err);
      } finally {
        setIsLoading(false);
      }
    }
  }, [open, recipeId, getFreshIdToken]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleDelete = async (imageName) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: DANGER_RED,
      cancelButtonColor: '#6e7881',
      confirmButtonText: 'Yes, delete it!',
      customClass: {
        container: 'high-z-index-swal'
      }
    });

    if (result.isConfirmed) {
      try {
        setDeleting(prev => ({ ...prev, [imageName]: true }));
        const response = await deleteRecipeImage(recipeId, imageName, getFreshIdToken);
        if (response.success) {
          setImages(prevImages => prevImages.filter(img => img.name !== imageName));
          setSnackbar({ message: 'Your image has been deleted.', severity: 'success', open: true });

          if (currentCover === `${import.meta.env.VITE_GCS_PUBLIC_BASE}/${import.meta.env.VITE_GCS_BUCKET_NAME}/${imageName}`) {
            onCoverSet({ thumbnail: '', display: '', original: '' });
          }
          if (onImageChange) {
            onImageChange();
          }
        } else {
          throw new Error(response.message || 'Failed to delete image.');
        }
      } catch (err) {
        setSnackbar({ message: err.message || 'Could not delete the image.', severity: 'error', open: true });
      } finally {
        setDeleting(prev => ({ ...prev, [imageName]: false }));
      }
    }
  };

  const handleSetAsCover = async (imageName) => {
    try {
      setSettingCover(prev => ({ ...prev, [imageName]: true }));
      const response = await setRecipeCoverImage(recipeId, imageName, getFreshIdToken);
      if (response.success) {
        onCoverSet(response.recipeImage);
        setSnackbar({ message: 'Cover image has been updated.', severity: 'success', open: true });
        onClose();
      } else {
        throw new Error(response.message || 'Failed to set cover image.');
      }
    } catch (err) {
      setSnackbar({ message: err.message || 'Could not set the cover image.', severity: 'error', open: true });
    } finally {
      setSettingCover(prev => ({ ...prev, [imageName]: false }));
    }
  };

  /**
   * Helper to get the larger "display" version of a thumbnail URL
   */
  const getDisplayVersion = (url) => {
    if (!url) return '';
    return url.replace('-thumbnail.webp', '-display.webp');
  };

  return (
    <>
      <Dialog
        fullScreen={isMobile}
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        scroll="paper"
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
              <Typography sx={{ ml: 2, flex: 1, fontFamily: 'Montserrat', fontWeight: 700 }} variant="h6" component="div">
                Manage Photos
              </Typography>
              <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
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
            Manage Photos
            <IconButton
              aria-label="close"
              onClick={onClose}
              sx={{ color: (theme) => theme.palette.grey[500] }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
        )}

        <DialogContent dividers sx={{ backgroundColor: '#fafafa', p: { xs: 2, md: 3 } }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress sx={{ color: DEEP_FOREST_GREEN }} />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ borderRadius: '12px' }}>{error}</Alert>
          ) : (
            <Box
              component={motion.div}
              layout
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                },
                gap: 3,
              }}
            >
              <AnimatePresence>
                {images.length > 0 ? (
                  images.map((image, index) => {
                    const isCurrentCover = image.url === currentCover;
                    return (
                      <Box
                        key={image.name}
                        component={motion.div}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                      >
                        <Card
                          sx={{
                            borderRadius: '16px',
                            overflow: 'hidden',
                            boxShadow: isCurrentCover
                              ? `0 0 0 3px ${AMBER_RICH}, 0 4px 20px rgba(0,0,0,0.1)`
                              : '0 4px 15px rgba(0,0,0,0.05)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                            },
                            position: 'relative'
                          }}
                        >
                          <Tooltip title="Click to view full size" placement="top" arrow>
                            <CardMedia
                              component="img"
                              height="200"
                              image={image.url}
                              alt={image.name}
                              onClick={() => setPreviewImage(getDisplayVersion(image.url))}
                              sx={{
                                objectFit: 'cover',
                                cursor: 'pointer',
                                transition: 'opacity 0.2s ease',
                                '&:hover': {
                                  opacity: 0.9
                                }
                              }}
                            />
                          </Tooltip>

                          {isCurrentCover && (
                            <Box sx={{
                              position: 'absolute',
                              top: 10,
                              right: 10,
                              backgroundColor: AMBER_RICH,
                              color: DEEP_FOREST_GREEN,
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              fontFamily: 'Montserrat',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                              pointerEvents: 'none'
                            }}>
                              ACTIVE COVER
                            </Box>
                          )}
                          <CardActions sx={{
                            justifyContent: 'center',
                            p: 1.5,
                            backgroundColor: '#ffffff',
                            borderTop: '1px solid #f0f0f0'
                          }}>
                            <Tooltip title="Set as Cover">
                              <IconButton
                                onClick={() => handleSetAsCover(image.name)}
                                disabled={settingCover[image.name] || deleting[image.name] || isCurrentCover}
                                sx={{
                                  color: isCurrentCover ? AMBER_RICH : DEEP_FOREST_GREEN,
                                  '&:hover': { backgroundColor: SOFT_MINT }
                                }}
                              >
                                {settingCover[image.name] ? <CircularProgress size={24} color="inherit" /> : <PhotoCameraFrontIcon />}
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Delete Photo">
                              <IconButton
                                onClick={() => handleDelete(image.name)}
                                disabled={deleting[image.name] || settingCover[image.name]}
                                sx={{
                                  color: DANGER_RED,
                                  '&:hover': { backgroundColor: '#fee2e2' }
                                }}
                              >
                                {deleting[image.name] ? <CircularProgress size={24} color="inherit" /> : <DeleteIcon />}
                              </IconButton>
                            </Tooltip>
                          </CardActions>
                        </Card>
                      </Box>
                    );
                  })
                ) : (
                  <Box sx={{ gridColumn: '1 / -1', textAlign: 'center', p: 4 }}>
                    <Typography sx={{ color: '#666', fontFamily: 'Source Sans 3' }}>
                      No photos found for this recipe.
                    </Typography>
                  </Box>
                )}
              </AnimatePresence>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: isMobile ? 2 : 3, backgroundColor: '#ffffff' }}>
          <Button
            onClick={onClose}
            sx={{
              color: DEEP_FOREST_GREEN,
              fontFamily: 'Montserrat',
              fontWeight: 600,
              textTransform: 'none',
              px: 3
            }}
          >
            Finished
          </Button>
        </DialogActions>
      </Dialog>

      {/* Large Image Preview Dialog */}
      <Dialog
        open={!!previewImage}
        onClose={() => setPreviewImage(null)}
        maxWidth="lg"
        PaperProps={{
          sx: {
            backgroundColor: 'transparent',
            boxShadow: 'none',
            overflow: 'visible', // For close button overflow
            backgroundImage: 'none'
          }
        }}
        BackdropProps={{
          sx: { backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }
        }}
      >
        <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <IconButton
            onClick={() => setPreviewImage(null)}
            sx={{
              position: 'absolute',
              top: -40,
              right: 0,
              color: '#ffffff',
              '&:hover': { color: AMBER_RICH }
            }}
          >
            <CloseIcon />
          </IconButton>
          <img
            src={previewImage}
            alt="Preview"
            style={{
              maxWidth: '95vw',
              maxHeight: '85vh',
              borderRadius: '16px',
              objectFit: 'contain',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}
          />
        </Box>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

ManagePhotosModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  recipeId: PropTypes.string.isRequired,
  currentCover: PropTypes.string,
  onCoverSet: PropTypes.func.isRequired,
  onImageChange: PropTypes.func,
};

ManagePhotosModal.defaultProps = {
  currentCover: '',
  onImageChange: () => { },
};

export default ManagePhotosModal;

