import React, { useState, useEffect } from 'react';
import {
    Button,
    Modal,
    Box,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Typography,
    CircularProgress,
    Divider,
} from '@mui/material';
import { useUser } from '../../../context/UserContext';
import { getSavedRecipes } from '../../../services/recipeService';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: 500,
    bgcolor: 'background.paper',
    borderRadius: '8px',
    boxShadow: 24,
    p: 4,
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
};

const listContainerStyle = {
    overflowY: 'auto',
    flexGrow: 1,
};

const AddFromRecipeModal = ({ isOpen, onClose, onAdd, getFreshIdToken }) => {
    const { user } = useUser();
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && user) {
            const fetchRecipes = async () => {
                setLoading(true);
                setError('');
                try {
                    // getSavedRecipes now correctly returns an array or throws an error.
                    const savedRecipes = (await getSavedRecipes(getFreshIdToken)) || [];

                    if (!Array.isArray(savedRecipes)) {
                        console.error('getSavedRecipes did not return an array:', savedRecipes);
                        throw new Error('Received an unexpected format for recipes.');
                    }

                    // Filter by user's primary diet if available
                    const filteredRecipes = user?.primaryDiet 
                        ? savedRecipes.filter((recipe) => recipe.recipeDiet === user.primaryDiet)
                        : savedRecipes;
                    
                    // Sort by creation date: newest first
                    const sortedRecipes = filteredRecipes.sort((a, b) => {
                        const dateA = new Date(a.createdAt || 0);
                        const dateB = new Date(b.createdAt || 0);
                        return dateB - dateA; // Descending order (newest first)
                    });
                    
                    setRecipes(sortedRecipes);
                } catch (err) {
                    console.error('Failed to fetch saved recipes:', err);
                    setError('Could not load your saved recipes. Please try again.');
                } finally {
                    setLoading(false);
                }
            };
            fetchRecipes();
        }
    }, [isOpen, user, getFreshIdToken]);

    const handleRecipeClick = (recipe) => {
        if (recipe.ingredients && recipe.ingredients.length > 0) {
            onAdd(recipe.ingredients);
        }
        onClose();
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <Modal open={isOpen} onClose={onClose} aria-labelledby="add-from-recipe-modal-title">
            <Box sx={style}>
                <Typography id="add-from-recipe-modal-title" variant="h5" component="h2" sx={{ mb: 2 }}>
                    Add Ingredients from Recipe
                </Typography>
                <Box sx={listContainerStyle}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : error ? (
                        <Typography color="error">{error}</Typography>
                    ) : recipes.length > 0 ? (
                        <List>
                            {recipes.map((recipe) => (
                                <React.Fragment key={recipe._id}>
                                    <ListItem disablePadding>
                                        <ListItemButton onClick={() => handleRecipeClick(recipe)}>
                                            <ListItemText
                                                primary={recipe.recipeTitle}
                                                secondary={`Created: ${formatDate(recipe.createdAt)}`}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                    <Divider component="li" />
                                </React.Fragment>
                            ))}
                        </List>
                    ) : (
                        <Typography>No saved recipes found for your primary diet ({user?.primaryDiet || 'Not set'}).</Typography>
                    )}
                </Box>
                <Button onClick={onClose} sx={{ mt: 2, alignSelf: 'flex-end' }}>Cancel</Button>
            </Box>
        </Modal>
    );
};

export default AddFromRecipeModal;