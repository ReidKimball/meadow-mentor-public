"use client";

import React, { useRef } from 'react';
import { Box, Container, Typography, Card, CardContent, Divider, List, ListItem, ListItemIcon, ListItemText, Button } from '@mui/material';
import {
    Check,
    Star,
    Zap,
    Crown,
    Sparkles,
    TrendingUp,
    Package,
    ChevronLeft,
    ChevronRight,
    MessageCircle,
    Compass,
    BookOpen,
    ShoppingCart,
    Calendar,
    Users,
    Heart,
} from 'lucide-react';
import CTAButton from '@/components/CTAButton';
import { APP_BASE_URL } from '@/lib/api';

const CreditBadge = ({ credits }: { credits: number }) => (
    <Box sx={{
        position: 'absolute',
        top: 16,
        left: 0,
        bgcolor: '#FFBF00',
        color: '#013D1D',
        px: 2,
        py: 1,
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        zIndex: 10,
        boxShadow: '0 4px 12px rgba(255, 191, 0, 0.4)',
        fontWeight: 800,
        fontSize: '0.75rem',
        fontFamily: 'var(--font-heading, Montserrat)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
    }}>
        <Sparkles size={14} strokeWidth={3} />
        {credits} {credits === 1 ? 'Credit' : 'Credits'}
    </Box>
);

export default function PricingClient() {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const packages = [
        { id: 'sampler', name: 'The Sampler', credits: 10, price: 2.5, popular: false },
        { id: 'starter', name: 'The Starter', credits: 25, price: 5, popular: false },
        { id: 'healer', name: 'The Healer', credits: 100, price: 15, popular: true },
        { id: 'healthstyle', name: 'The Healthstyle', credits: 250, price: 30, popular: false },
    ];

    const getPackageIcon = (id: string) => {
        switch (id) {
            case 'free': return <Heart size={24} />;
            case 'sampler': return <Sparkles size={24} />;
            case 'starter': return <Zap size={24} />;
            case 'healer': return <Crown size={24} />;
            case 'healthstyle': return <TrendingUp size={24} />;
            default: return <Star size={24} />;
        }
    };

    const getPackageColor = (id: string) => {
        return id === 'healer' ? '#FFBF00' : '#013D1D';
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#FFFFFF' }}>
            {/* Hero Section */}
            <Box
                sx={{
                    background: 'linear-gradient(180deg, #FFF8E5 0%, #FFFFFF 100%)',
                    pt: { xs: 8, md: 12 },
                    pb: { xs: 8, md: 12 },
                    textAlign: 'center'
                }}
            >
                <Container maxWidth="lg">
                    <Typography
                        variant="h1"
                        sx={{
                            fontSize: { xs: '2.5rem', md: '3.5rem' },
                            fontWeight: 800,
                            color: '#013D1D',
                            mb: 2,
                            fontFamily: 'var(--font-heading, Montserrat)',
                        }}
                    >
                        Tools for Your Journey
                    </Typography>
                    <Typography
                        variant="h5"
                        sx={{
                            color: '#444',
                            maxWidth: '800px',
                            mx: 'auto',
                            mb: 0,
                            fontFamily: 'var(--font-body, "Source Sans 3")',
                            lineHeight: 1.6
                        }}
                    >
                        Whether you're just starting out or a seasoned pro at managing your gut health, Meadow Mentor gives you the tools to thrive. Choose the plan that fits your pace.
                    </Typography>
                </Container>
            </Box>

            <Container maxWidth="xl" sx={{ pb: 12 }}>
                {/* WHAT'S ALWAYS FREE SECTION (TOP SECTION) */}
                <Box sx={{ mt: { xs: 4, md: 8 }, mb: 16 }}>
                    <Typography
                        variant="h2"
                        sx={{
                            textAlign: 'center',
                            fontWeight: 800,
                            fontFamily: 'var(--font-heading, Montserrat)',
                            color: '#013D1D',
                            mb: 2
                        }}
                    >
                        What's Always Free
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            textAlign: 'center',
                            color: '#666',
                            maxWidth: '750px',
                            mx: 'auto',
                            mb: 8,
                            fontSize: '1.25rem',
                            lineHeight: 1.6
                        }}
                    >
                        Meadow Mentor is designed to be your daily companion. These essential tools are available to everyone, no credits required.
                    </Typography>

                    {/* Wide Landscape Free Card */}
                    <Card
                        sx={{
                            mb: 8,
                            borderRadius: 6,
                            border: '2px solid #DCFCE7',
                            bgcolor: '#FFFFFF',
                            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.05)',
                            overflow: 'hidden'
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', md: 'row' },
                                alignItems: 'center'
                            }}
                        >
                            <Box
                                sx={{
                                    p: { xs: 4, md: 6 },
                                    bgcolor: '#FFF8E5',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minWidth: { md: '300px' },
                                    textAlign: 'center'
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: '24px',
                                        bgcolor: '#FFBF00',
                                        color: '#013D1D',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mb: 3,
                                        boxShadow: 'inset 0 0 15px rgba(255, 160, 0, 0.4)'
                                    }}
                                >
                                    <Heart size={40} />
                                </Box>
                                <Typography variant="h4" sx={{ fontWeight: 800, color: '#013D1D', mb: 1, fontFamily: 'var(--font-heading, Montserrat)' }}>
                                    Free Forever
                                </Typography>
                                <Typography variant="h6" sx={{ color: '#013D1D', opacity: 0.8, fontWeight: 600 }}>
                                    Basic Plan
                                </Typography>
                                <Box sx={{ mt: 3 }}>
                                    <CTAButton href={`${APP_BASE_URL}/signup`} size="large">
                                        Get Started Free
                                    </CTAButton>
                                </Box>
                            </Box>

                            <Box sx={{ p: { xs: 4, md: 6 }, flexGrow: 1 }}>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: '#013D1D', mb: 4, fontFamily: 'var(--font-heading, Montserrat)' }}>
                                    Everything you need to manage your daily diet:
                                </Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                                    {[
                                        "Unlimited Chat with Chef Kay",
                                        "Search Food Compass Database",
                                        "Manual Shopping Lists",
                                        "Assign meal plans to dates",
                                        "Community recipe access & sharing",
                                        "Manual Recipe Management",
                                        "Upload Personal Recipe Photos",
                                        "Edit & Copy Recipes"
                                    ].map((feature, i) => (
                                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Box sx={{ color: '#013D1D', bgcolor: '#DCFCE7', borderRadius: '50%', p: 0.5, display: 'flex' }}>
                                                <Check size={16} strokeWidth={4} />
                                            </Box>
                                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#444' }}>
                                                {feature}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Box>
                    </Card>

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                            gap: 4
                        }}
                    >
                        {[
                            {
                                title: "Unlimited Chef Kay Chat",
                                desc: "Chat with Chef Kay anytime, for free. Get advice on your diet, learn about managing symptoms, or ask Kay to help you find a recipe in your saved collection.",
                                icon: <MessageCircle size={32} />,
                                color: "#DCFCE7"
                            },
                            {
                                title: "Food Compass Database",
                                desc: "Instantly check if an ingredient is safe for your specific diet. Search our massive database to see if foods are allowed or should be avoided on your journey.",
                                icon: <Compass size={32} />,
                                color: "#FFF8E5"
                            },
                            {
                                title: "Master Your Recipes",
                                desc: "Complete control over your saved recipes. Manually edit ingredients, steps, and notes. You can even upload your own photos to make your digital cookbook personal.",
                                icon: <BookOpen size={32} />,
                                color: "#FFF8E5"
                            },
                            {
                                title: "Manual Planning & Lists",
                                desc: "Stay organized with smart shopping lists and meal planning. Manually add items to your list, assign recipes to specific dates, and manage your weekly meal schedule.",
                                icon: <Calendar size={32} />,
                                color: "#DCFCE7"
                            },
                            {
                                title: "Community & Sharing",
                                desc: "Explore the public recipe library, save community favorites to your own list, and share your own discoveries with others. Copy and customize any recipe for your needs.",
                                icon: <Users size={32} />,
                                color: "#FFE4E1"
                            },
                            {
                                title: "Thrive, One Meal at a Time",
                                desc: "Our mission is to reduce your mental load. Use these basic tools to navigate your gut health journey with confidence and clarity, every single day.",
                                icon: <Heart size={32} />,
                                color: "#E0F2FE"
                            }
                        ].map((feature, i) => (
                            <Box
                                key={i}
                                sx={{
                                    display: 'flex',
                                    gap: 3,
                                    p: 4,
                                    borderRadius: 6,
                                    border: '1px solid #f0f0f0',
                                    bgcolor: '#ffffff',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 12px 30px rgba(0,0,0,0.06)',
                                        borderColor: '#013D1D'
                                    }
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 64,
                                        height: 64,
                                        minWidth: 64,
                                        borderRadius: '18px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: feature.color,
                                        color: '#013D1D'
                                    }}
                                >
                                    {feature.icon}
                                </Box>
                                <Box>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            fontWeight: 700,
                                            fontFamily: 'var(--font-heading, Montserrat)',
                                            color: '#013D1D',
                                            mb: 1
                                        }}
                                    >
                                        {feature.title}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: '#555',
                                            lineHeight: 1.6,
                                            fontSize: '1rem'
                                        }}
                                    >
                                        {feature.desc}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* MEADOW CREDITS SECTION (NOW BELOW FREE TOOLS) */}
                <Box sx={{ mb: 16 }}>
                    <Typography
                        variant="h2"
                        sx={{
                            textAlign: 'center',
                            fontWeight: 800,
                            fontFamily: 'var(--font-heading, Montserrat)',
                            color: '#013D1D',
                            mb: 2
                        }}
                    >
                        Meadow Credits
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            textAlign: 'center',
                            color: '#666',
                            maxWidth: '750px',
                            mx: 'auto',
                            mb: 8,
                            fontSize: '1.25rem',
                            lineHeight: 1.6
                        }}
                    >
                        Want to unlock advanced AI-powered generations? Buy credits once, use them whenever you need. No subscriptions, no monthly pressure.

                    </Typography>

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: '1fr',
                                sm: '1fr 1fr',
                                lg: 'repeat(4, 1fr)'
                            },
                            gap: { xs: 3, md: 4 },
                            alignItems: 'stretch'
                        }}
                    >
                        {packages.map((pkg) => {
                            const brandColor = getPackageColor(pkg.id);
                            const isHealer = pkg.popular;

                            return (
                                <Card
                                    key={pkg.id}
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        position: 'relative',
                                        borderRadius: 4,
                                        overflow: 'visible',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        border: isHealer ? `3px solid ${brandColor}` : '1px solid #eee',
                                        boxShadow: isHealer
                                            ? '0 20px 40px rgba(255, 191, 0, 0.2)'
                                            : '0 4px 20px rgba(0, 0, 0, 0.05)',
                                        '&:hover': {
                                            transform: 'translateY(-8px)',
                                            boxShadow: isHealer
                                                ? '0 30px 60px rgba(255, 191, 0, 0.3)'
                                                : '0 12px 30px rgba(0, 0, 0, 0.1)',
                                        },
                                        ...(isHealer && {
                                            '&::before': {
                                                content: '"MOST POPULAR"',
                                                position: 'absolute',
                                                top: -16,
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                bgcolor: brandColor,
                                                color: '#013D1D',
                                                px: 3,
                                                py: 0.75,
                                                borderRadius: '50px',
                                                fontSize: '0.75rem',
                                                fontWeight: 800,
                                                zIndex: 10,
                                                letterSpacing: '0.05em',
                                                boxShadow: '0 4px 10px rgba(255, 191, 0, 0.4)'
                                            }
                                        })
                                    }}
                                >
                                    <CardContent sx={{ p: { xs: 3, lg: 4 }, display: 'flex', flexDirection: 'column', height: '100%' }}>
                                        {/* Icon */}
                                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                                            <Box
                                                sx={{
                                                    width: 64,
                                                    height: 64,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderRadius: '24px',
                                                    background: isHealer
                                                        ? `linear-gradient(135deg, ${brandColor} 0%, #FFD700 100%)`
                                                        : `linear-gradient(135deg, #013D1D 0%, #047857 100%)`,
                                                    color: isHealer ? '#013D1D' : '#FFFFFF',
                                                    boxShadow: isHealer
                                                        ? 'inset 0 0 10px rgba(255, 160, 0, 0.6), 0 10px 20px rgba(255, 191, 0, 0.3)'
                                                        : '0 10px 20px rgba(1, 61, 29, 0.15)'
                                                }}
                                            >
                                                {getPackageIcon(pkg.id)}
                                            </Box>
                                        </Box>

                                        <Typography
                                            variant="h5"
                                            sx={{
                                                fontWeight: 700,
                                                textAlign: 'center',
                                                fontFamily: 'var(--font-heading, Montserrat)',
                                                color: '#013D1D',
                                                mb: 1
                                            }}
                                        >
                                            {pkg.name}
                                        </Typography>

                                        <Box sx={{ textAlign: 'center', mb: 2 }}>
                                            <Typography
                                                variant="h2"
                                                sx={{
                                                    fontWeight: 800,
                                                    fontFamily: 'var(--font-heading, Montserrat)',
                                                    color: isHealer ? '#013D1D' : brandColor,
                                                    lineHeight: 1
                                                }}
                                            >
                                                {pkg.credits}
                                            </Typography>
                                            <Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: 2, color: '#666' }}>
                                                Credits
                                            </Typography>
                                        </Box>

                                        <Box sx={{ textAlign: 'center', mb: 4 }}>
                                            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a1a' }}>
                                                ${pkg.price}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#666', fontWeight: 600 }}>
                                                ${(pkg.price / pkg.credits).toFixed(2)} per credit
                                            </Typography>
                                        </Box>

                                        <Divider sx={{ mb: 4, borderColor: '#eee' }} />

                                        <List sx={{ mb: 4, flexGrow: 1 }}>
                                            {[
                                                "Credits never expire",
                                                "Use for any AI feature",
                                                `${Math.floor(pkg.credits / 2)} recipe generations`,
                                                `${Math.floor(pkg.credits / 5)} meal plans`,
                                                ...(pkg.credits >= 25 ? [`${Math.floor(pkg.credits / 2)} recipe photos`] : [])
                                            ].map((feature, idx) => (
                                                <ListItem key={idx} disableGutters sx={{ py: 1 }}>
                                                    <ListItemIcon sx={{ minWidth: 32, color: '#013D1D' }}>
                                                        <Check size={18} strokeWidth={3} />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={feature}
                                                        primaryTypographyProps={{ variant: 'body2', fontWeight: 500, color: '#333' }}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>

                                        <CTAButton
                                            href={`${APP_BASE_URL}/signup`}
                                            fullWidth
                                            variant={isHealer ? 'primary' : 'secondary'}
                                            size="large"
                                        >
                                            Choose {pkg.name}
                                        </CTAButton>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </Box>
                </Box>

                {/* Info Cards */}
                <Box sx={{ mt: 16, textAlign: 'center', maxWidth: '900px', mx: 'auto' }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'var(--font-heading, Montserrat)', color: '#013D1D', mb: 6 }}>
                        Simple Pricing. Powerful Results.
                    </Typography>

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 4, mb: 12 }}>
                        {[
                            { credits: '2 Credits', desc: 'Generate a recipe or modify an existing one.', icon: <Package size={20} /> },
                            { credits: '5 Credits', desc: 'Create a complete weekly meal plan with recipes.', icon: <Zap size={20} /> },
                            { credits: '1 Credit', desc: 'Add ingredients to your shopping list.', icon: <Sparkles size={20} /> }
                        ].map((item, i) => (
                            <Box key={i} sx={{ p: 3, borderRadius: 4, bgcolor: '#fff', border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                <Box sx={{ color: '#FFBF00', mb: 2, display: 'flex', justifyContent: 'center' }}>{item.icon}</Box>
                                <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: 'var(--font-heading, Montserrat)', color: '#013D1D', mb: 1 }}>{item.credits}</Typography>
                                <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.6 }}>{item.desc}</Typography>
                            </Box>
                        ))}
                    </Box>

                    {/* AI Recipe Card Showcase */}
                    <Box sx={{ mb: 16 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'var(--font-heading, Montserrat)', color: '#013D1D', mb: 1 }}>
                            Infinite Culinary Inspiration
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#666', mb: 6 }}>
                            Generate fully compliant recipes tailored to your stage and symptoms in seconds.
                        </Typography>
                        <Box sx={{
                            maxWidth: '394px',
                            mx: 'auto',
                            borderRadius: 8,
                            overflow: 'hidden',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
                            position: 'relative',
                            '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 30px 80px rgba(0,0,0,0.18)' },
                            transition: 'all 0.4s ease'
                        }}>
                            <CreditBadge credits={2} />
                            <Box component="img" src="https://storage.googleapis.com/meadow_mentor_public_media/images/credit_upgrade_recipe_example.webp" sx={{ width: '100%', height: 'auto', display: 'block' }} />
                        </Box>
                    </Box>

                    {/* Meal Plan Showcase */}
                    <Box sx={{ mb: 16 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'var(--font-heading, Montserrat)', color: '#013D1D', mb: 1 }}>
                            Your Whole Week, Sorted
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#666', mb: 6 }}>
                            Eliminate decision fatigue. Get a structured 7-day plan with one-click shopping lists.
                        </Typography>
                        <Box sx={{
                            maxWidth: '578px',
                            mx: 'auto',
                            borderRadius: 8,
                            overflow: 'hidden',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
                            position: 'relative',
                            '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 30px 80px rgba(0,0,0,0.18)' },
                            transition: 'all 0.4s ease'
                        }}>
                            <CreditBadge credits={5} />
                            <Box component="img" src="https://storage.googleapis.com/meadow_mentor_public_media/images/credit_upgrade_mealplan_example_v2.webp" sx={{ width: '100%', height: 'auto', display: 'block' }} />
                        </Box>
                    </Box>

                    {/* Photo Showcase */}
                    <Box sx={{ mb: 16, position: 'relative' }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: 'var(--font-heading, Montserrat)', color: '#013D1D', mb: 1 }}>
                            Bring Your Recipes to Life
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#666', mb: 6 }}>
                            Create stunning, high-definition art for every dish you discover.
                        </Typography>

                        <Box sx={{ position: 'relative', px: { md: 8 } }}>
                            <Box sx={{ display: { xs: 'none', md: 'flex' }, position: 'absolute', top: '50%', left: 0, right: 0, zIndex: 10, justifyContent: 'space-between', pointerEvents: 'none', transform: 'translateY(-50%)' }}>
                                <Button onClick={() => scrollContainerRef.current?.scrollBy({ left: -400, behavior: 'smooth' })} sx={{ minWidth: 48, height: 48, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.95)', color: '#013D1D', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', pointerEvents: 'auto', border: '1px solid #eee', '&:hover': { bgcolor: '#DCFCE7', transform: 'scale(1.1)' } }}>
                                    <ChevronLeft size={24} />
                                </Button>
                                <Button onClick={() => scrollContainerRef.current?.scrollBy({ left: 400, behavior: 'smooth' })} sx={{ minWidth: 48, height: 48, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.95)', color: '#013D1D', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', pointerEvents: 'auto', border: '1px solid #eee', '&:hover': { bgcolor: '#DCFCE7', transform: 'scale(1.1)' } }}>
                                    <ChevronRight size={24} />
                                </Button>
                            </Box>

                            <Box ref={scrollContainerRef} sx={{ display: 'flex', gap: 3, overflowX: 'auto', pb: 4, px: { xs: 2, md: 0 }, scrollBehavior: 'smooth', '&::-webkit-scrollbar': { height: '6px' }, '&::-webkit-scrollbar-thumb': { bgcolor: '#DCFCE7', borderRadius: '10px' }, scrollSnapType: 'x mandatory' }}>
                                {[
                                    'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/users/67be74b991d0bbf9af1973c9/recipes/693c47d84ae9c5e903d7dc80/scd-24-hour-fermented-yogurt-with-almond-butter-and-banana-693c47d84ae9c5e903d7dc80-v3-thumbnail.webp',
                                    'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/users/67be74b991d0bbf9af1973c9/recipes/693ba24c0b614151d039c3b7/gaps-savory-mediterranean-chicken-cauliflower-rice-bowl-693ba24c0b614151d039c3b7-v3-thumbnail.webp',
                                    'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/users/67be74b991d0bbf9af1973c9/recipes/69042634c838e78db6b58296/chewy-scd-honey-ginger-cookies-69042634c838e78db6b58296-v2-thumbnail.webp',
                                    'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/users/67be74b991d0bbf9af1973c9/recipes/6933c601e4bfb42e53c19d55/spiced-chicken-and-bell-pepper-skillet-6933c601e4bfb42e53c19d55-v3-thumbnail.webp',
                                    'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/users/67be74b991d0bbf9af1973c9/recipes/694cd5564ba0f78239637c40/aip-ground-beef-sweet-potato-carrot-skillet-v1-thumbnail.webp'
                                ].map((url, i) => (
                                    <Box key={i} sx={{ minWidth: { xs: '280px', md: '320px' }, height: { xs: '350px', md: '400px' }, borderRadius: 6, overflow: 'hidden', position: 'relative', boxShadow: '0 12px 24px rgba(0,0,0,0.1)', transition: 'all 0.4s ease', scrollSnapAlign: 'center', '&:hover': { transform: 'scale(1.03) rotate(0.5deg)', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' } }}>
                                        <CreditBadge credits={2} />
                                        <Box component="img" src={url} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </Box>

                    {/* Final Bottom Banner */}
                    <Box sx={{
                        bgcolor: '#FFBF00',
                        p: 6,
                        borderRadius: 6,
                        color: '#013D1D',
                        boxShadow: '0 20px 40px rgba(255, 191, 0, 0.2)',
                        textAlign: 'center'
                    }}>
                        <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'var(--font-heading, Montserrat)', mb: 2, color: '#013D1D' }}>
                            No Subscriptions. No Stress.
                        </Typography>
                        <Typography variant="h6" sx={{ maxWidth: '700px', mx: 'auto', mb: 4, fontWeight: 500, color: '#013D1D', opacity: 0.9 }}>
                            Credits never expire. Buy what you need, use it when you want. Perfect for navigating your gut health journey without monthly pressure.
                        </Typography>
                        <CTAButton href={`${APP_BASE_URL}/signup`} size="large">
                            Start Your Journey Free
                        </CTAButton>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
}
