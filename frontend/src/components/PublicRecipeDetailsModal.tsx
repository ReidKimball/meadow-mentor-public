'use client';

/**
 * @file Defines the PublicRecipeDetailsModal component.
 * @description Displays an adapted recipe's full ingredients and steps in a modal for the public `/frontend` ChefChat.
 * This supports the "Option B" UX where details are viewed in-place (no navigation to a new page).
 * @requires module:react - Core React library.
 * @requires module:@mui/material - Dialog and layout components.
 * @requires module:@mui/icons-material/Close - Close icon.
 * @author Cascade
 * @version 1.0.0
 * @date 2025-12-29
 */

import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle, IconButton, Typography, Box, Divider, CardMedia } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const DEFAULT_RECIPE_IMAGE = 'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/Kay_Delivers_Recipe_Header_v2.jpeg';

interface PublicRecipeDetailsRecipe {
    _id: string;
    recipeTitle: string;
    recipeDescription?: string;
    recipeImage?: {
        thumbnail?: string;
        display?: string;
        original?: string;
    };
    ingredients?: Array<{ name?: string; amount?: string | number; unit?: string; notes?: string }>;
    steps?: string[];
}

interface PublicRecipeDetailsModalProps {
    open: boolean;
    onClose: () => void;
    recipe: PublicRecipeDetailsRecipe;
}

/**
 * @component PublicRecipeDetailsModal
 * @description Renders a modal with recipe ingredients and step-by-step instructions.
 * @param {PublicRecipeDetailsModalProps} props - Component props.
 * @returns {JSX.Element} The rendered modal.
 */
export default function PublicRecipeDetailsModal({ open, onClose, recipe }: PublicRecipeDetailsModalProps) {
    const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
    const steps = Array.isArray(recipe.steps) ? recipe.steps : [];

    const imageUrl = useMemo(() => {
        return recipe?.recipeImage?.display || recipe?.recipeImage?.thumbnail || DEFAULT_RECIPE_IMAGE;
    }, [recipe]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            PaperProps={{
                sx: {
                    borderRadius: 3,
                }
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, pb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {recipe.recipeTitle}
                </Typography>
                <IconButton aria-label="close" onClick={onClose} sx={{ mt: -1, mr: -1 }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
                <CardMedia
                    component="img"
                    image={imageUrl}
                    alt={recipe.recipeTitle}
                    sx={{ height: 420, objectFit: 'cover', mb: 3 }}
                />

                <Box sx={{ px: 3, pb: 3 }}>
                    {recipe.recipeDescription ? (
                        <Typography variant="body1" color="text.primary" sx={{ mb: 2 }}>
                            {recipe.recipeDescription}
                        </Typography>
                    ) : null}

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                        Ingredients
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mb: 2 }}>
                        {ingredients.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                                No ingredients available.
                            </Typography>
                        ) : (
                            ingredients.map((ing: any, idx: number) => (
                                <Typography key={`${ing?.name || 'ingredient'}-${idx}`} variant="body1">
                                    {`${ing?.amount ?? ''} ${ing?.unit ?? ''} ${ing?.name ?? ''}`.trim()}
                                    {ing?.notes ? (
                                        <Box component="span" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                            {` (${ing.notes})`}
                                        </Box>
                                    ) : null}
                                </Typography>
                            ))
                        )}
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                        Instructions
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {steps.length === 0 ? (
                            <Typography variant="body1" color="text.secondary">
                                No steps available.
                            </Typography>
                        ) : (
                            steps.map((step: string, idx: number) => (
                                <Box key={`step-${idx}`} sx={{ display: 'flex', gap: 1.5 }}>
                                    <Box
                                        sx={{
                                            minWidth: 24,
                                            height: 24,
                                            borderRadius: '50%',
                                            bgcolor: '#013D1D',
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 700,
                                            fontSize: '0.8rem',
                                            mt: '2px'
                                        }}
                                    >
                                        {idx + 1}
                                    </Box>
                                    <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                                        {step}
                                    </Typography>
                                </Box>
                            ))
                        )}
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
}
