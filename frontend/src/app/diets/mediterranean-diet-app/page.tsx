import React from 'react';
import { Box, Container, Typography, Grid, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Metadata } from 'next';
import CTAButton from '@/components/CTAButton';
import RecipeSummaryCard from '@/components/RecipeSummaryCard';
import { CheckCircle, RemoveCircle, Opacity, SettingsSuggest } from '@mui/icons-material';
import { getPublicRecipeBySlug } from '@/services/recipeService';

export const metadata: Metadata = {
    title: "Mediterranean Diet App & Meal Planner for IBD, IBS, Celiac",
    description: "Enjoy the Mediterranean Diet without the guesswork. Meadow Mentor generates 100% compliant Mediterranean meal plans, recipes, and shopping lists instantly. Try it free.",
    openGraph: {
        title: "Mediterranean Diet App & Meal Planner for IBD, IBS, Celiac",
        description: "Enjoy the Mediterranean Diet without the guesswork. Meadow Mentor generates 100% compliant Mediterranean meal plans, recipes, and shopping lists instantly. Try it free.",
        type: "website",
        url: "https://meadowmentor.com/diets/mediterranean-diet-app",
        images: [
            {
                url: "https://storage.googleapis.com/meadow_mentor_public_media/images/meadow_mentor_og_image_1200x630.webp",
                width: 1200,
                height: 630,
                alt: "Meadow Mentor Mediterranean Diet App - Tailored meal plans for gut health",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Mediterranean Diet App & Meal Planner for IBD, IBS, Celiac",
        description: "Enjoy the Mediterranean Diet without the guesswork. Meadow Mentor generates 100% compliant Mediterranean meal plans, recipes, and shopping lists instantly. Try it free.",
        images: ["https://storage.googleapis.com/meadow_mentor_public_media/images/meadow_mentor_og_image_1200x630.webp"],
    },
};

export default async function MediterraneanLandingPage() {
    const heroImage = 'https://storage.googleapis.com/meadow_mentor_public_media/images/meadow_mentor_product_hero_clean_v3.webp';

    const teaserRecipeSlug = 'mediterranean-baked-cod-potato-puree';
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
        _id: '6940f7a3058e8e4cb541e3d3',
        slug: teaserRecipeSlug,
        recipeTitle: 'Gentle Baked Cod with Olive Oil Sweet Potato Puree',
        recipeDescription: 'A soothing, easy-to-digest dinner featuring baked white fish rich in Omega-3s, paired with a smooth sweet potato puree, perfect for when your meadow needs gentle care during a flare.',
        recipeImage: {
            thumbnail: 'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/users/67be74b991d0bbf9af1973c9/recipes/6940f7a3058e8e4cb541e3d3/gentle-baked-cod-with-olive-oil-sweet-potato-puree-6940f7a3058e8e4cb541e3d3-v1-thumbnail.webp',
            display: 'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/users/67be74b991d0bbf9af1973c9/recipes/6940f7a3058e8e4cb541e3d3/gentle-baked-cod-with-olive-oil-sweet-potato-puree-6940f7a3058e8e4cb541e3d3-v1-display.webp',
            original: 'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/users/67be74b991d0bbf9af1973c9/recipes/6940f7a3058e8e4cb541e3d3/gentle-baked-cod-with-olive-oil-sweet-potato-puree-6940f7a3058e8e4cb541e3d3-v1-original.webp',
        },
        recipeDiet: 'Mediterranean',
        mealType: 'dinner',
        tags: ['flare-friendly', 'anti-inflammatory', 'fish'],
        totalTime: '40 minutes',
        averageRating: 5,
        ratings: [1],
    };

    const softwareApplicationSchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Meadow Mentor: Mediterranean Diet App",
        applicationCategory: "HealthApplication",
        operatingSystem: "Any",
        description:
            'AI personal chef for the Mediterranean Diet. A smart recipe generator and meal planner that adapts the Mediterranean Diet for your unique gut health needs.',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
        },
        "about": {
            "@type": "Diet",
            "name": "Mediterranean Diet",
            "alternateName": "Mediterranean",
            "description": "A diet rich in fruits, vegetables, whole grains, legumes, and healthy fats like olive oil, known for its anti-inflammatory properties.",
            //"mainEntityOfPage": "" // Link to the authority
        },
        "featureList": [
            "Mediterranean Diet Ingredient Label Scanner",
            "Mediterranean Diet Meal Planner",
            "AI Automated Recipe Generator",
            "Instant Shopping List Generator"
        ]
        // "aggregateRating": {
        //     "@type": "AggregateRating",
        //     "ratingValue": "4.9",
        //     "ratingCount": "18"
        // }
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
                            The Mediterranean Diet, Personalized for <em>Your</em> Gut.
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
                            The world’s healthiest diet isn&apos;t one-size-fits-all. Meadow Mentor automatically adapts Mediterranean recipes to fit your specific restrictions—whether you&apos;re managing a flare or avoiding specific allergens.
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'stretch', sm: 'flex-start' }, gap: 2 }}>
                            <CTAButton size="large" fullWidth={false}>
                                Generate My Mediterranean Plan
                            </CTAButton>
                            <Typography variant="caption" sx={{ color: '#666', fontStyle: 'italic' }}>
                                Includes Gluten-Free & Dairy-Free options.
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
                        What is the Mediterranean Diet?
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
                        <strong>The Mediterranean Diet</strong> is an eating pattern based on the traditional dietary habits of people living in the Mediterranean region. It emphasizes whole, plant-based foods (fruits, vegetables, legumes, whole grains), healthy fats like olive oil, and lean proteins like fish. It is widely recognized as the gold standard for reducing systemic inflammation and promoting heart and gut health.
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
                        What makes the Mediterranean Diet hard?
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
                        Standard Mediterranean advice often fails people with sensitive guts or autoimmune conditions. Finding truly unprocessed ingredients in a world of "healthy-washing" is difficult. More importantly, sticking to high-fiber "gold standard" foods like raw salads, nuts, and seeds can be dangerous during a digestive flare-up or for those with specific sensitivities.
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
                        Our AI personal chef adapts the Mediterranean Diet for your unique gut. Meadow Mentor automatically filters out your specific triggers—whether it&apos;s gluten, dairy, or nuts—and offers a one-click &quot;In Flare&quot; mode that instantly swaps difficult-to-digest roughage for soft, gut-soothing alternatives. We turn a general health guideline into a safe, personalized meal plan tailored to your body&apos;s current needs.
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
                        One-size-fits-all advice fails your gut.
                    </Typography>

                    <Typography variant="body1" sx={{ fontSize: '1.2rem', color: '#555', mb: 4, lineHeight: 1.8 }}>
                        You know the Mediterranean diet is the gold standard for reducing inflammation. But standard advice doesn&apos;t always respect your unique triggers:
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 6, pl: { xs: 0, md: 4 } }}>
                        {[
                            { title: "A Flare-up?", desc: "High-fiber raw salads become a liability." },
                            { title: "Food Sensitivities?", desc: "Nuts, seeds, or dairy can trigger symptoms." },
                            { title: "Multiple Restrictions?", desc: "Finding recipes that work for your profile is a full-time job." }
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
                            The Pivot: You don&apos;t need a static diet book. You need an AI Chef that listens to you.
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
                        Your Kitchen. Your Rules.
                    </Typography>

                    <Grid container spacing={4}>
                        {/* Feature 1 */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Box sx={{ p: 4, height: '100%', bgcolor: '#fff', borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                                <Box sx={{ color: '#013D1D', mb: 2 }}>
                                    <SettingsSuggest fontSize="large" />
                                </Box>
                                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#013D1D' }}>
                                    AI-Driven Personalization
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.7 }}>
                                    Our engine cross-references Mediterranean principles with your health profile. Tell us what you can&apos;t have, and we&apos;ll ensure you never see it.
                                </Typography>
                            </Box>
                        </Grid>

                        {/* Feature 2 */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Box sx={{ p: 4, height: '100%', bgcolor: '#fff', borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                                <Box sx={{ color: '#013D1D', mb: 2 }}>
                                    <Opacity fontSize="large" />
                                </Box>
                                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#013D1D' }}>
                                    "In Flare" Toggle
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.7 }}>
                                    When symptoms strike, one click adapts your plan to prioritize soft textures and low-residue ingredients, so you can keep nourishing safely.
                                </Typography>
                            </Box>
                        </Grid>

                        {/* Feature 3 */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Box sx={{ p: 4, height: '100%', bgcolor: '#fff', borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                                <Box sx={{ color: '#013D1D', mb: 2 }}>
                                    <CheckCircle fontSize="large" />
                                </Box>
                                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#013D1D' }}>
                                    Multi-Constraint Master
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.7 }}>
                                    Mediterranean + Dairy-Free + Gluten-Free? Our system handles the complex overlaps instantly, so you can stop scrolling and start cooking.
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
                                Safe, Flavorful, and Stress-Free.
                            </Typography>
                            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', mb: 2, lineHeight: 1.6 }}>
                                This recipe shows how our AI adapts for a &quot;Flare-Safe&quot; profile: we&apos;ve prioritized soft textures and Omega-3 rich fish to reduce inflammation without irritating the gut.
                            </Typography>
                            <Box sx={{ mb: 4 }}>
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>
                                    Tags: Mediterranean · Low Fiber · Omega-3
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
                                    How does the &quot;Personalization&quot; work?
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography color="text.secondary">
                                    It’s entirely based on your profile. If you have no restrictions, you get classic Mediterranean recipes. If you list allergies or toggle &quot;In Flare&quot;, our AI automatically swaps or adjusts ingredients to keep you safe.
                                </Typography>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion elevation={0} sx={{ borderBottom: '1px solid #eee' }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
                                    Can I customize it for my specific allergies?
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography color="text.secondary">
                                    Yes. Whether it&apos;s nuts, dairy, gluten, or specific vegetables, you list your restrictions in your profile and the app filters everything for you.
                                </Typography>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion elevation={0} sx={{ borderBottom: '1px solid #eee' }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
                                    Is this safe for Crohn&apos;s/Colitis?
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography color="text.secondary">
                                    Yes. By using the &quot;In Flare&quot; mode, the app prioritizing soft textures and peeled produce to reduce gut irritation, following principles similar to the Low-Fiber diet.
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
                        Your Gut. Your Plan. Your Mediterranean.
                    </Typography>
                    <CTAButton size="large">
                        Start Your Personalized Meal Plan
                    </CTAButton>
                </Container>
            </Box>
        </Box>
    );
}
