import { useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card, CardMedia, CardContent, Box, Typography, Button, Chip, Rating, Tooltip, Dialog, DialogContent, List, ListItem, ListItemIcon, ListItemText, IconButton } from '@mui/material';
import { Favorite as FavoriteIcon, FavoriteBorder as FavoriteBorderIcon, AccessTime as AccessTimeIcon, InfoOutlined as InfoIcon, Bookmark as BookmarkIcon, CheckCircle as CheckCircleIcon, Close as CloseIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router';
import { useUser } from '../../../context/UserContext';
import { RecipeContext } from '../../../context/RecipeContext';

// Default recipe image used when no custom image is uploaded
const defaultRecipeImage = 'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/Kay_Delivers_Recipe_Header_v2.jpeg';

import UpgradeModal_v2 from '../../Common/UpgradeModal_v2';
import SignupModal_v2 from '../../Common/SignupModal_v2';

const RecipeSummaryCard = ({ recipe }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const recipeContext = useContext(RecipeContext);
  const [signupModalOpen, setSignupModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeModalMessage, setUpgradeModalMessage] = useState('');
  const [modalImageUrl, setModalImageUrl] = useState('');

  // Guard against context being undefined during initial renders
  if (!recipeContext) {
    // You can return a loading state or null
    return null;
  }

  const { saveRecipe, unsaveRecipe, savedRecipeIds } = recipeContext;

  useEffect(() => {
    const imageSrc = getRecipeImage();
    setModalImageUrl(typeof imageSrc === 'string' ? imageSrc : imageSrc.src);
  }, [recipe.recipeImage?.thumbnail]);

  const isSaved = recipe?._id && savedRecipeIds.has(recipe._id);

  const getRecipeImage = () => {
    return recipe.recipeImage?.thumbnail || defaultRecipeImage;
  };

  const handleSaveClick = async () => {
    if (!user) {
      setSignupModalOpen(true);
      return;
    }

    try {
      if (isSaved) {
        await unsaveRecipe(recipe._id);
      } else {
        // Client-side check for immediate feedback
        if (user.subscriptionTier === 'free' && savedRecipeIds.size >= 5) {
          setUpgradeModalMessage('Upgrade to save more than 5 recipes.');
          setUpgradeModalOpen(true);
          return; // Stop before making the API call
        }
        await saveRecipe(recipe);
      }
    } catch (error) {
      // Server-side check for robustness
      if (error.body?.errorCode === 'LIMIT_EXCEEDED_RECIPES') {
        setUpgradeModalMessage(error.body?.message || 'Upgrade to save more recipes.');
        setUpgradeModalOpen(true);
      } else {
        console.error('Failed to save or unsave recipe:', error);
        // Optionally, show a generic error message to the user
      }
    }
  };

  const handleCardClick = () => {
    navigate(`/recipes/${recipe.slug}`);
  };

  const ratingCount = recipe.ratings?.length || 0;

  // Combine and de-duplicate tags
  const allTags = [
    recipe.recipeDiet,
    recipe.mealType,
    ...(recipe.tags || [])
  ].filter(Boolean); // filter(Boolean) removes any null/undefined/empty strings
  const uniqueTags = [...new Set(allTags)];

  return (
    <>
      <Card sx={{
        maxWidth: 360,
        margin: 'auto',
        borderRadius: '16px',
        position: 'relative',
        backgroundColor: '#FFF7E6', // Light peach background
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
      }}>
        <Box sx={{ position: 'relative' }}>
          <CardMedia
            component="img"
            height="200"
            image={getRecipeImage()}
            alt={recipe.recipeTitle}
          />

        </Box>

        <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          <Typography gutterBottom variant="h5" component="div" sx={{ fontWeight: 'bold', textAlign: 'left' }}>
            {recipe.recipeTitle}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'left', my: 1 }}>
            <Rating name="read-only-rating" value={recipe.averageRating} precision={0.5} readOnly size="small" />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              ({ratingCount} cooks loved this)
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ minHeight: '60px', textAlign: 'left', flexGrow: 1 }}>
            {recipe.recipeDescription}
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, my: 1.5, justifyContent: 'left' }}>
            {recipe.totalTime && <Chip icon={<AccessTimeIcon />} label={recipe.totalTime} size="small" sx={{ bgcolor: '#E0E0E0' }} />}
            {uniqueTags.map(tag => (
              <Chip key={tag} label={tag} size="small" sx={{ bgcolor: '#E0E0E0' }} />
            ))}
          </Box>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Tooltip title="View ingredients and instructions" placement="top">
              <Button
                variant="outlined"
                startIcon={<InfoIcon />}
                onClick={handleCardClick}
                sx={{
                  flexGrow: 1,
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 'bold',
                }}
              >
                View Details
              </Button>
            </Tooltip>
            <Tooltip title={isSaved ? "Remove from your cookbook" : "Save to your free cookbook"} placement="top">
              <Button
                variant="contained"
                startIcon={isSaved ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                onClick={handleSaveClick}
                sx={{
                  flexGrow: 1,
                  backgroundColor: isSaved ? 'primary.light' : 'primary.main',
                  '&:hover': { backgroundColor: isSaved ? 'grey.700' : 'primary.dark' },
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 'bold',
                }}
              >
                {isSaved ? 'Unsave Recipe' : 'Save Recipe'}
              </Button>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>
      <SignupModal_v2
        open={signupModalOpen}
        onClose={() => setSignupModalOpen(false)}
        recipeTitle={recipe.recipeTitle}
        onSignup={() => navigate('/signup', { state: { from: location.pathname } })}
        recipeImage={modalImageUrl}
      />

      <UpgradeModal_v2
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        message={upgradeModalMessage}
        recipeImage={modalImageUrl}
      />
    </>
  );
};

// Add PropTypes validation
RecipeSummaryCard.propTypes = {
  recipe: PropTypes.shape({
    _id: PropTypes.string,
    slug: PropTypes.string.isRequired,
    recipeTitle: PropTypes.string.isRequired,
    recipeDescription: PropTypes.string,
    recipeImage: PropTypes.oneOfType([
      PropTypes.string, // For backward compatibility
      PropTypes.shape({
        thumbnail: PropTypes.string,
        display: PropTypes.string,
        original: PropTypes.string,
      }),
    ]),
    recipeDiet: PropTypes.string,
    mealType: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    totalTime: PropTypes.string,
    averageRating: PropTypes.number,
    ratings: PropTypes.arrayOf(PropTypes.object),
  }).isRequired,
};

export default RecipeSummaryCard;
