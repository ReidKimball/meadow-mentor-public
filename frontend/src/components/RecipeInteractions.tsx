'use client';

import React, { useState } from 'react';
import posthog from 'posthog-js';
import { Button } from '@mui/material';
import {
    AutoFixHigh as AdaptIcon,
} from '@mui/icons-material';
import { Recipe } from '@/types/recipe';
import SignupModal from './SignupModal';

interface RecipeInteractionsProps {
    recipe: Recipe;
    variant?: 'contained' | 'outlined';
    label?: string;
    startIcon?: React.ReactNode;
    initialMessage?: string;
    action?: 'chat' | 'signup';
    recipeImage?: string;
}

export default function RecipeInteractions({
    recipe,
    variant = 'contained',
    label = 'Substitute Ingredients',
    startIcon,
    initialMessage,
    action = 'chat',
    recipeImage
}: RecipeInteractionsProps) {
    const [modalOpen, setModalOpen] = useState(false);

    const handleSaveClick = () => {
        if (action === 'signup') {
            setModalOpen(true);
            return;
        }

        posthog.capture('public_recipe_adapt_btn_clicked', {
            recipeId: recipe?._id,
            recipeSlug: (recipe as any)?.slug,
            recipeTitle: recipe?.recipeTitle,
        });

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('chef_chat_open', {
                detail: {
                    recipeSlug: (recipe as any)?.slug,
                    recipeId: recipe?._id,
                    recipeTitle: recipe?.recipeTitle,
                    initialMessage: initialMessage || 'I want to substitute ingredients in this recipe.',
                    trigger: 'adapt_button',
                },
            }));
        }
    };

    return (
        <>
            <Button
                variant={variant}
                startIcon={startIcon !== undefined ? startIcon : <AdaptIcon />}
                onClick={handleSaveClick}
                sx={{
                    bgcolor: variant === 'contained' ? '#013D1D' : 'transparent',
                    color: variant === 'contained' ? 'white' : '#013D1D',
                    borderColor: '#013D1D',
                    '&:hover': {
                        bgcolor: variant === 'contained' ? '#025a2b' : 'rgba(1, 61, 29, 0.04)',
                        borderColor: '#013D1D',
                    },
                    textTransform: 'none',
                    fontWeight: 'bold',
                    px: 4,
                }}
            >
                {label}
            </Button>

            {action === 'signup' && (
                <SignupModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    recipeTitle={recipe?.recipeTitle || ''}
                    recipeImage={recipeImage || (recipe as any)?.recipeImage?.thumbnail || ''}
                    recipeId={recipe?._id || ''}
                />
            )}
        </>
    );
}
