import React from 'react';
import { getPublicRecipeBySlug } from '@/services/recipeService';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import {
    Box,
    Typography,
    Chip,
    Container,
    Rating,
    Paper,
    List,
    ListItem,
    ListItemText,
    Divider,
    Button,
    Alert
} from '@mui/material';
import {
    AccessTime as AccessTimeIcon,
    Restaurant as RestaurantIcon,
    ArrowBack as ArrowBackIcon,
    FavoriteBorder as FavoriteBorderIcon
} from '@mui/icons-material';
import Link from 'next/link';
import RecipeInteractions from '@/components/RecipeInteractions';

const defaultRecipeImage = 'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/Kay_Delivers_Recipe_Header_v2.jpeg';

export const revalidate = 60; // ISR revalidation 

// Metadata generation for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    try {
        const resolvedParams = await params;
        const response = await getPublicRecipeBySlug(resolvedParams.slug);
        const recipe = response?.data;

        if (!recipe) {
            return {
                title: 'Recipe Not Found',
                description: 'The requested recipe could not be found.'
            };
        }

        const recipeUrl = `https://meadowmentor.com/recipes/${resolvedParams.slug}`;
        const imageUrl = recipe.recipeImage?.display || defaultRecipeImage;
        const description = recipe.recipeDescription?.substring(0, 160) || `Check out this gut-friendly recipe for ${recipe.recipeTitle}.`;

        return {
            title: `${recipe.recipeTitle} | ${recipe.recipeDiet} & Gut Health Recipes`,
            description: description,
            alternates: {
                canonical: recipeUrl,
            },
            openGraph: {
                type: 'article',
                url: recipeUrl,
                title: recipe.recipeTitle,
                description: recipe.recipeDescription || description,
                images: [{
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: recipe.recipeTitle,
                }],
            },
            twitter: {
                card: 'summary_large_image',
                title: recipe.recipeTitle,
                description: recipe.recipeDescription || description,
                images: [imageUrl],
            },
        };
    } catch (error) {
        return {
            title: 'Recipe',
        };
    }
}

// Helper to convert "15 mins" -> "PT15M"
function convertDurationToISO(timeString?: string): string | undefined {
    if (!timeString) return undefined;
    // Simple heuristic: just extracting numbers. 
    // In a real app, you might want a more robust parser or store as minutes in DB.
    const match = timeString.match(/(\d+)/);
    if (match) {
        return `PT${match[1]}M`;
    }
    return undefined;
}

import ChefChat from '@/components/ChefChat';
import ChefTipBridge from '@/components/ChefTipBridge';

export default async function PublicRecipeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    let recipeData;

    try {
        const resolvedParams = await params;
        const response = await getPublicRecipeBySlug(resolvedParams.slug);

        if (!response || !response.success || !response.data) {
            notFound();
        }
        recipeData = response.data;
    } catch (error) {
        console.error("Failed to load recipe", error);
        // Error state UI
        return (
            <Container maxWidth="md" sx={{ mt: 8, textAlign: 'center' }}>
                <Alert severity="error" sx={{ mb: 4 }}>Failed to load recipe.</Alert>
                <Link href="/recipes" style={{ textDecoration: 'none' }}>
                    <Button variant="outlined" startIcon={<ArrowBackIcon />}>
                        Back to Recipes
                    </Button>
                </Link>
            </Container>
        );
    }

    const recipe = recipeData;
    const imageUrl = recipe.recipeImage?.display || recipe.recipeImage?.thumbnail || defaultRecipeImage;
    const allTags = [recipe.recipeDiet, recipe.mealType, ...(recipe.tags || [])].filter(Boolean);
    const uniqueTags = [...new Set(allTags)];

    // JSON-LD Schema
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Recipe',
        name: recipe.recipeTitle,
        image: [imageUrl],
        author: {
            '@type': 'Organization',
            name: 'Meadow Mentor'
        },
        description: recipe.recipeDescription,
        keywords: uniqueTags.join(', '),
        recipeYield: recipe.recipeYield,
        recipeCategory: recipe.mealType,
        recipeCuisine: 'Therapeutic', // Could be dynamic if you have region data
        prepTime: convertDurationToISO(recipe.prepTime),
        cookTime: convertDurationToISO(recipe.cookTime),
        totalTime: convertDurationToISO(recipe.totalTime),
        recipeIngredient: recipe.ingredients?.map((ing: any) => `${ing.amount} ${ing.unit || ''} ${ing.name} ${ing.notes ? `(${ing.notes})` : ''}`),
        recipeInstructions: recipe.steps?.map((step: string) => ({
            '@type': 'HowToStep',
            text: step
        }))
    };

    return (
        <main>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa', pb: 8 }}>
                {/* Hero Section */}
                <Box
                    sx={{
                        position: 'relative',
                        height: { xs: '250px', md: '400px' },
                        overflow: 'hidden',
                    }}
                >
                    <Box
                        component="img"
                        src={imageUrl}
                        alt={recipe.recipeTitle}
                        sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                    />
                    <Box
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                        }}
                    />
                    <Container
                        maxWidth="lg"
                        sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            pb: 4,
                            px: { xs: 2, md: 4 },
                        }}
                    >
                        <Link href="/recipes" style={{ textDecoration: 'none' }}>
                            <Button
                                startIcon={<ArrowBackIcon />}
                                sx={{
                                    color: 'white',
                                    mb: 2,
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                                }}
                            >
                                Back to Recipes
                            </Button>
                        </Link>
                    </Container>
                </Box>

                <Container maxWidth="lg" sx={{ mt: 4 }}>
                    <Typography
                        variant="h1" // Changed to h1 for SEO
                        sx={{
                            color: '#013D1D',
                            fontWeight: 700,
                            fontSize: { xs: '1.75rem', md: '2.5rem' },
                            fontFamily: 'var(--font-heading, Montserrat)',
                            mb: 2,
                        }}
                    >
                        {recipe.recipeTitle}
                    </Typography>

                    {/* Recipe Meta */}
                    <Paper elevation={0} sx={{ p: 3, mb: 4, bgcolor: '#FFF7E6', borderRadius: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Rating value={recipe.averageRating || 0} precision={0.5} readOnly />
                                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                    ({recipe.ratings?.length || 0} cooks loved this)
                                </Typography>
                            </Box>
                            {recipe.totalTime && (
                                <Chip
                                    icon={<AccessTimeIcon />}
                                    label={recipe.totalTime}
                                    sx={{ bgcolor: '#E0E0E0' }}
                                />
                            )}
                            {recipe.recipeYield && (
                                <Chip
                                    icon={<RestaurantIcon />}
                                    label={recipe.recipeYield}
                                    sx={{ bgcolor: '#E0E0E0' }}
                                />
                            )}
                        </Box>

                        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                            {recipe.recipeDescription}
                        </Typography>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {uniqueTags.map((tag) => (
                                <Chip key={tag} label={tag} size="small" sx={{ bgcolor: '#E0E0E0' }} />
                            ))}
                        </Box>
                    </Paper>

                    {/* Time Details */}
                    {(recipe.prepTime || recipe.cookTime) && (
                        <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
                            <Typography variant="h2" sx={{ fontSize: '1.25rem', fontWeight: 'bold', mb: 2 }}>
                                Time
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {recipe.prepTime && (
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">Prep Time</Typography>
                                        <Typography variant="body1" fontWeight="bold">{recipe.prepTime}</Typography>
                                    </Box>
                                )}
                                {recipe.cookTime && (
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">Cook Time</Typography>
                                        <Typography variant="body1" fontWeight="bold">{recipe.cookTime}</Typography>
                                    </Box>
                                )}
                                {recipe.totalTime && (
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">Total Time</Typography>
                                        <Typography variant="body1" fontWeight="bold">{recipe.totalTime}</Typography>
                                    </Box>
                                )}
                            </Box>
                        </Paper>
                    )}

                    {/* Content Grid */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 4 }}>
                        {/* Ingredients */}
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: 'fit-content' }}>
                            <Typography variant="h2" sx={{ fontSize: '1.25rem', fontWeight: 'bold', mb: 2 }}>
                                Ingredients
                            </Typography>
                            {recipe.ingredients && recipe.ingredients.length > 0 ? (
                                <List dense disablePadding>
                                    {recipe.ingredients.map((ingredient: any, index: number) => (
                                        <ListItem key={index} disablePadding sx={{ py: 0.75 }}>
                                            <ListItemText
                                                primary={
                                                    <Typography variant="body1">
                                                        <Box component="span" sx={{ fontWeight: 500 }}>
                                                            {ingredient.amount} {ingredient.unit}
                                                        </Box>{' '}
                                                        {ingredient.name}
                                                        {ingredient.notes && (
                                                            <Box component="span" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                                                {' '}({ingredient.notes})
                                                            </Box>
                                                        )}
                                                    </Typography>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Typography color="text.secondary">No ingredients listed.</Typography>
                            )}
                        </Paper>

                        {/* Instructions & Chef Tip */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <ChefTipBridge
                                recipeSlug={recipe.slug}
                                recipeTitle={recipe.recipeTitle}
                                recipeId={recipe._id}
                            />

                            {/* Instructions */}
                            <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
                                <Typography variant="h2" sx={{ fontSize: '1.25rem', fontWeight: 'bold', mb: 2 }}>
                                    Instructions
                                </Typography>
                                {recipe.steps && recipe.steps.length > 0 ? (
                                    <List disablePadding>
                                        {recipe.steps.map((step: string, index: number) => (
                                            <React.Fragment key={index}>
                                                <ListItem alignItems="flex-start" disablePadding sx={{ py: 1.5 }}>
                                                    <Box
                                                        sx={{
                                                            minWidth: 32,
                                                            height: 32,
                                                            borderRadius: '50%',
                                                            bgcolor: '#013D1D',
                                                            color: 'white',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontWeight: 'bold',
                                                            mr: 2,
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        {index + 1}
                                                    </Box>
                                                    <ListItemText
                                                        primary={
                                                            <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                                                                {step}
                                                            </Typography>
                                                        }
                                                    />
                                                </ListItem>
                                                {index < recipe.steps!.length - 1 && <Divider sx={{ my: 1 }} />}
                                            </React.Fragment>
                                        ))}
                                    </List>
                                ) : (
                                    <Typography color="text.secondary">No instructions available.</Typography>
                                )}
                            </Paper>
                        </Box>
                    </Box>

                    {/* Save CTA */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 4,
                            mt: 4,
                            borderRadius: 3,
                            textAlign: 'center',
                            bgcolor: '#dcfce7',
                        }}
                    >
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: '#013D1D' }}>
                            Want to save this recipe?
                        </Typography>
                        <Typography color="text.secondary" sx={{ mb: 2 }}>
                            Create a free account to save recipes, adapt them to your needs, and get personalized gut-healing recommendations.
                        </Typography>
                        {/* Client Component for Interactions */}
                        <RecipeInteractions
                            recipe={recipe}
                            label="Save Recipe"
                            initialMessage="I want to save this recipe."
                            startIcon={<FavoriteBorderIcon />}
                            action="signup"
                            recipeImage={imageUrl}
                        />
                    </Paper>
                </Container>
            </Box>

            {/* Chat Overlay */}
            <ChefChat
                recipeSlug={recipe.slug}
                recipeTitle={recipe.recipeTitle}
                recipeId={recipe._id}
            />
        </main>
    );
}
