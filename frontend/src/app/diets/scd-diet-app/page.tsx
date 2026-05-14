import React from 'react';
import { Box, Container, Typography, Grid, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Metadata } from 'next';
import CTAButton from '@/components/CTAButton';
import RecipeSummaryCard from '@/components/RecipeSummaryCard';
import { CheckCircle, RemoveCircle, Restaurant, Opacity } from '@mui/icons-material';
import { getPublicRecipeBySlug } from '@/services/recipeService';

export const metadata: Metadata = {
  title: 'SCD Diet App & Meal Planner for IBD, IBS, Celiac Disease',
  description: 'Stop checking the "Legal/Illegal" list. Meadow Mentor generates 100% compliant SCD meal plans, recipes, and shopping lists instantly. Try it free.',
  openGraph: {
    title: 'SCD Diet App & Meal Planner for IBD, IBS, Celiac Disease',
    description: 'Stop checking the "Legal/Illegal" list. Meadow Mentor generates 100% compliant SCD meal plans, recipes, and shopping lists instantly. Try it free.',
    type: 'website',
    url: 'https://meadowmentor.com/diets/scd-diet-app',
    images: [
      {
        url: 'https://storage.googleapis.com/meadow_mentor_public_media/images/meadow_mentor_og_image_1200x630.webp',
        width: 1200,
        height: 630,
        alt: 'Meadow Mentor SCD Diet App - Generate compliant meal plans instantly',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SCD Diet App & Meal Planner for IBD, IBS, Celiac Disease',
    description: 'Stop checking the "Legal/Illegal" list. Meadow Mentor generates 100% compliant SCD meal plans, recipes, and shopping lists instantly. Try it free.',
    images: ['https://storage.googleapis.com/meadow_mentor_public_media/images/meadow_mentor_og_image_1200x630.webp'],
  },
};

export default async function SCDLandingPage() {
  const heroImage = 'https://storage.googleapis.com/meadow_mentor_public_media/images/meadow_mentor_product_hero_clean_v3.webp';

  const teaserRecipeSlug = 'scd-24-hour-yogurt-butter-banana';
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
    _id: '693c47d84ae9c5e903d7dc80',
    slug: teaserRecipeSlug,
    recipeTitle: 'SCD 24-Hour Fermented Yogurt with Almond Butter and Banana',
    recipeDescription: 'A creamy, protein-rich homemade yogurt, fermented for 24 hours to be SCD-aligned and full of sweet creamy flavors.',
    recipeImage: {
      thumbnail: 'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/users/67be74b991d0bbf9af1973c9/recipes/693c47d84ae9c5e903d7dc80/scd-24-hour-fermented-yogurt-with-almond-butter-and-banana-693c47d84ae9c5e903d7dc80-v3-thumbnail.webp',
      display: 'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/users/67be74b991d0bbf9af1973c9/recipes/693c47d84ae9c5e903d7dc80/scd-24-hour-fermented-yogurt-with-almond-butter-and-banana-693c47d84ae9c5e903d7dc80-v3-display.webp',
      original: 'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/users/67be74b991d0bbf9af1973c9/recipes/693c47d84ae9c5e903d7dc80/scd-24-hour-fermented-yogurt-with-almond-butter-and-banana-693c47d84ae9c5e903d7dc80-v3-original.webp',
    },
    recipeDiet: 'SCD',
    mealType: 'snack',
    tags: ['yogurt', 'fermented', 'breakfast', 'snack', 'probiotic', 'gut healing', 'dairy', 'vanilla', 'cinnamon'],
    totalTime: '24 hours 15 minutes (plus chilling)',
    averageRating: 5,
    ratings: [1],
  };

  const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Meadow Mentor: SCD Diet App',
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Any',
    description:
      'The AI personal chef for the Specific Carbohydrate Diet (SCD). Scan ingredient labels for safety. An automated meal planner and recipe manager for the Specific Carbohydrate Diet (SCD). Generates safe, legal recipes, meal plans, and shopping lists for optimal gut health.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    "about": {
      "@type": "Diet",
      "name": "Specific Carbohydrate Diet",
      "alternateName": "SCD",
      "description": "A grain-free, sugar-free, starch-free diet used to manage Crohn's Disease and Ulcerative Colitis.",
      "mainEntityOfPage": "https://breakingtheviciouscycle.info/" // Link to the authority
    },
    "featureList": [
      "SCD Legal/Illegal Ingredient Label Scanner",
      "SCD Meal Planner",
      "AI Automated Recipe Generator",
      "Instant Shopping List Generator"
    ]
    // aggregateRating: {
    //   '@type': 'AggregateRating',
    //   ratingValue: '4.8',
    //   ratingCount: '24',
    // },
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
              The SCD Diet App That Cooks for You.
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
              Stop obsessing over the "Legal vs. Illegal" food list. Meadow Mentor generates personalized Specific Carbohydrate Diet meal plans that are 100% compliant and actually taste good.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'stretch', sm: 'flex-start' }, gap: 2 }}>
              <CTAButton size="large" fullWidth={false}>
                Generate My Free SCD Plan
              </CTAButton>
              <Typography variant="caption" sx={{ color: '#666', fontStyle: 'italic' }}>
                No credit card required. Works for Intro & Advanced stages.
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
            What is the Specific Carbohydrate Diet (SCD)?
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
            <strong>The Specific Carbohydrate Diet (SCD)</strong> is a biologically based diet that removes complex carbohydrates (grains, refined sugars, lactose) to starve harmful gut bacteria and reduce inflammation. It is primarily used to manage IBD (Crohn's and Colitis) and support long-term digestive health.
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
            What makes the SCD Diet hard?
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
            The Specific Carbohydrate Diet is notoriously strict. It eliminates all grains, lactose, and processed sugars to starve harmful gut bacteria. Keeping track of the "Illegal List"—like knowing that canned coconut milk often has illegal thickeners or that most store-bought broths contain hidden sugars—is mentally exhausting and time-consuming.
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
            Our AI personal chef scans ingredients against the official SCD legal list so you don't have to memorize it. Meadow Mentor automates the "breaking the vicious cycle" process by generating 100% compliant recipes, meal plans, and shopping lists tailored to your current healing stage, allowing you to focus on thriving rather than just reacting to symptoms.
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
            SCD is hard. Dinner shouldn't be.
          </Typography>

          <Typography variant="body1" sx={{ fontSize: '1.2rem', color: '#555', mb: 4, lineHeight: 1.8 }}>
            You’ve read <em>Breaking the Vicious Cycle</em>. You’ve purged your pantry. But you’re still stuck asking:
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 6, pl: { xs: 0, md: 4 } }}>
            {[
              "Is this store-bought sauce actually legal?",
              "What can I eat during a flare?",
              "How do I cook for my family without making two separate meals?"
            ].map((text, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <RemoveCircle sx={{ color: '#d32f2f' }} />
                <Typography variant="h6" sx={{ color: '#333', fontWeight: 500 }}>
                  "{text}"
                </Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ bgcolor: '#FFF7E6', p: 4, borderRadius: 4, borderLeft: '6px solid #FFBF00' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#013D1D' }}>
              The Pivot: You don't need another list of ingredients to memorize. You need a Chef.
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
            Your Pocket Concierge for Gut Health.
          </Typography>

          <Grid container spacing={4}>
            {/* Feature 1 */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ p: 4, height: '100%', bgcolor: '#fff', borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <Box sx={{ color: '#013D1D', mb: 2 }}>
                  <Restaurant fontSize="large" />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#013D1D' }}>
                  The "Illegal" Filter is Built-In
                </Typography>
                <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.7 }}>
                  We removed the grains, sugar, lactose, and starches so you don't have to. Every recipe in our SCD engine is pre-vetted for safety.
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
                  Flare-Friendly Mode
                </Typography>
                <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.7 }}>
                  Having a rough week? Toggle on "Flare" mode to instantly strip your meal plan of roughage, skins, and seeds while keeping the nutrition.
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
                  The Intro Diet & Beyond
                </Typography>
                <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.7 }}>
                  Whether you are on the strict Intro Diet (chicken soup, gelatin, peeled carrots) or reintroducing advanced foods, the app adapts to your stage.
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
                A TASTE OF WHAT'S POSSIBLE
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
                Eat Real Food. Feel Real Good.
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', mb: 4, lineHeight: 1.6 }}>
                The cornerstone of the diet doesn't have to be boring. Our recipes are both delicious and aligned to SCD principles, so you get the probiotics with flavor.
              </Typography>
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
                  Is this app compliant with Breaking the Vicious Cycle?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary">
                  Yes. We adhere strictly to the Specific Carbohydrate Diet principles—no grains, no sugars, no starches.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion elevation={0} sx={{ borderBottom: '1px solid #eee' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
                  Can I combine SCD with other restrictions?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary">
                  Absolutely. You can combine SCD with Nut-Free, Dairy-Free and individual ingredient filters to fit your unique gut.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion elevation={0} sx={{ borderBottom: '1px solid #eee' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
                  Do you have a shopping list?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary">
                  Yes. Your recipes automatically convert into a grocery list.
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
            Stop Guessing. Start Thriving.
          </Typography>
          <CTAButton size="large">
            Start Your Free SCD Plan
          </CTAButton>
        </Container>
      </Box>
    </Box>
  );
}
