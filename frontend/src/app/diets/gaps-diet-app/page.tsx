import React from 'react';
import { Box, Container, Typography, Grid, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Metadata } from 'next';
import CTAButton from '@/components/CTAButton';
import RecipeSummaryCard from '@/components/RecipeSummaryCard';
import { CheckCircle, RemoveCircle, Restaurant, Explore } from '@mui/icons-material';
import { getPublicRecipeBySlug } from '@/services/recipeService';

export const metadata: Metadata = {
    title: "GAPS Diet App & Meal Planner for IBD, IBS, Celiac Disease",
    description: "Navigate the 6 stages of the GAPS Intro Diet without the confusion. Generate compliant meal plans, track your stage, and master meat stock. Try it free.",
    openGraph: {
        title: "GAPS Diet App & Meal Planner for IBD, IBS, Celiac Disease",
        description: "Navigate the 6 stages of the GAPS Intro Diet without the confusion. Generate compliant meal plans, track your stage, and master meat stock. Try it free.",
        type: "website",
        url: "https://meadowmentor.com/diets/gaps-diet-app",
        images: [
            {
                url: "https://storage.googleapis.com/meadow_mentor_public_media/images/meadow_mentor_og_image_1200x630.webp",
                width: 1200,
                height: 630,
                alt: "Meadow Mentor GAPS Diet App - Navigate the 6 stages of GAPS Intro Diet",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "GAPS Diet App & Meal Planner for IBD, IBS, Celiac Disease",
        description: "Navigate the 6 stages of the GAPS Intro Diet without the confusion. Generate compliant meal plans, track your stage, and master meat stock. Try it free.",
        images: ["https://storage.googleapis.com/meadow_mentor_public_media/images/meadow_mentor_og_image_1200x630.webp"],
    },
};

export default async function GAPSLandingPage() {
    const heroImage = 'https://storage.googleapis.com/meadow_mentor_public_media/images/meadow_mentor_product_hero_clean_v3.webp';

    const teaserRecipeSlug = 'gaps-yolk-drop-bone-broth';
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
        _id: '693b502f07cb93c525bb300d',
        slug: teaserRecipeSlug,
        recipeTitle: 'Gentle Yolk Drop Bone Broth',
        recipeDescription: 'A soothing and nourishing soup made with warm bone broth and easily digestible egg yolks, perfect for gut healing.',
        recipeImage: {
            thumbnail: 'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/users/67be74b991d0bbf9af1973c9/recipes/68f5bbd13cd7f746a1d81cfd/gentle-yolk-drop-bone-broth-68f5bbd13cd7f746a1d81cfd-v2-thumbnail.webp',
            display: 'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/users/67be74b991d0bbf9af1973c9/recipes/68f5bbd13cd7f746a1d81cfd/gentle-yolk-drop-bone-broth-68f5bbd13cd7f746a1d81cfd-v2-display.webp',
            original: 'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/users/67be74b991d0bbf9af1973c9/recipes/68f5bbd13cd7f746a1d81cfd/gentle-yolk-drop-bone-broth-68f5bbd13cd7f746a1d81cfd-v2-original.webp',
        },
        recipeDiet: 'GAPS',
        mealType: 'breakfast',
        tags: ['broth', 'gentle', 'easy', 'egg', 'soothing'],
        totalTime: '15 minutes',
        averageRating: 5,
        ratings: [1],
    };

    const softwareApplicationSchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Meadow Mentor: GAPS Diet App",
        applicationCategory: "HealthApplication",
        operatingSystem: "Any",
        description:
            "The AI personal chef for the GAPS Diet. Automatically generates safe, legal recipes, meal plans, and shopping lists for optimal gut healing.",
        
        "offers": {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
        },
        "about": {
            "@type": "Diet",
            "name": "Gut and Psychology Syndrome Diet",
            "alternateName": "GAPS",
            "description": "A grain-free, sugar-free, starch-free diet designed to heal the gut and support brain function, developed by Dr. Natasha Campbell-McBride.",
            "mainEntityOfPage": "https://www.doctor-natasha.com/" // Link to the authority
        },
        "featureList": [
            "GAPS Legal/Illegal Ingredient Label Scanner",
            "GAPS Meal Planner",
            "AI Automated Recipe Generator",
            "Instant Shopping List Generator"
        ],
        // "aggregateRating": {
        //     "@type": "AggregateRating",
        //     ratingValue: "4.7",
        //     "ratingCount": "12"
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
                            Master the GAPS Diet. From Stage 1 to &quot;Full.&quot;
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
                            The GAPS Intro Diet is famous for healing, but infamous for being confusing. Meadow Mentor turns the complex 6-stage protocol into simple, delicious daily meal plans.
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'stretch', sm: 'flex-start' }, gap: 2 }}>
                            <CTAButton size="large" fullWidth={false}>
                                Start My GAPS Journey
                            </CTAButton>
                            <Typography variant="caption" sx={{ color: '#666', fontStyle: 'italic' }}>
                                Includes Stage 1-6 Tracker & Full GAPS Mode.
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
                        What is the GAPS Diet?
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
                        <strong>The GAPS (Gut and Psychology Syndrome) Diet</strong> is a comprehensive nutritional protocol designed to heal the gut lining, restore microbiome balance, and reduce systemic inflammation. It builds upon the Specific Carbohydrate Diet (SCD) but adds a rigorous six-stage introductory phase focused on meat stock, fermented foods, and nutrient-dense fats to bridge the gap between gut health and overall neurological and physical well-being.
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
                        What makes the GAPS Diet hard?
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
                        The GAPS protocol is notoriously logistically complex. The six-stage Intro Diet is extremely rigid; knowing exactly when to transition from boiled meats and stock (Stage 1) to adding egg yolks (Stage 2) or avocado and nut-flour pancakes (Stage 3) is a full-time management task. Sticking to the rules while managing "die-off" symptoms or cooking for a family makes the protocol mentally and physically exhausting.
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
                        Meadow Mentor acts as your personal GPS through the GAPS stages. You simply toggle your current stage (1 through 6 or Full GAPS), and our AI engine instantly filters out any illegal ingredients for that specific level. We provide stage-compliant recipes and automated shopping lists so you can focus on the healing power of bone broth and ferments without the constant anxiety of &quot;Am I allowed to eat this yet?&quot;
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
                        &quot;Am I allowed to eat this yet?&quot;
                    </Typography>

                    <Typography variant="body1" sx={{ fontSize: '1.2rem', color: '#555', mb: 4, lineHeight: 1.8 }}>
                        You’re staring at a pot of bone broth, wondering if you can add a raw egg yolk or if that’s only for next week. GAPS is powerful, but the logistics are exhausting:
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 6, pl: { xs: 0, md: 4 } }}>
                        {[
                            { title: "The Stage Confusion:", desc: '"Is avocado Stage 3 or Stage 4?"' },
                            { title: "The Broth Fatigue:", desc: "Drinking plain stock 5 times a day gets old fast." },
                            { title: 'The "Die-Off":', desc: "Trying to cook complex meals while feeling detox symptoms." }
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
                            The Pivot: You need a guide that knows exactly which stage you are in.
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
                        A GPS for Your Gut Healing.
                    </Typography>

                    <Grid container spacing={4}>
                        {/* Feature 1 */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Box sx={{ p: 4, height: '100%', bgcolor: '#fff', borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                                <Box sx={{ color: '#013D1D', mb: 2 }}>
                                    <Explore fontSize="large" />
                                </Box>
                                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#013D1D' }}>
                                    The Stage Tracker
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.7 }}>
                                    Select your current level (Stage 1 through Full GAPS). The app instantly hides any ingredient that isn&apos;t ready for your gut yet. No more accidental cheat days.
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
                                    Broth, But Better
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.7 }}>
                                    We provide creative, healing ways to get your daily meat stock in—like our &quot;Yolk Drop Soup&quot; or &quot;Garlic Infused Broth&quot;—so you don&apos;t burn out.
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
                                    The &quot;Full GAPS&quot; Transition
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.7 }}>
                                    Once you&apos;re ready, switch to <strong>&quot;Full GAPS&quot;</strong> mode to unlock grain-free baking, fermented veggies, and creative family meals.
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
                                Simple, Healing, and Nutrient-Dense.
                            </Typography>
                            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', mb: 2, lineHeight: 1.6 }}>
                                Transform plain meat stock into a creamy, nutrient-dense meal. We whisk in raw egg yolks (Stage 2 legal) to provide essential fats for gut lining repair without hard-to-digest fibers.
                            </Typography>
                            <Box sx={{ mb: 4 }}>
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>
                                    Tags: Stage 2 Safe · Gut Healing · Intro Diet
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
                                    Does this follow Dr. Natasha’s protocol?
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography color="text.secondary">
                                    Yes. We adhere strictly to the GAPS nutritional protocol, removing disaccharides and starches to starve pathogenic bacteria.
                                </Typography>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion elevation={0} sx={{ borderBottom: '1px solid #eee' }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
                                    I have histamine issues. Can I use this?
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography color="text.secondary">
                                    Yes. GAPS relies heavily on ferments/broth which can trigger histamine. Meadow Mentor allows you to flag <strong>&quot;Histamine Sensitivity&quot;</strong> to suggest fresher meats and shorter-cook stocks.
                                </Typography>
                            </AccordionDetails>
                        </Accordion>

                        <Accordion elevation={0} sx={{ borderBottom: '1px solid #eee' }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
                                    Is this just for IBD?
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography color="text.secondary">
                                    No. While GAPS is famous for gut conditions, our app supports users utilizing it for <strong>autism, ADHD, and autoimmune conditions</strong> who need to heal their gut-brain axis.
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
                        Heal Your Gut without Losing Your Mind.
                    </Typography>
                    <CTAButton size="large">
                        Generate My Stage 1 Plan
                    </CTAButton>
                </Container>
            </Box>
        </Box>
    );
}
