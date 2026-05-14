import PropTypes from 'prop-types';
import { Dialog, DialogContent, List, ListItem, ListItemIcon, ListItemText, IconButton, Typography, Button } from '@mui/material';
import { Bookmark as BookmarkIcon, CheckCircle as CheckCircleIcon, Close as CloseIcon } from '@mui/icons-material';

const SignupModal_v2 = ({ open, onClose, recipeTitle, onSignup, recipeImage }) => (
  <Dialog
    open={open}
    onClose={onClose}
    PaperProps={{
      sx: {
        borderRadius: '24px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
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
          zIndex: 1,
        },
        '&::after': { // Dark overlay
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 2,
        },
      }
    }}
  >
    <IconButton
      aria-label="close"
      onClick={onClose}
      sx={{ position: 'absolute', right: 8, top: 8, color: 'white', zIndex: 4 }}
    >
      <CloseIcon />
    </IconButton>
    <DialogContent sx={{ p: 4, textAlign: 'center', position: 'relative', zIndex: 3 }}>
      <BookmarkIcon sx={{ fontSize: 60, mb: 2 }} />
      <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
        Save it for later
      </Typography>
      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 3 }}>
        {recipeTitle}
      </Typography>
      <List sx={{ mb: 4, textAlign: 'left' }}>
        {[ 'Collect more recipes into your cookbook',
           'Generate your own healing recipes',
           'Build shopping lists instantly'
        ].map((text) => (
          <ListItem key={text} disablePadding>
            <ListItemIcon sx={{ minWidth: 'auto', mr: 1.5, color: 'white' }}><CheckCircleIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary={text} />
          </ListItem>
        ))}
      </List>
      <Button
        variant="contained"
        onClick={onSignup}
        sx={{
          backgroundColor: 'black',
          color: 'white',
          borderRadius: '20px',
          textTransform: 'none',
          fontWeight: 'bold',
          fontSize: '1rem',
          px: 4,
          py: 1,
          '&:hover': {
            backgroundColor: '#333'
          }
        }}
      >
        Create Free Account
      </Button>
    </DialogContent>
  </Dialog>
);

SignupModal_v2.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  recipeTitle: PropTypes.string.isRequired,
  onSignup: PropTypes.func.isRequired,
  recipeImage: PropTypes.string.isRequired,
};

export default SignupModal_v2;