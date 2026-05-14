/**
 * @file Defines the public meal plan detail page.
 * @description Renders a public plan page at `/plans/[slug]` sourced from the backend public meal plan API.
 *
 * Requirements:
 * - Uses ISR via `export const revalidate`.
 * - Only renders recipe links when the backend provides `recipeSlug` (meaning the recipe is public).
 *
 * @requires module:react - React runtime for JSX.
 * @requires module:next - Metadata typing.
 * @requires module:next/navigation - notFound helper.
 * @requires module:next/link - Next.js navigation.
 * @requires @mui/material - UI components.
 * @requires @/components/MealPlanDayViewCard - Visual plan rendering.
 * @requires @/services/mealPlanService - Public meal plan API helpers.
 * @requires @/lib/api - Base URLs for canonical + CTA links.
 * @author Cascade
 * @version 1.0.0
 * @date 2025-12-17
 */

// React/Next.js
import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// UI (MUI)
import { Box, Button, Container, Paper, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

// Internal Components
import MealPlanDayViewCard from '@/components/MealPlanDayViewCard';

// Services & API
import { getPublicMealPlanBySlug } from '@/services/mealPlanService';

// Constants
import { APP_BASE_URL } from '@/lib/api';

export const revalidate = 60; // ISR revalidation

const defaultMealImage =
  'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/Kay_Delivers_Recipe_Header_v2.jpeg';

function getPlanHeroImage(plan: any): string {
  for (const day of plan?.days || []) {
    for (const mealType of ['breakfast', 'lunch', 'dinner', 'snack']) {
      const slot = day?.meals?.[mealType];
      const img = slot?.recipeImage?.thumbnail || slot?.recipeImage?.display;
      if (img) return img;
    }
  }
  return defaultMealImage;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const response = await getPublicMealPlanBySlug(resolvedParams.slug);
    const plan = response?.data;

    if (!plan) {
      return {
        title: 'Meal Plan Not Found',
        description: 'The requested meal plan could not be found.',
      };
    }

    const planUrl = `https://meadowmentor.com/plans/${resolvedParams.slug}`;
    const imageUrl = getPlanHeroImage(plan);
    const description =
      plan?.settings?.dynamicPreferences?.substring(0, 160) ||
      `Browse this gut-friendly ${plan.duration}-day meal plan: ${plan.planName}.`;

    return {
      title: `${plan.planName} | Meal Plan`,
      description,
      alternates: {
        canonical: planUrl,
      },
      openGraph: {
        url: planUrl,
        title: plan.planName,
        description,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: plan.planName,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: plan.planName,
        description,
        images: [imageUrl],
      },
    };
  } catch (error) {
    return {
      title: 'Meal Plan',
    };
  }
}

export default async function PublicMealPlanDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const response = await getPublicMealPlanBySlug(resolvedParams.slug);

  if (!response || !response.success || !response.data) {
    notFound();
  }

  const plan = response.data;
  const heroImageUrl = getPlanHeroImage(plan);
  const ctaHref = `${APP_BASE_URL}/signup`;

  return (
    <main>
      <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa', pb: 8 }}>
        {/* Hero */}
        <Box
          sx={{
            position: 'relative',
            height: { xs: 260, md: 380 },
            overflow: 'hidden',
          }}
        >
          <Box component="img" src={heroImageUrl} alt={plan.planName} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0.15))',
            }}
          />

          <Container
            maxWidth="lg"
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              pb: { xs: 3, md: 4 },
            }}
          >
            <Link href="/plans" style={{ textDecoration: 'none' }}>
              <Button
                startIcon={<ArrowBackIcon />}
                sx={{
                  color: 'white',
                  mb: 2,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                }}
              >
                Back to Plans
              </Button>
            </Link>
          </Container>
        </Box>

        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Typography
            variant="h1"
            sx={{
              color: '#013D1D',
              fontWeight: 800,
              fontSize: { xs: '2rem', md: '3rem' },
              fontFamily: 'var(--font-heading, Montserrat)',
              mb: 1,
            }}
          >
            {plan.planName}
          </Typography>

          <Typography variant="body1" sx={{ color: '#525252', mb: 3 }}>
            {plan.duration} day{plan.duration === 1 ? '' : 's'}
            {plan.visibility === 'unlisted' ? ' (Unlisted)' : ''}
          </Typography>

          {/* I didn't want plan settings shown publicly. 26/01/19 */}
          {/* {plan?.settings?.dynamicPreferences ? (
            <Typography variant="body1" sx={{ color: '#525252', fontSize: '1.05rem', maxWidth: 900, mb: 3 }}>
              <strong>Goal:</strong> {plan.settings.dynamicPreferences}
            </Typography>
          ) : null} */}

          {/* Visual Plan */}
          <Box component="section" sx={{ mb: 6 }}>
            {/* No need for this anymore. Maybe update to include a summary of the plan? */}
            {/* <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '1.35rem', md: '1.6rem' },
                fontWeight: 800,
                color: '#013D1D',
                fontFamily: 'var(--font-heading, Montserrat)',
                mb: 1,
              }}
            >
              Your Plan
            </Typography>

            <Typography variant="body1" sx={{ color: '#525252', mb: 3, maxWidth: 900 }}>
              Recipe links only show when a recipe is public.
            </Typography> */}

            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 3,
                justifyContent: 'center',
                alignItems: 'flex-start',
              }}
            >
              {(plan.days || [])
                .slice()
                .sort((a, b) => (a.dayNumber || 0) - (b.dayNumber || 0))
                .map((day) => {
                  const meals = [] as Array<{
                    type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
                    name: string;
                    imageUrl?: string;
                    fallbackImageUrl?: string;
                    href?: string;
                  }>;

                  const pushMeal = (
                    type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack',
                    slot: any
                  ) => {
                    if (!slot) return;

                    const name = slot.recipeTitle || slot.title || 'Meal';
                    const imageUrl = slot.recipeImage?.thumbnail || slot.recipeImage?.display || defaultMealImage;
                    const fallbackImageUrl = slot.recipeImage?.display || defaultMealImage;
                    const href = slot.recipeSlug ? `/recipes/${slot.recipeSlug}` : undefined;

                    meals.push({ type, name, imageUrl, fallbackImageUrl, href });
                  };

                  pushMeal('Breakfast', day?.meals?.breakfast);
                  pushMeal('Lunch', day?.meals?.lunch);
                  pushMeal('Dinner', day?.meals?.dinner);
                  pushMeal('Snack', day?.meals?.snack);

                  return (
                    <MealPlanDayViewCard
                      key={day.dayNumber}
                      dayNumber={day.dayNumber}
                      meals={meals}
                      tagLabel="Chef Kay"
                      tagColorHex="#FFBF00"
                      showSwapButton={false}
                      showFooterCta={false}
                    />
                  );
                })}
            </Box>
          </Box>

          {/* Conversion Bridge */}
          <Paper
            elevation={0}
            sx={{
              bgcolor: '#013D1D',
              color: 'white',
              borderRadius: 3,
              p: { xs: 3, md: 4 },
            }}
          >
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '1.35rem', md: '1.6rem' },
                fontWeight: 800,
                fontFamily: 'var(--font-heading, Montserrat)',
                mb: 1,
              }}
            >
              Customize This Plan Instantly
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.92)', mb: 3, maxWidth: 900 }}>
              Want this plan adapted to your diet and restrictions? Generate your own version in the Meadow Mentor app.
            </Typography>

            <Link href={ctaHref} style={{ textDecoration: 'none' }}>
              <Button
                variant="contained"
                sx={{
                  bgcolor: '#FFBF00',
                  color: '#013D1D',
                  fontWeight: 800,
                  borderRadius: 999,
                  px: 3,
                  py: 1.25,
                  '&:hover': { bgcolor: '#ffe066' },
                }}
              >
                Start My Custom Plan Free
              </Button>
            </Link>
          </Paper>
        </Container>
      </Box>
    </main>
  );
}
