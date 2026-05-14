"use client";

import React, { useState } from 'react';
import { Box, Container, Typography, Button, useTheme, useMediaQuery } from '@mui/material';
import { motion, Variants } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, X, ZoomIn } from 'lucide-react';

// Animation variants
const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: "easeOut" }
    }
};

const imagePop: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.6, ease: "backOut" }
    }
};

const steps = [
    {
        id: 1,
        title: "Wake Up to a Plan",
        description: "No more 'what's for breakfast?' panic. Your day starts with a personalized menu designed for your gut health.",
        image: "https://storage.googleapis.com/meadow_mentor_public_media/images/meal_planner_kitchen_scene_v01.webp",
        alt: "Meal Planner on a kitchen counter",
        rotation: -2,
        screenshot: "https://storage.googleapis.com/meadow_mentor_public_media/images/in_app_screen_01.webp",
    },
    {
        id: 2,
        title: "Shop with Purpose",
        description: "Navigate the aisles and farmers market with confidence. Your shopping list is automatically created from recipes, and customizable.",
        image: "https://storage.googleapis.com/meadow_mentor_public_media/images/shopping_ingredients_farmers_market_scene_v02.webp",
        alt: "Shopping for fresh ingredients",
        rotation: 2,
        screenshot: "https://storage.googleapis.com/meadow_mentor_public_media/images/in_app_screen_02b.webp",
    },
    {
        id: 3,
        title: "X-Ray Vision for Labels",
        description: "Not sure about an ingredient? Snap a photo. Meadow Mentor instantly spots hidden triggers.",
        image: "https://storage.googleapis.com/meadow_mentor_public_media/images/shopping_ingredient_label_checker_v04.webp",
        alt: "Checking ingredient labels with AI",
        rotation: -1.5,
        screenshot: "https://storage.googleapis.com/meadow_mentor_public_media/images/in_app_screen_03.webp",
    },
    {
        id: 4,
        title: "Chef Kay at Your Side",
        description: "Cooking made simple. Step-by-step guidance that turns 'dietary restriction' into 'culinary freedom'.",
        image: "https://storage.googleapis.com/meadow_mentor_public_media/images/recipe_ingredients_kitchen_scene_v04.webp",
        alt: "Cooking with fresh ingredients",
        rotation: 1.5,
        screenshot: "https://storage.googleapis.com/meadow_mentor_public_media/images/in_app_screen_04b.webp",
    },
    {
        id: 5,
        title: "Food That Loves You Back",
        description: "Savor the moment. Sit down to a meal that’s safe, delicious, and fully aligned with your therapeutic diet.",
        image: "https://storage.googleapis.com/meadow_mentor_public_media/images/recipe_finished_meal_scene_v02.webp",
        alt: "Enjoying a finished healthy meal",
        rotation: -1,
        screenshot: "https://storage.googleapis.com/meadow_mentor_public_media/images/in_app_screen_05b.webp",
    },
];

export default function FeaturesClient() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    return (
        <Box sx={{ overflow: 'hidden' }}>
            {/* Hero Section */}
            <Box
                component="section"
                sx={{
                    background: 'linear-gradient(180deg, #dcfce7 0%, #fafafa 100%)',
                    pt: { xs: 12, md: 20 },
                    pb: { xs: 8, md: 12 },
                    textAlign: 'center',
                }}
            >
                <Container maxWidth="lg">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeInUp}
                    >
                        <Typography
                            variant="h1"
                            component="h1"
                            sx={{
                                fontFamily: 'var(--font-heading)',
                                fontWeight: 700,
                                color: '#013D1D',
                                fontSize: { xs: '2.5rem', md: '3.5rem' },
                                mb: 3,
                            }}
                        >
                            Your Journey to Gut Health Freedom
                        </Typography>
                        <Typography
                            variant="h2"
                            component="p"
                            sx={{
                                fontFamily: 'var(--font-body)',
                                fontWeight: 400,
                                color: '#1a1a1a',
                                fontSize: { xs: '1.1rem', md: '1.5rem' },
                                maxWidth: '800px',
                                mx: 'auto',
                                lineHeight: 1.6,
                            }}
                        >
                            From morning plans to evening meals, see how Meadow Mentor transforms a typical day from stressful to simple.
                        </Typography>
                    </motion.div>
                </Container>
            </Box>

            {/* Timeline Section */}
            <Box component="section" sx={{ py: 10, position: 'relative', bgcolor: '#fafafa' }}>
                {/* Central Dashed Line (Desktop only) */}
                {!isMobile && (
                    <Box
                        sx={{
                            position: 'absolute',
                            left: '50%',
                            top: 0,
                            bottom: 0,
                            width: '2px',
                            borderLeft: '2px dashed #013D1D',
                            opacity: 0.2,
                            transform: 'translateX(-50%)',
                        }}
                    />
                )}

                <Container maxWidth="lg">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.id}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-100px" }}
                            variants={fadeInUp}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', md: index % 2 === 0 ? 'row' : 'row-reverse' },
                                    alignItems: 'center',
                                    gap: { xs: 6, md: 12, lg: 16 }, // Use gap to enforce separation from center
                                    mb: { xs: 12, md: 16 },
                                    position: 'relative',
                                }}
                            >
                                {/* Text Side */}
                                <Box
                                    sx={{
                                        flex: 1,
                                        textAlign: { xs: 'center', md: index % 2 === 0 ? 'right' : 'left' },
                                        px: { xs: 2, md: 0 }, // Remove large padding, let gap handle it
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: 40,
                                            height: 40,
                                            borderRadius: '50%',
                                            bgcolor: '#FFBF00',
                                            color: '#013D1D',
                                            fontWeight: 700,
                                            fontFamily: 'var(--font-heading)',
                                            mb: 2,
                                        }}
                                    >
                                        {step.id}
                                    </Box>
                                    <Typography
                                        variant="h3"
                                        component="h3"
                                        sx={{
                                            fontFamily: 'var(--font-heading)',
                                            fontWeight: 700,
                                            color: '#013D1D',
                                            fontSize: { xs: '1.75rem', md: '2.5rem' },
                                            mb: 2,
                                        }}
                                    >
                                        {step.title}
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            fontFamily: 'var(--font-body)',
                                            color: '#4b5563',
                                            fontSize: { xs: '1rem', md: '1.25rem' },
                                            lineHeight: 1.7,
                                        }}
                                    >
                                        {step.description}
                                    </Typography>
                                </Box>

                                {/* Image Side */}
                                <Box
                                    sx={{
                                        flex: 1,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        position: 'relative',
                                        width: '100%',
                                    }}
                                >
                                    <motion.div variants={imagePop} style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                                        <Box
                                            onClick={() => step.screenshot && setSelectedImage(step.screenshot)}
                                            sx={{
                                                position: 'relative',
                                                width: { xs: '100%', sm: 400, md: 450 },
                                                maxWidth: '100%',
                                                height: { xs: 300, sm: 300, md: 340 },
                                                bgcolor: 'white',
                                                p: 2,
                                                pb: 6, // Polaroid bottom space
                                                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                                                transform: `rotate(${step.rotation}deg)`,
                                                transition: 'transform 0.3s ease',
                                                cursor: step.screenshot ? 'zoom-in' : 'default',
                                                '&:hover': {
                                                    transform: `rotate(0deg) scale(1.02)`,
                                                    zIndex: 10,
                                                },
                                            }}
                                        >
                                            <Box sx={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
                                                <Image
                                                    src={step.image}
                                                    alt={step.alt}
                                                    fill
                                                    style={{ objectFit: 'cover' }}
                                                    sizes="(max-width: 768px) 100vw, 500px"
                                                />
                                                {step.screenshot && (
                                                    <Box
                                                        sx={{
                                                            position: 'absolute',
                                                            bottom: 10,
                                                            right: 10,
                                                            bgcolor: 'rgba(255,255,255,0.9)',
                                                            borderRadius: '50%',
                                                            p: 0.5,
                                                            opacity: 0,
                                                            transition: 'opacity 0.2s',
                                                            '.MuiBox-root:hover &': { opacity: 1 },
                                                        }}
                                                    >
                                                        <ZoomIn size={20} color="#013D1D" />
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>
                                    </motion.div>
                                </Box>
                            </Box>
                        </motion.div>
                    ))}
                </Container>
            </Box>

            {/* Final CTA Section */}
            <Box
                component="section"
                sx={{
                    background: 'linear-gradient(135deg, #013D1D 0%, #0f5132 100%)',
                    py: { xs: 10, md: 16 },
                    textAlign: 'center',
                    color: 'white',
                }}
            >
                <Container maxWidth="md">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeInUp}
                    >
                        <Typography
                            variant="h2"
                            sx={{
                                fontFamily: 'var(--font-heading)',
                                fontWeight: 700,
                                mb: 3,
                                fontSize: { xs: '2rem', md: '3rem' },
                            }}
                        >
                            Start Your Journey Today
                        </Typography>
                        <Typography
                            variant="h5"
                            sx={{
                                fontFamily: 'var(--font-body)',
                                mb: 6,
                                opacity: 0.9,
                                lineHeight: 1.6,
                            }}
                        >
                            Join thousands who have found freedom through therapeutic diets.
                            Try Meadow Mentor free and see the difference a day makes.
                        </Typography>
                        <Button
                            component={Link}
                            href="/pricing"
                            variant="contained"
                            size="large"
                            endIcon={<ArrowRight />}
                            sx={{
                                bgcolor: 'white',
                                color: '#013D1D',
                                fontFamily: 'var(--font-heading)',
                                fontWeight: 600,
                                fontSize: '1.1rem',
                                px: 5,
                                py: 1.5,
                                borderRadius: '50px',
                                boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                                '&:hover': {
                                    bgcolor: '#f0fdf4',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 12px 24px rgba(0,0,0,0.3)',
                                },
                                transition: 'all 0.3s ease',
                            }}
                        >
                            Start Free Trial
                        </Button>
                    </motion.div>
                </Container>
            </Box>

            {/* Image Lightbox Modal - Simple version */}
            {selectedImage && (
                <div
                    onClick={() => setSelectedImage(null)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                    }}
                >
                    <button
                        onClick={() => setSelectedImage(null)}
                        style={{
                            position: 'absolute',
                            top: 20,
                            right: 20,
                            background: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: 44,
                            height: 44,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10000,
                        }}
                    >
                        <X size={24} color="#013D1D" />
                    </button>
                    <Image
                        src={selectedImage}
                        alt="App screenshot"
                        width={400}
                        height={800}
                        style={{ maxHeight: '90vh', width: 'auto', objectFit: 'contain' }}
                        quality={100}
                        priority
                    />
                </div>
            )}
        </Box>
    );
}
