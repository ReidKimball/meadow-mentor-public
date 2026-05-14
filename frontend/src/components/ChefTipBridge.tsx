'use client';

import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { motion } from 'framer-motion';

const CHEF_AVATAR = 'https://storage.googleapis.com/meadow_mentor_public_media/images/chef_kay_in_sun_v4_headerbar.webp';
const AMBER_RICH = '#FFBF00';
const DEEP_FOREST_GREEN = '#013D1D';
const SOFT_MINT = '#DCFCE7';

interface ChefTipBridgeProps {
    recipeSlug: string;
    recipeTitle: string;
    recipeId: string;
}

export default function ChefTipBridge({ recipeSlug, recipeTitle, recipeId }: ChefTipBridgeProps) {
    const handleSubstitutionClick = () => {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('chef_chat_open', {
                detail: {
                    recipeSlug,
                    recipeId,
                    recipeTitle,
                    initialMessage: 'I need to swap an ingredient in this recipe. Can you help me find a good substitute?',
                    trigger: 'chef_tip_bridge',
                },
            }));
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
        >
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2.5, md: 3 },
                    my: 4,
                    borderRadius: 4,
                    bgcolor: SOFT_MINT,
                    border: `1px solid ${DEEP_FOREST_GREEN}15`,
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: 'center',
                    gap: 3,
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(1, 61, 29, 0.08)',
                }}
            >
                {/* Avatar with Amber Halo */}
                <Box
                    sx={{
                        position: 'relative',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        bgcolor: DEEP_FOREST_GREEN,
                        boxShadow: `0 0 20px ${AMBER_RICH}40`,
                        p: 0.5,
                    }}
                >
                    <Box
                        component="img"
                        src={CHEF_AVATAR}
                        alt="Chef Kay"
                        sx={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            // border: '2px solid white',
                        }}
                    />
                </Box>

                {/* Content */}
                <Box sx={{ flexGrow: 1, textAlign: { xs: 'center', sm: 'left' } }}>
                    <Typography
                        variant="h6"
                        sx={{
                            color: DEEP_FOREST_GREEN,
                            fontWeight: 700,
                            fontFamily: 'var(--font-heading, Montserrat)',
                            lineHeight: 1.2,
                            mb: 0.5,
                        }}
                    >
                        Chef Kay's Tip
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            color: `${DEEP_FOREST_GREEN}CC`,
                            fontFamily: 'var(--font-body, Source Sans 3)',
                            fontWeight: 500,
                        }}
                    >
                        Need to swap an ingredient or adapt this for your diet?
                    </Typography>
                </Box>

                {/* Amber Action Button */}
                <Button
                    variant="contained"
                    onClick={handleSubstitutionClick}
                    sx={{
                        bgcolor: AMBER_RICH,
                        color: DEEP_FOREST_GREEN,
                        fontWeight: 700,
                        fontFamily: 'var(--font-heading, Montserrat)',
                        textTransform: 'none',
                        px: 3,
                        py: 1,
                        borderRadius: 3,
                        fontSize: '1rem',
                        whiteSpace: 'nowrap',
                        boxShadow: `0 4px 14px ${AMBER_RICH}60`,
                        '&:hover': {
                            bgcolor: '#f5b800', // Slightly deeper amber
                            boxShadow: `0 6px 20px ${AMBER_RICH}80`,
                            transform: 'translateY(-1px)',
                        },
                        transition: 'all 0.2s ease',
                    }}
                >
                    Ask for a Substitution
                </Button>
            </Paper>
        </motion.div>
    );
}
