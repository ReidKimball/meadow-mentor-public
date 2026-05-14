'use client';

import React from 'react';
import posthog from 'posthog-js';
import { Dialog, DialogContent, List, ListItem, ListItemIcon, ListItemText, IconButton, Typography, Button, Box } from '@mui/material';
import {
    Bookmark as BookmarkIcon,
    CheckCircle as CheckCircleIcon,
    Close as CloseIcon,
    AutoFixHigh as AdaptIcon,
    Restaurant as EatIcon,

} from '@mui/icons-material';
import { APP_BASE_URL } from '../lib/api';

// Brand Colors
const DEEP_FOREST_GREEN = '#013D1D';
const AMBER_RICH = '#FFBF00';
const PALE_CREAM = '#FFF8E5';

interface SignupModalProps {
    open: boolean;
    onClose: () => void;
    recipeTitle: string;
    recipeImage: string;
    recipeId: string;
    anonSessionId?: string;
}

const SignupModal: React.FC<SignupModalProps> = ({ open, onClose, recipeTitle, recipeImage, recipeId, anonSessionId }) => {

    const handleSignup = () => {
        posthog.capture('create_account_from_adapt_modal', {
            recipeId,
            recipeTitle,
        });
        // Pass recipe ID + anon session ID as URL query params (localStorage doesn't work cross-domain)
        const url = new URL(`${APP_BASE_URL}/signup`);
        url.searchParams.set('saveRecipe', recipeId);
        if (anonSessionId) {
            url.searchParams.set('anonSessionId', anonSessionId);
        }
        window.location.href = url.toString();
    };

    return (
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
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        // Dark overlay using brand green for cohesion
                        backgroundColor: 'rgba(1, 61, 29, 0.75)',
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
                {/* Adapt icon in amber container - "Morning Sun" style */}
                <Box
                    sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        backgroundColor: AMBER_RICH,
                        boxShadow: 'inset 0 0 20px rgba(255, 160, 0, 0.6)',
                        mb: 2,
                    }}
                >
                    <AdaptIcon sx={{ fontSize: 40, color: DEEP_FOREST_GREEN }} />
                </Box>

                <Typography
                    variant="h5"
                    component="div"
                    sx={{
                        fontWeight: 600,
                        fontFamily: 'var(--font-heading, Montserrat)',
                        mb: 1,
                    }}
                >
                    Save this recipe
                </Typography>
                <Typography
                    variant="h4"
                    component="div"
                    sx={{
                        fontWeight: 700,
                        fontFamily: 'var(--font-heading, Montserrat)',
                        mb: 3,
                    }}
                >
                    {recipeTitle}
                </Typography>

                <List sx={{ mb: 4, textAlign: 'left' }}>
                    {[
                        'Adapt recipes by swapping ingredients, deleting, or adding',
                        'Create your own healing recipes with the help of Chef Kay',
                        'Collect recipes into your personal cookbook',
                        'Publish and share recipes with clients, family, friends',
                        'Build shopping lists instantly',
                        'Create meal plans in seconds',
                        'Scan ingredient labels at the store to check for safety'
                    ].map((text) => (
                        <ListItem key={text} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 'auto', mr: 1.5 }}>
                                <CheckCircleIcon fontSize="small" sx={{ color: AMBER_RICH }} />
                            </ListItemIcon>
                            <ListItemText
                                primary={text}
                                primaryTypographyProps={{
                                    fontFamily: 'var(--font-body, Source Sans 3)',
                                    fontSize: '1.25rem',
                                }}
                            />
                        </ListItem>
                    ))}
                </List>

                {/* CTA Button - "Firefly" style (Amber bg, Green text) for dark context */}
                <Button
                    variant="contained"
                    onClick={handleSignup}
                    sx={{
                        backgroundColor: AMBER_RICH,
                        color: DEEP_FOREST_GREEN,
                        borderRadius: '32px',
                        textTransform: 'none',
                        fontWeight: 'bold',
                        fontFamily: 'var(--font-heading, Montserrat)',
                        fontSize: '1.35rem',
                        px: 4,
                        py: 1.5,
                        '&:hover': {
                            backgroundColor: PALE_CREAM,
                            boxShadow: '0 0 15px rgba(255, 191, 0, 0.6)',
                            transform: 'translateY(-2px)',
                        },
                        transition: 'all 0.2s ease-in-out',
                    }}
                >
                    Create Free Account
                </Button>
            </DialogContent>
        </Dialog>
    );
};

export default SignupModal;
