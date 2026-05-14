import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { IconButton, Menu, MenuItem, ListItemIcon, Typography, Divider, Box, ToggleButtonGroup, ToggleButton, Tooltip } from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  PhotoCamera as PhotoCameraIcon,
  Collections as CollectionsIcon,
  Link as LinkIcon,
  ContentCopy as ContentCopyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';

/**
 * Get the appropriate icon component for a visibility status
 */
const getVisibilityIcon = (visibility, fontSize = 'small') => {
  switch (visibility) {
    case 'public':
      return <VisibilityIcon fontSize={fontSize} />;
    case 'unlisted':
      return <LinkIcon fontSize={fontSize} />;
    case 'private':
    default:
      return <VisibilityOffIcon fontSize={fontSize} />;
  }
};

/**
 * Get a description of what each visibility level means
 */
const getVisibilityDescription = (visibility) => {
  switch (visibility) {
    case 'public':
      return 'Anyone can find and view this recipe';
    case 'unlisted':
      return 'Only people with the link can view';
    case 'private':
    default:
      return 'Only you can view this recipe';
  }
};

const RecipeCardMenu = ({
  onUploadPhoto,
  onManagePhotos,
  onVisibilityChange,
  onToggleSave,
  onCopyUrl,
  onCopyRecipe,
  visibility = 'private',
  isSaved,
  showFullMenu = true, // If false, only show Copy Recipe option
}) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuClick = useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleUploadClick = useCallback(() => {
    if (onUploadPhoto) onUploadPhoto();
    handleMenuClose();
  }, [onUploadPhoto, handleMenuClose]);

  const handleManagePhotosClick = useCallback(() => {
    if (onManagePhotos) onManagePhotos();
    handleMenuClose();
  }, [onManagePhotos, handleMenuClose]);

  const handleToggleSaveClick = useCallback(() => {
    if (onToggleSave) onToggleSave();
    handleMenuClose();
  }, [onToggleSave, handleMenuClose]);

  const handleCopyUrlClick = useCallback(() => {
    if (onCopyUrl) onCopyUrl();
    handleMenuClose();
  }, [onCopyUrl, handleMenuClose]);

  const handleCopyRecipeClick = useCallback(() => {
    if (onCopyRecipe) onCopyRecipe();
    handleMenuClose();
  }, [onCopyRecipe, handleMenuClose]);

  const handleVisibilityChange = useCallback((event, newVisibility) => {
    // Prevent deselection (one option must always be selected)
    if (newVisibility !== null && onVisibilityChange) {
      onVisibilityChange(newVisibility);
    }
    // Keep the menu open when changing visibility for better UX
  }, [onVisibilityChange]);

  return (
    <>
      <Box sx={{ position: 'relative', display: 'inline-block' }}>
        {/* Visibility status icon in upper left */}
        <Box
          sx={{
            position: 'absolute',
            top: -4,
            left: -4,
            backgroundColor: '#013D1D',
            borderRadius: '50%',
            width: 18,
            height: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1
          }}
        >
          <Tooltip title={getVisibilityDescription(visibility)} placement="top">
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              {getVisibilityIcon(visibility, 'inherit')}
            </Box>
          </Tooltip>
        </Box>
        <IconButton
          aria-label="recipe menu"
          onClick={handleMenuClick}
          sx={{
            color: 'white',
            backgroundColor: '#013D1D',
            '&:hover': { backgroundColor: '#025928' }
          }}
        >
          <MoreVertIcon />
        </IconButton>
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {showFullMenu && [
          <MenuItem key="upload" onClick={handleUploadClick}>
            <ListItemIcon>
              <PhotoCameraIcon fontSize="small" />
            </ListItemIcon>
            <Typography variant="inherit">Upload Photo</Typography>
          </MenuItem>,
          <MenuItem key="manage" onClick={handleManagePhotosClick}>
            <ListItemIcon>
              <CollectionsIcon fontSize="small" />
            </ListItemIcon>
            <Typography variant="inherit">Manage Photos</Typography>
          </MenuItem>,
          <MenuItem key="save" onClick={handleToggleSaveClick}>
            <ListItemIcon>
              {isSaved ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
            </ListItemIcon>
            <Typography variant="inherit">{isSaved ? 'Unsave Recipe' : 'Save Recipe'}</Typography>
          </MenuItem>,
          <Divider key="divider1" />,
          <MenuItem key="copyUrl" onClick={handleCopyUrlClick}>
            <ListItemIcon>
              <LinkIcon fontSize="small" />
            </ListItemIcon>
            <Typography variant="inherit">Copy Link to Share</Typography>
          </MenuItem>,
          <MenuItem
            key="visibility"
            onClick={(e) => e.stopPropagation()}
            sx={{
              '&:hover': { backgroundColor: 'transparent' },
              flexDirection: 'column',
              alignItems: 'flex-start',
              py: 1.5
            }}
          >
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
              Visibility
            </Typography>
            <ToggleButtonGroup
              value={visibility}
              exclusive
              onChange={handleVisibilityChange}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  px: 1.5,
                  py: 0.5,
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  '&.Mui-selected': {
                    backgroundColor: '#013D1D',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#025928',
                    }
                  }
                }
              }}
            >
              <ToggleButton value="private">
                <Tooltip title="Only you can view">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <VisibilityOffIcon sx={{ fontSize: 16 }} />
                    Private
                  </Box>
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="unlisted">
                <Tooltip title="Anyone with link can view">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LinkIcon sx={{ fontSize: 16 }} />
                    Unlisted
                  </Box>
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="public">
                <Tooltip title="Anyone can find and view">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <VisibilityIcon sx={{ fontSize: 16 }} />
                    Public
                  </Box>
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </MenuItem>,
          <Divider key="divider2" />
        ]}
        <MenuItem onClick={handleCopyRecipeClick}>
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <Typography variant="inherit">Copy Recipe</Typography>
        </MenuItem>
      </Menu>
    </>
  );
};

RecipeCardMenu.propTypes = {
  onUploadPhoto: PropTypes.func,
  onManagePhotos: PropTypes.func,
  onVisibilityChange: PropTypes.func,
  onToggleSave: PropTypes.func,
  onCopyUrl: PropTypes.func,
  onCopyRecipe: PropTypes.func,
  visibility: PropTypes.oneOf(['private', 'unlisted', 'public']),
  isSaved: PropTypes.bool,
  showFullMenu: PropTypes.bool,
};

RecipeCardMenu.defaultProps = {
  onUploadPhoto: () => { },
  onManagePhotos: () => { },
  onVisibilityChange: () => { },
  onToggleSave: () => { },
  onCopyUrl: () => { },
  onCopyRecipe: () => { },
  visibility: 'private',
  isSaved: false,
  showFullMenu: true,
};

export default React.memo(RecipeCardMenu);