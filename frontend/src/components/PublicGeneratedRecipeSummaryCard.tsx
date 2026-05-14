'use client';

/**
 * @file Defines the PublicGeneratedRecipeSummaryCard component.
 * @description Renders an adapted recipe "card" inside the public `/frontend` ChefChat.
 * The card supports:
 * - **View Details**: Opens an in-place modal showing ingredients + steps (Option B).
 * - **Save**: Opens the existing SignupModal to drive account creation.
 * @requires module:react - Core React hooks for state.
 * @requires module:@mui/material - Card and button primitives.
 * @requires ./SignupModal - Existing signup modal CTA.
 * @requires ./PublicRecipeDetailsModal - Option B details modal.
 * @author Cascade
 * @version 1.0.0
 * @date 2025-12-29
 */

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardMedia, Typography, Box, Chip, Button, Skeleton, Snackbar, Alert } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';

import SignupModal from './SignupModal';
import PublicRecipeDetailsModal from './PublicRecipeDetailsModal';
import { generatePublicRecipeImage } from '@/services/recipeService';

const DEFAULT_RECIPE_IMAGE = 'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/Kay_Delivers_Recipe_Header_v2.jpeg';

export interface PublicRecipeCardRecipe {
    _id: string;
    recipeTitle: string;
    recipeDescription?: string;
    recipeDiet?: string;
    mealType?: string;
    totalTime?: string;
    prepTime?: string;
    cookTime?: string;
    recipeYield?: string;
    tags?: string[];
    recipeImage?: {
        thumbnail?: string;
        display?: string;
        original?: string;
    };
    ingredients?: Array<{ name?: string; amount?: string | number; unit?: string; notes?: string }>;
    steps?: string[];
    shouldGenerateImage?: boolean;
    source?: string;
}

interface PublicGeneratedRecipeSummaryCardProps {
    recipe: PublicRecipeCardRecipe;
    anonSessionId?: string;
}

/**
 * @component PublicGeneratedRecipeSummaryCard
 * @description Displays a compact recipe summary card suitable for a narrow chat UI.
 * @param {PublicGeneratedRecipeSummaryCardProps} props - Component props.
 * @returns {JSX.Element} Rendered recipe card.
 */
export default function PublicGeneratedRecipeSummaryCard({ recipe, anonSessionId }: PublicGeneratedRecipeSummaryCardProps) {
    const [currentRecipe, setCurrentRecipe] = useState<PublicRecipeCardRecipe>(recipe);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [signupOpen, setSignupOpen] = useState(false);
    const hasValidImage = !!(recipe.recipeImage?.thumbnail || recipe.recipeImage?.display || recipe.recipeImage?.original);
    const [isGeneratingImage, setIsGeneratingImage] = useState(!!recipe.shouldGenerateImage && !hasValidImage);
    const [imageGenerationError, setImageGenerationError] = useState(false);
    const [showErrorToast, setShowErrorToast] = useState(false);

    // Sync state if props change (e.g., from a new socket event)
    useEffect(() => {
        setCurrentRecipe(recipe);
        const hasImg = !!(recipe.recipeImage?.thumbnail || recipe.recipeImage?.display || recipe.recipeImage?.original);
        if (recipe.shouldGenerateImage && !hasImg) {
            setIsGeneratingImage(true);
        }
    }, [recipe]);

    // Handle asynchronous image generation
    useEffect(() => {
        let mounted = true;

        if (isGeneratingImage && currentRecipe._id && anonSessionId) {
            generatePublicRecipeImage(currentRecipe._id, anonSessionId)
                .then((res) => {
                    if (mounted && res.success && res.data) {
                        setCurrentRecipe((prev) => ({
                            ...prev,
                            recipeImage: res.data,
                            shouldGenerateImage: false
                        }));
                    } else if (mounted) {
                        setImageGenerationError(true);
                        setShowErrorToast(true);
                    }
                })
                .catch((err) => {
                    console.error('Failed to generate image:', err);
                    if (mounted) {
                        setImageGenerationError(true);
                        setShowErrorToast(true);
                    }
                })
                .finally(() => {
                    if (mounted) {
                        setIsGeneratingImage(false);
                    }
                });
        }

        return () => {
            mounted = false;
        };
    }, [isGeneratingImage, currentRecipe._id, anonSessionId]);

    const imageUrl = useMemo(() => {
        return currentRecipe?.recipeImage?.thumbnail || currentRecipe?.recipeImage?.display || DEFAULT_RECIPE_IMAGE;
    }, [currentRecipe]);

    const chips = useMemo(() => {
        const all = [currentRecipe.recipeDiet, currentRecipe.mealType, ...(Array.isArray(currentRecipe.tags) ? currentRecipe.tags : [])].filter(Boolean) as string[];
        return [...new Set(all)].slice(0, 6);
    }, [currentRecipe]);

    return (
        <>
            <Card
                elevation={0}
                sx={{
                    borderRadius: 3,
                    bgcolor: '#FFF7E6',
                    border: '1px solid rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                }}
            >
                {isGeneratingImage ? (
                    <Box sx={{ position: 'relative', height: 260 }}>
                        <Skeleton variant="rectangular" height="100%" animation="wave" />
                        <Typography
                            variant="body2"
                            sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                color: 'text.secondary',
                                fontWeight: 500,
                                zIndex: 1,
                                textAlign: 'center',
                                width: '100%',
                            }}
                        >
                            {imageGenerationError ? "Oops! The photo burned. Using a generic one." : "Recipe photo cooking..."}
                        </Typography>
                    </Box>
                ) : (
                    <CardMedia component="img" image={imageUrl} alt={currentRecipe.recipeTitle} sx={{ height: 260, objectFit: 'cover' }} />
                )}

                <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.75, lineHeight: 1.25 }}>
                        {currentRecipe.recipeTitle}
                    </Typography>

                    {currentRecipe.recipeDescription ? (
                        <Typography variant="body1" color="text.primary" sx={{ mb: 1.5 }}>
                            {currentRecipe.recipeDescription}
                        </Typography>
                    ) : null}

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
                        {currentRecipe.totalTime ? <Chip size="small" label={currentRecipe.totalTime} /> : null}
                        {chips.map((t) => (
                            <Chip key={t} size="small" label={t} />
                        ))}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<InfoOutlinedIcon />}
                            onClick={() => setDetailsOpen(true)}
                            sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
                        >
                            View Details
                        </Button>
                        <Button
                            fullWidth
                            variant="contained"
                            startIcon={<BookmarkAddIcon />}
                            onClick={() => setSignupOpen(true)}
                            sx={{ textTransform: 'none', bgcolor: '#013D1D', '&:hover': { bgcolor: '#012a14' } }}
                        >
                            Save
                        </Button>
                    </Box>
                </CardContent>
            </Card>

            <PublicRecipeDetailsModal open={detailsOpen} onClose={() => setDetailsOpen(false)} recipe={currentRecipe} />

            <SignupModal
                open={signupOpen}
                onClose={() => setSignupOpen(false)}
                recipeTitle={currentRecipe.recipeTitle}
                recipeImage={imageUrl}
                recipeId={currentRecipe._id}
                anonSessionId={anonSessionId}
            />

            <Snackbar
                open={showErrorToast}
                autoHideDuration={6000}
                onClose={() => setShowErrorToast(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setShowErrorToast(false)} severity="error" sx={{ width: '100%' }}>
                    Failed to generate recipe photo.
                </Alert>
            </Snackbar>
        </>
    );
}
