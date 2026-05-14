import React from 'react';
import { Box, Container, Typography, Grid, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Metadata } from 'next';
import CTAButton from '@/components/CTAButton';
import RecipeSummaryCard from '@/components/RecipeSummaryCard';
import { CheckCircle, RemoveCircle, Shield, Restaurant, Repeat } from '@mui/icons-material';
import { getPublicRecipeBySlug } from '@/services/recipeService';

export const metadata: Metadata = {
    title: "AIP Diet App & Meal Planner for Autoimmune Conditions",
    description: "The Autoimmune Protocol (AIP) is strict, but dinner doesn't have to be boring. Get delicious Nightshade-Free, Nut-Free, and Egg-Free meal plans instantly.",
    openGraph: {
        title: "AIP Diet App & Meal Planner for Autoimmune Conditions",
        description: "The Autoimmune Protocol (AIP) is strict, but dinner doesn't have to be boring. Get delicious Nightshade-Free, Nut-Free, and Egg-Free meal plans instantly.",
        type: "website",
        url: "https://meadowmentor.com/diets/aip-diet-app",
        images: [
            {
                url: "https://storage.googleapis.com/meadow_mentor_public_media/images/meadow_mentor_og_image_1200x630.webp",
                width: 1200,
                height: 630,
                alt: "Meadow Mentor AIP Diet App - Nightshade-Free, Nut-Free, Egg-Free meal plans",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "AIP Diet App & Meal Planner for Autoimmune Conditions",
        description: "The Autoimmune Protocol (AIP) is strict, but dinner doesn't have to be boring. Get delicious Nightshade-Free, Nut-Free, and Egg-Free meal plans instantly.",
        images: ["https://storage.googleapis.com/meadow_mentor_public_media/images/meadow_mentor_og_image_1200x630.webp"],
    },
};

export default async function AIPLandingPage() {
    const heroImage = 'https://storage.googleapis.com/meadow_mentor_public_media/images/meadow_mentor_product_hero_clean_v3.webp';

    const teaserRecipeSlug = 'aip-ground-beef-sweet-potato-carrot-nomato-skillet';
    let teaserRecipe;

    try {
        const recipeResponse = await getPublicRecipeBySlug(teaserRecipeSlug);
        teaserRecipe = recipeResponse?.data;
    } catch {
        teaserRecipe = undefined;
    }
    const teaserRecipeHref = `/recipes/${encodeURIComponent(teaserRecipe?.slug || teaserRecipeSlug)}`;

    // Fallback if backend fetch fails for any reason
    const fallbackRecipe = {
        _id: '694cd5564ba0f78239637c40',
        slug: teaserRecipeSlug,
        recipeTitle: 'Ground Beef Sweet Potato and Carrot Nomato Skillet',
        recipeDescription: 'A comforting, savory, and anti-inflammatory one-pan skillet that replaces nightshade flavors with sweet potatoes, carrots, and earthy AIP-aligned spices.',
        recipeImage: {
            thumbnail: 'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/users/67be74b991d0bbf9af1973c9/recipes/694cd5564ba0f78239637c40/aip-ground-beef-sweet-potato-carrot-skillet-v1-thumbnail.webp',
            display: 'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/users/67be74b991d0bbf9af1973c9/recipes/694cd5564ba0f78239637c40/aip-ground-beef-sweet-potato-carrot-skillet-v1-display.webp',
            original: 'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/users/67be74b991d0bbf9af1973c9/recipes/694cd5564ba0f78239637c40/aip-ground-beef-sweet-potato-carrot-skillet-v1-original.webp',
        },
        recipeDiet: 'Paleo AIP',
        mealType: 'dinner',
        tags: ['Nightshade Free', 'Nut Free', 'Egg Free', 'Autoimmune Friendly'],
        totalTime: '45 minutes',
        averageRating: 5,
        ratings: [1],
    };

    const softwareApplicationSchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Meadow Mentor: AIP Diet App",
        applicationCategory: "HealthApplication",
        operatingSystem: "Any",
        description:
            "The AI personal chef for the Autoimmune Protocol (AIP). A comprehensive meal planner for the AIP. Features nightshade-free recipes, egg-free breakfasts, and reintroduction tracking.",
        offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
        },
        "about": {
            "@type": "Diet",
            "name": "Autoimmune Protocol",
            "alternateName": "AIP",
            "description": "An elimination diet designed to reduce inflammation and heal the gut lining by removing foods that may trigger autoimmune responses.",
            //"mainEntityOfPage": ""
        },
        "featureList": [
            "AIP Ingredient Label Scanner",
            "AIP Meal Planner",
            "AI Automated Recipe Generator",
            "Instant Shopping List Generator"
        ]
        // "aggregateRating": {
        //     "@type": "AggregateRating",
        //     "ratingValue": "4.8",
        //     "ratingCount": "15"
        //}
    };

    return (
        <Box sx={{ bgcolor: '#fafafa', minHeight: '100vh' }}>

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
            />

            {/* 2. Hero Section */}
            <Box
                sx={{
                    minHeight: '80vh',
                    width: '100%',
                    backgroundImage: `url(${heroImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    position: 'relative',
                }}
            >
                <Container maxWidth="lg">
                    <Box
                        sx={{
                            maxWidth: { xs: '100%', md: '600px' },
                            bgcolor: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(12px)',
                            borderRadius: 4,
                            p: { xs: 4, md: 6 },
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                        }}
                    >
                        <Typography
                            variant="h1"
                            sx={{
                                fontWeight: 800,
                                color: '#013D1D',
                                fontFamily: 'var(--font-heading, Montserrat)',
                                fontSize: { xs: '2.5rem', md: '3.5rem' },
                                lineHeight: 1.2,
                                mb: 2,
                            }}
                        >
                            The Autoimmune Protocol. Flavor without the Fire.
                        </Typography>

                        <Typography
                            variant="h5"
                            sx={{
                                color: '#444',
                                fontFamily: 'var(--font-body, "Source Sans 3")',
                                fontSize: { xs: '1.1rem', md: '1.25rem' },
                                lineHeight: 1.6,
                                mb: 4,
                            }}
                        >
                            AIP is one of the toughest elimination diets to follow. Meadow Mentor removes the stress of &quot;No&quot; (No Nightshades, No Nuts, No Eggs) and replaces it with the joy of &quot;Yes.&quot;
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'stretch', sm: 'flex-start' }, gap: 2 }}>
                            <CTAButton size="large" fullWidth={false}>
                                Generate My Free AIP Plan
                            </CTAButton>
                            <Typography variant="caption" sx={{ color: '#666', fontStyle: 'italic' }}>
                                Supports Elimination & Reintroduction Phases.
                            </Typography>
                        </Box>
                    </Box>
                </Container>
            </Box>

            {/* 3. AEO "Direct Answer" Block */}
            <Box
                component="section"
                sx={{
                    bgcolor: '#DCFCE7', // Soft Mint
                    py: { xs: 6, md: 8 },
                    borderBottom: '1px solid rgba(1, 61, 29, 0.1)'
                }}
            >
                <Container maxWidth="md">
                    <Typography
                        variant="h2"
                        sx={{
                            color: '#013D1D',
                            fontWeight: 700,
                            fontFamily: 'var(--font-heading, Montserrat)',
                            fontSize: { xs: '1.75rem', md: '2.25rem' },
                            mb: 2
                        }}
                    >
                        What is the Autoimmune Protocol (AIP)?
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            color: '#013D1D',
                            lineHeight: 1.8,
                            fontSize: '1.1rem',
                            mb: 4,
                            fontFamily: 'var(--font-body, "Source Sans 3")'
                        }}
                    >
                        <strong>The Autoimmune Protocol (AIP)</strong> is a strict elimination diet designed to identify food triggers that cause inflammation and immune activation in people with autoimmune conditions. It builds upon Paleo principles by removing potential gut irritants and common allergens—including grains, dairy, nightshades, eggs, nuts, and seeds—to support gut healing and immune regulation.
                    </Typography>

                    <Typography
                        variant="h3"
                        sx={{
                            color: '#013D1D',
                            fontWeight: 700,
                            fontFamily: 'var(--font-heading, Montserrat)',
                            fontSize: { xs: '1.25rem', md: '1.5rem' },
                            mb: 1.5
                        }}
                    >
                        What makes the AIP Diet hard?
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            color: '#444',
                            lineHeight: 1.8,
                            mb: 4,
                            fontFamily: 'var(--font-body, "Source Sans 3")'
                        }}
                    >
                        AIP is notoriously difficult because it eliminates nearly all common convenience foods and breakfast staples. Removing nightshades (tomatoes, peppers, potatoes, eggplant) and &quot;seed-based&quot; spices like cumin or paprika means you have to relearn how to flavor food entirely. Navigating hidden ingredients in restaurants or pre-packaged goods becomes a constant mental obstacle course that can lead to decision fatigue and accidental flares.
                    </Typography>

                    <Typography
                        variant="h3"
                        sx={{
                            color: '#013D1D',
                            fontWeight: 700,
                            fontFamily: 'var(--font-heading, Montserrat)',
                            fontSize: { xs: '1.25rem', md: '1.5rem' },
                            mb: 1.5
                        }}
                    >
                        How Meadow Mentor helps:
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            color: '#444',
                            lineHeight: 1.8,
                            fontFamily: 'var(--font-body, "Source Sans 3")'
                        }}
                    >
                        Our AI personal chef automates the &quot;No&quot; so you can find the &quot;Yes.&quot; Meadow Mentor instantly filters out all nightshades, nuts, seeds, and eggs across your entire meal plan, providing creative &quot;Nomato&quot; sauces and savory egg-free breakfasts. We handle the complex ingredient checking for you and support you through both the strict elimination and the reintroduction phases, so you can expand your diet safely and confidently.
                    </Typography>
                </Container>
            </Box>

            {/* 4. The Problem (Empathy) */}
            <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#fff' }}>
                <Container maxWidth="md">
                    <Typography
                        variant="h2"
                        align="center"
                        sx={{
                            fontWeight: 700,
                            color: '#013D1D',
                            fontFamily: 'var(--font-heading, Montserrat)',
                            mb: 6,
                        }}
                    >
                        &quot;So... what is left to eat?&quot;
                    </Typography>

                    <Typography variant="body1" sx={{ fontSize: '1.2rem', color: '#555', mb: 4, lineHeight: 1.8 }}>
                        You’ve been told to cut out everything you rely on: Coffee, Eggs, Tomatoes, Peppers, Nuts, and Seeds.
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 6, pl: { xs: 0, md: 4 } }}>
                        {[
                            { title: "The Flavor Gap:", desc: "How do you cook without pepper, paprika, or cumin?" },
                            { title: "The Breakfast Struggle:", desc: "What do you eat when eggs and oatmeal are off the table?" },
                            { title: "The Social Anxiety:", desc: 'Explaining "Nightshades" to a waiter is exhausting.' }
                        ].map((item, index) => (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <RemoveCircle sx={{ color: '#d32f2f' }} />
                                <Typography variant="h6" sx={{ color: '#333', fontWeight: 500 }}>
                                    <strong>{item.title}</strong> {item.desc}
                                </Typography>
                            </Box>
                        ))}
                    </Box>

                    <Box sx={{ bgcolor: '#FFF7E6', p: 4, borderRadius: 4, borderLeft: '6px solid #FFBF00' }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#013D1D' }}>
                            The Pivot: You need a plan that focuses on abundance, not deprivation.
                        </Typography>
                    </Box>
                </Container>
            </Box>

            {/* 5. The Solution (Features) */}
            <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#fafafa' }}>
                <Container maxWidth="lg">
                    <Typography
                        variant="h2"
                        align="center"
                        sx={{
                            fontWeight: 700,
                            color: '#013D1D',
                            fontFamily: 'var(--font-heading, Montserrat)',
                            mb: 8,
                        }}
                    >
                        Strict Rules. Creative Kitchen.
                    </Typography>

                    <Grid container spacing={4}>
                        {/* Feature 1 */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Box sx={{ p: 4, height: '100%', bgcolor: '#fff', borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                                <Box sx={{ color: '#013D1D', mb: 2 }}>
                                    <Shield fontSize="large" />
                                </Box>
                                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#013D1D' }}>
                                    The &quot;Nightshade&quot; Shield
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.7 }}>
                                    We automatically swap tomatoes for beets/carrots (&quot;Nomato&quot;) and peppers for ginger/turmeric. You get the color and zing without the inflammation.
                                </Typography>
                            </Box>
                        </Grid>

                        {/* Feature 2 */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Box sx={{ p: 4, height: '100%', bgcolor: '#fff', borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                                <Box sx={{ color: '#013D1D', mb: 2 }}>
                                    <Restaurant fontSize="large" />
                                </Box>
                                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#013D1D' }}>
                                    Egg-Free Breakfasts
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.7 }}>
                                    Wake up to nourishing hash skillets, AIP &quot;oatmeal&quot; (made from coconut/squash), and turkey patties. No eggs required.
                                </Typography>
                            </Box>
                        </Grid>

                        {/* Feature 3 */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Box sx={{ p: 4, height: '100%', bgcolor: '#fff', borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                                <Box sx={{ color: '#013D1D', mb: 2 }}>
                                    <Repeat fontSize="large" />
                                </Box>
                                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#013D1D' }}>
                                    Reintroduction Tracker
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.7 }}>
                                    AIP isn&apos;t forever. When you are ready to test Phase 1 or 2, the app adjusts your filter to help you safely expand your diet.
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* 6. A Taste of What's Possible (Recipe Teaser) */}
            <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#013D1D', color: '#fff' }}>
                <Container maxWidth="lg">
                    <Grid container spacing={6} alignItems="center">
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="overline" sx={{ letterSpacing: 2, color: '#4ade80', fontWeight: 700 }}>
                                A TASTE OF WHAT&apos;S POSSIBLE
                            </Typography>
                            <Typography
                                variant="h2"
                                sx={{
                                    fontWeight: 700,
                                    fontFamily: 'var(--font-heading, Montserrat)',
                                    mb: 3,
                                    mt: 1,
                                }}
                            >
                                Vibrant Flavors, Zero Nightshades.
                            </Typography>
                            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', mb: 2, lineHeight: 1.6 }}>
                                Miss pasta sauce? This savory skillet uses a clever blend of root vegetables and bone broth to create a rich, tomato-free sauce that satisfies the craving without the trigger.
                            </Typography>
                            <Box sx={{ mb: 4 }}>
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>
                                    Tags: Nightshade Free · Nut Free · Egg Free
                                </Typography>
                            </Box>
                            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                                <CTAButton variant="secondary" href={teaserRecipeHref}>
                                    View Recipe
                                </CTAButton>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box sx={{ maxWidth: 400, mx: 'auto' }}>
                                <RecipeSummaryCard recipe={(teaserRecipe || fallbackRecipe) as any} />
                            </Box>
                            <Box sx={{ display: { xs: 'block', md: 'none' }, mt: 4, textAlign: 'center' }}>
                                <CTAButton variant="secondary" href={teaserRecipeHref}>
                                    View Recipe
                                </CTAButton>
                            </Box>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* 7. FAQ (Long-Tail SEO) */}
            <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#fff' }}>
                <Container maxWidth="md">
                    <Typography
                        variant="h3"
                        align="center"
                        sx={{
                            fontWeight: 700,
                            color: '#013D1D',
                            fontFamily: 'var(--font-heading, Montserrat)',
                            mb: 6,
                        }}
                    >
                        Frequently Asked Questions
                    </Typography>

                    <Box>
                        <Accordion elevation={0} sx={{ borderBottom: '1px solid #eee' }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
                                    Is this strictly Paleo AIP?
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography color="text.secondary">
                                    Yes. Our &quot;AIP Mode&quot; is stricter than standard Paleo. It removes eggs, nuts, seeds (including seed-based spices like cumin/coriander), and nightshades.
                                </Typography>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion elevation={0} sx={{ borderBottom: '1px solid #eee' }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
                                    I have Hashimotos/RA/Lupus. Is this for me?
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography color="text.secondary">
                                    While we cannot give medical advice, our AIP plans are built on the principles used by thousands to manage autoimmune conditions by reducing systemic inflammation.
                                </Typography>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion elevation={0} sx={{ borderBottom: '1px solid #eee' }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
                                    Can I combine AIP with Low-FODMAP?
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography color="text.secondary">
                                    Yes. This is a very difficult combination to do alone, but Meadow Mentor can overlap these filters to find the specific vegetables (like carrots and spinach) that satisfy both protocols.
                                </Typography>
                            </AccordionDetails>
                        </Accordion>
                    </Box>
                </Container>
            </Box>

            {/* 8. Final CTA */}
            <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: '#fafafa', textAlign: 'center' }}>
                <Container maxWidth="md">
                    <Typography
                        variant="h2"
                        sx={{
                            fontWeight: 700,
                            color: '#013D1D',
                            fontFamily: 'var(--font-heading, Montserrat)',
                            fontSize: { xs: '2.25rem', md: '3.75rem' },
                            mb: 4,
                        }}
                    >
                        Calm Your System. Feed Your Body.
                    </Typography>
                    <CTAButton size="large">
                        Start Your Elimination Diet
                    </CTAButton>
                </Container>
            </Box>
        </Box>
    );
}
