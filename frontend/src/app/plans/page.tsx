/**
 * @file Defines the public meal plan listing page.
 * @description Renders a public index of meal plans at `/plans`.
 * This page is designed for SEO/AEO and fetches data from the backend public meal plan API.
 *
 * Uses ISR via `export const revalidate`.
 *
 * @requires module:react - React runtime for JSX.
 * @requires module:next/link - Next.js navigation.
 * @requires @mui/material - UI components.
 * @requires @/services/mealPlanService - Public meal plan API helpers.
 * @requires @/lib/api - App base URL constants for CTA links.
 * @author Cascade
 * @version 1.0.0
 * @date 2025-12-17
 */

// React/Next.js
import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';

// UI (MUI)
import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material';

// Services & API
import { getPublicMealPlans, type PublicMealPlanListItem } from '@/services/mealPlanService';

// Constants
import { APP_BASE_URL } from '@/lib/api';

export const revalidate = 60; // ISR revalidation

export const metadata: Metadata = {
  title: 'Meal Plans | Meadow Mentor',
  description: 'Browse public gut-friendly meal plans from Meadow Mentor.',
};

export default async function PublicMealPlansIndexPage() {
  let plans: PublicMealPlanListItem[] = [];

  try {
    const response = await getPublicMealPlans();
    plans = response?.data || [];
  } catch (error) {
    console.error('[plans/page.tsx] Failed to load public meal plans:', error);
  }

  const ctaHref = `${APP_BASE_URL}/signup`;

  return (
    <main>
      <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa', pb: 8 }}>
        <Container maxWidth="lg" sx={{ pt: { xs: 6, md: 8 } }}>
          <Typography
            component="h1"
            variant="h1"
            sx={{
              fontSize: { xs: '2.2rem', md: '3rem' },
              fontWeight: 800,
              color: '#013D1D',
              fontFamily: 'var(--font-heading, Montserrat)',
              mb: 1,
            }}
          >
            Meal Plans
          </Typography>

          <Typography variant="body1" sx={{ color: '#525252', maxWidth: 820, mb: 4 }}>
            These public plans are designed to be easy to scan, easy to cook, and gentle on your gut.
          </Typography>

          <Stack spacing={2} sx={{ mb: 6 }}>
            {plans.length === 0 ? (
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'grey.200' }}>
                <Typography sx={{ color: '#013D1D', fontWeight: 800, mb: 0.5 }}>
                  No public meal plans yet.
                </Typography>
                <Typography variant="body2" sx={{ color: '#525252' }}>
                  Publish one from the app as <strong>Public</strong> and it will appear here.
                </Typography>
              </Paper>
            ) : (
              plans.map((plan) => (
                <Link key={plan._id} href={`/plans/${plan.slug}`} style={{ textDecoration: 'none' }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'grey.200',
                      transition: 'all 0.15s ease-in-out',
                      '&:hover': { borderColor: 'grey.300', bgcolor: 'white' },
                    }}
                  >
                    <Typography sx={{ color: '#013D1D', fontWeight: 800, fontSize: '1.15rem' }}>
                      {plan.planName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#525252', mt: 0.5 }}>
                      {plan.duration} day{plan.duration === 1 ? '' : 's'}
                    </Typography>
                  </Paper>
                </Link>
              ))
            )}
          </Stack>

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
              Want a plan tailored to your body?
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.92)', mb: 3, maxWidth: 820 }}>
              In the Meadow Mentor app you can generate a meal plan that matches your diet and restrictions in seconds.
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
