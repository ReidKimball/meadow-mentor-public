'use client';

import React, { useState } from 'react';
import { Card, CardMedia, CardContent, Typography, Box, Rating, Chip, Button } from '@mui/material';
import {
    AccessTime as AccessTimeIcon,
    InfoOutlined as InfoIcon,
    FavoriteBorder as FavoriteBorderIcon,
    AutoFixHigh as AdaptIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { Recipe } from '../types/recipe';
import { APP_BASE_URL } from '../lib/api';
import SignupModal from './SignupModal';

const defaultRecipeImage = 'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/Kay_Delivers_Recipe_Header_v2.jpeg';

const RecipeSummaryCard: React.FC<{ recipe: Recipe }> = ({ recipe }) => {
    const [modalOpen, setModalOpen] = useState(false);

    const imageUrl = recipe.recipeImage?.thumbnail || defaultRecipeImage;
    const allTags = [recipe.recipeDiet, recipe.mealType, ...(recipe.tags || [])].filter(Boolean);
    const uniqueTags = [...new Set(allTags)];

    const handleSaveClick = () => {
        setModalOpen(true);
    };

    return (
        <>
            <Card sx={{ borderRadius: '16px', bgcolor: '#FFF7E6', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <CardMedia component="img" image={imageUrl} alt={recipe.recipeTitle} sx={{ objectFit: 'cover' }} />

                <CardContent sx={{ p: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>{recipe.recipeTitle}</Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Rating value={recipe.averageRating || 0} precision={0.5} readOnly size="small" />
                        <Typography variant="body1" color="text.secondary" sx={{ ml: 1 }}>({recipe.ratings?.length || 0} cooks loved this)</Typography>
                    </Box>

                    <Typography variant="body1" color="text.primary" sx={{ mb: 2 }}>{recipe.recipeDescription}</Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 4 }}>
                        {recipe.totalTime && <Chip icon={<AccessTimeIcon />} label={recipe.totalTime} size="small" />}
                        {uniqueTags.map(tag => <Chip key={tag} label={tag} size="small" />)}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Link href={`/recipes/${recipe.slug}`} style={{ flex: 1, textDecoration: 'none' }}>
                            <Button fullWidth variant="outlined" startIcon={<InfoIcon />} sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}>View Details</Button>
                        </Link>
                        <Button
                            fullWidth
                            variant="contained"
                            startIcon={<FavoriteBorderIcon />}
                            onClick={handleSaveClick}
                            sx={{ flex: 1, textTransform: 'none', bgcolor: '#013D1D' }}
                        >
                            Save
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            <SignupModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                recipeTitle={recipe.recipeTitle}
                recipeImage={imageUrl}
                recipeId={recipe._id}
            />
        </>
    );
};

export default RecipeSummaryCard;
