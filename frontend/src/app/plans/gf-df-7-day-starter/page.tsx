/**
 * @file Defines the public landing page for the 7-day gluten-free and dairy-free starter meal plan.
 * @description Renders SEO metadata and a conversion-focused plan page at `/plans/gf-df-7-day-starter`.
 * The page is designed to be easy for users and AI “answer engines” to scan, and it reuses the
 * existing `MealPlanDayViewCard` UI for the 7-day visual plan.
 * @requires module:react - React runtime for JSX.
 * @requires module:next - Next.js Metadata typing.
 * @author Cascade
 * @version 1.0.0
 * @date 2025-12-17
 */

// React/Next.js
import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

// UI (MUI)
import { Box, Button, Container, Paper, Typography } from '@mui/material';

// Internal Components
import MealPlanDayViewCard from '@/components/MealPlanDayViewCard';

// Constants
import { APP_BASE_URL } from '@/lib/api';

export const metadata: Metadata = {
  title: '7-Day Meal Plan Gluten Free Dairy Free | Meadow Mentor',
  description:
    "A complete 7-day gluten and dairy free meal plan. Delicious, gut-friendly recipes designed to help you thrive without the restriction fatigue. Try it free.",
  openGraph: {
    title: "The 'No-Miss' Gluten & Dairy Free Meal Plan.",
    description:
      "A complete 7-day gluten and dairy free meal plan. Delicious, gut-friendly recipes designed to help you thrive without the restriction fatigue. Try it free.",
  },
};

const defaultMealImage =
  'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/Kay_Delivers_Recipe_Header_v2.jpeg';

const weekAtAGlance = [
  {
    day: 'Day 1',
    summary: 'Quinoa Porridge / Turmeric Chicken Soup / Baked Salmon',
  },
  {
    day: 'Day 2',
    summary: 'Oat Pancakes / Leftover Soup / Turkey Zucchini Stir-Fry',
  },
  {
    day: 'Day 3',
    summary: 'Green Smoothie / Turkey Burger Bowl / Beef Stew',
  },
  {
    day: 'Day 4',
    summary: 'Spinach Scramble / Tuna Salad / Roasted Chicken Thighs',
  },
  {
    day: 'Day 5',
    summary: 'Chia Pudding / Chicken Rice Soup / Baked Cod',
  },
  {
    day: 'Day 6',
    summary: 'Sweet Potato Hash / Leftover Cod / Shepherd’s Pie',
  },
  {
    day: 'Day 7',
    summary: 'Pumpkin Oatmeal / Leftover Pie / One-Pan Roast Chicken',
  },
];

const planDays = [
  {
    dayNumber: 1,
    meals: [
      { type: 'Breakfast' as const, name: 'Warm Quinoa Porridge with Stewed Blueberries', imageUrl: defaultMealImage },
      { type: 'Lunch' as const, name: 'Lemon-Turmeric Chicken Soup (Rice Noodles)', imageUrl: defaultMealImage },
      { type: 'Dinner' as const, name: 'Baked Salmon with Maple-Glazed Carrots', imageUrl: defaultMealImage },
    ],
  },
  {
    dayNumber: 2,
    meals: [
      { type: 'Breakfast' as const, name: 'Banana Oat Pancakes (Almond Milk)', imageUrl: defaultMealImage },
      { type: 'Lunch' as const, name: 'Leftover Turmeric Chicken Soup', imageUrl: defaultMealImage },
      { type: 'Dinner' as const, name: 'Ground Turkey Stir-Fry with Zucchini Noodles', imageUrl: defaultMealImage },
    ],
  },
  {
    dayNumber: 3,
    meals: [
      { type: 'Breakfast' as const, name: 'Green Smoothie (Spinach, Pineapple, Avocado)', imageUrl: defaultMealImage },
      { type: 'Lunch' as const, name: 'Turkey Burger Salad Bowl (Avocado Oil Mayo)', imageUrl: defaultMealImage },
      { type: 'Dinner' as const, name: 'Slow Cooker Beef Stew (Potatoes & Carrots)', imageUrl: defaultMealImage },
    ],
  },
  {
    dayNumber: 4,
    meals: [
      { type: 'Breakfast' as const, name: 'Scrambled Eggs with Spinach', imageUrl: defaultMealImage },
      { type: 'Lunch' as const, name: 'Mediterranean Tuna Salad with Olives', imageUrl: defaultMealImage },
      { type: 'Dinner' as const, name: 'Grilled Chicken Thighs with Roasted Sweet Potatoes', imageUrl: defaultMealImage },
    ],
  },
  {
    dayNumber: 5,
    meals: [
      { type: 'Breakfast' as const, name: 'Chia Seed Pudding with Coconut Milk', imageUrl: defaultMealImage },
      { type: 'Lunch' as const, name: 'Chicken & Rice Soup (Bone Broth Base)', imageUrl: defaultMealImage },
      { type: 'Dinner' as const, name: 'Baked Cod with Steamed Green Beans', imageUrl: defaultMealImage },
    ],
  },
  {
    dayNumber: 6,
    meals: [
      { type: 'Breakfast' as const, name: 'Sweet Potato Hash with Poached Eggs', imageUrl: defaultMealImage },
      { type: 'Lunch' as const, name: 'Leftover Baked Cod & Greens', imageUrl: defaultMealImage },
      { type: 'Dinner' as const, name: 'Shepherd’s Pie (Cauliflower Mash Topping)', imageUrl: defaultMealImage },
    ],
  },
  {
    dayNumber: 7,
    meals: [
      { type: 'Breakfast' as const, name: 'Pumpkin Spice Oatmeal (GF Oats)', imageUrl: defaultMealImage },
      { type: 'Lunch' as const, name: "Shepherd's Pie Leftovers", imageUrl: defaultMealImage },
      { type: 'Dinner' as const, name: 'Roast Chicken with Root Vegetables (One Pan)', imageUrl: defaultMealImage },
    ],
  },
];

export default function GfDf7DayStarterPlanPage() {
  const ctaHref = `${APP_BASE_URL}/signup`;

  return (
    <main>
      <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa', pb: 8 }}>
        {/* Section A: Hero */}
        <Box
          sx={{
            position: 'relative',
            height: { xs: 260, md: 380 },
            overflow: 'hidden',
          }}
        >
          <Box
            component="img"
            src={defaultMealImage}
            alt="7-day gluten and dairy free meal plan"
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
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
            <Typography
              variant="h1"
              sx={{
                color: 'white',
                fontWeight: 800,
                fontSize: { xs: '2rem', md: '3rem' },
                fontFamily: 'var(--font-heading, Montserrat)',
                mb: 1,
              }}
            >
              7-Day Gluten & Dairy Free Meal Plan
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: 'rgba(255,255,255,0.9)', fontSize: { xs: '1.05rem', md: '1.25rem' } }}
            >
              Stop asking 'What can I eat?' and start asking 'What do I want to eat?'
            </Typography>
          </Container>
        </Box>

        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Typography
            variant="body1"
            sx={{
              color: '#525252',
              fontSize: '1.05rem',
              maxWidth: 900,
              mb: 3,
            }}
          >
            Navigating two restrictions at once is exhausting. I’ve done the heavy lifting for you. This plan uses the{' '}
            <strong>Mediterranean</strong> framework (fresh proteins, healthy fats, and vibrant vegetables) naturally modified to be 100% Gluten and Dairy Free. No cardboard bread, just real food.
          </Typography>

          {/* Section B: Answer Engine Block */}
          <Box component="section" sx={{ mb: 5 }}>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '1.35rem', md: '1.6rem' },
                fontWeight: 800,
                color: '#013D1D',
                fontFamily: 'var(--font-heading, Montserrat)',
                mb: 2,
              }}
            >
              At a Glance: Your Week of Eats
            </Typography>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {weekAtAGlance.map((row) => (
                  <tr key={row.day}>
                    <th
                      scope="row"
                      style={{
                        textAlign: 'left',
                        verticalAlign: 'top',
                        padding: '10px 12px',
                        borderBottom: '1px solid #e5e5e5',
                        width: 120,
                        color: '#013D1D',
                      }}
                    >
                      {row.day}
                    </th>
                    <td
                      style={{
                        padding: '10px 12px',
                        borderBottom: '1px solid #e5e5e5',
                        color: '#404040',
                      }}
                    >
                      {row.summary}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>

          {/* Section C: Visual Plan */}
          <Box component="section" sx={{ mb: 6 }}>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '1.35rem', md: '1.6rem' },
                fontWeight: 800,
                color: '#013D1D',
                fontFamily: 'var(--font-heading, Montserrat)',
                mb: 1,
              }}
            >
              Your 7-Day Plan
            </Typography>

            <Typography variant="body1" sx={{ color: '#525252', mb: 3, maxWidth: 900 }}>
              Each day includes a breakfast, lunch, and dinner that are naturally Gluten-Free and Dairy-Free.
            </Typography>

            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 3,
                justifyContent: 'center',
                alignItems: 'flex-start',
              }}
            >
              {planDays.map((day) => (
                <MealPlanDayViewCard
                  key={day.dayNumber}
                  dayNumber={day.dayNumber}
                  meals={day.meals}
                  tagLabel="GF & DF Safe"
                  tagColorHex="#FFBF00"
                  showSwapButton={false}
                  showFooterCta={false}
                />
              ))}
            </Box>
          </Box>

          {/* Section D: Conversion Bridge */}
          <Paper
            elevation={0}
            sx={{
              bgcolor: '#013D1D',
              color: 'white',
              borderRadius: 3,
              p: { xs: 3, md: 4 },
              mb: 6,
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
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.92)', mb: 3 }}>
              “Need to swap the Salmon? Or want to generate a shopping list? You can run this exact logic in the Meadow Mentor app:”
            </Typography>

            <Box component="ol" sx={{ pl: 3, mb: 3, color: 'rgba(255,255,255,0.92)' }}>
              <li>
                <strong>Select Diet:</strong> Choose <strong>"Mediterranean"</strong> (Best for variety).
              </li>
              <li>
                <strong>Add Filters:</strong> Toggle ON <strong>"Gluten-Free"</strong> and <strong>"Dairy-Free"</strong>.
              </li>
              <li>
                <strong>Click Generate:</strong> Chef Kay will build your custom menu in seconds.
              </li>
            </Box>

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

          {/* Section E: FAQ */}
          <Box component="section">
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '1.35rem', md: '1.6rem' },
                fontWeight: 800,
                color: '#013D1D',
                fontFamily: 'var(--font-heading, Montserrat)',
                mb: 2,
              }}
            >
              FAQ
            </Typography>

            <Box sx={{ display: 'grid', gap: 2 }}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h3" sx={{ fontSize: '1.05rem', fontWeight: 800, mb: 1, color: '#013D1D' }}>
                  Q: Can I use this plan for IBS?
                </Typography>
                <Typography variant="body1" sx={{ color: '#525252' }}>
                  A: This base plan is gentle, but if you have IBS, use the Meadow Mentor app to overlay the <strong>"Low FODMAP"</strong> filter on top of these recipes.
                </Typography>
              </Paper>

              <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h3" sx={{ fontSize: '1.05rem', fontWeight: 800, mb: 1, color: '#013D1D' }}>
                  Q: Is this plan high protein?
                </Typography>
                <Typography variant="body1" sx={{ color: '#525252' }}>
                  A: Yes. We prioritize lean meats and fish to keep you satiated without the dairy bloat.
                </Typography>
              </Paper>
            </Box>
          </Box>
        </Container>
      </Box>
    </main>
  );
}
