/**
 * @file Defines the `MealPlanDayViewCard` component.
 * @description A reusable UI card that renders a single day in a meal plan (breakfast, lunch, dinner)
 * with a small compliance/tag indicator.
 * @requires module:react - React runtime for JSX.
 * @requires module:lucide-react - Icon set for UI affordances.
 * @requires @mui/material - UI primitives used for consistent styling without Tailwind.
 * @author Cascade
 * @version 1.0.0
 * @date 2025-12-17
 */

'use client';

// React/Third-Party Libraries
import React, { useMemo, useState } from 'react';
import { ArrowRight, RefreshCw, ChefHat } from 'lucide-react'; // UI icons.
import Link from 'next/link'; // Next.js link for optional meal detail navigation.

// UI (MUI)
import { Box, Button, IconButton, Paper, Typography } from '@mui/material';

interface Meal {
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  name: string;
  calories?: number;
  imageUrl?: string; // Use your recipe images here
  fallbackImageUrl?: string; // Optional fallback image when imageUrl fails to load
  srcSet?: string; // Optional responsive image sources (thumbnail vs display)
  sizes?: string; // Optional sizes hint for srcSet selection
  href?: string; // Optional link destination (e.g., public recipe page)
}

interface DayViewProps {
  dayNumber: number;
  meals: Meal[];
  tagLabel?: string;
  tagColorHex?: string;
  showSwapButton?: boolean;
  showFooterCta?: boolean;
}

function MealImage({
  src,
  fallbackSrc,
  alt,
}: {
  src?: string;
  fallbackSrc?: string;
  alt: string;
}) {
  const initialSrc = useMemo(() => src || '', [src]);
  const [currentSrc, setCurrentSrc] = useState(initialSrc);
  const [usedFallback, setUsedFallback] = useState(false);

  if (!currentSrc) return null;

  return (
    <Box
      component="img"
      src={currentSrc}
      alt={alt}
      onError={() => {
        if (!usedFallback && fallbackSrc && fallbackSrc !== currentSrc) {
          setUsedFallback(true);
          setCurrentSrc(fallbackSrc);
          return;
        }
        setCurrentSrc('');
      }}
      sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  );
}

/**
 * @component MealPlanDayViewCard
 * @description Displays a single day card within a multi-day meal plan page.
 * The card is styled using MUI components so it renders correctly without Tailwind.
 * @param {DayViewProps} props - The component props.
 * @param {number} props.dayNumber - The day number (1-7).
 * @param {Meal[]} props.meals - Array of meals to show (Breakfast/Lunch/Dinner).
 * @param {string} [props.tagLabel] - Optional label shown in the header (e.g. "GF & DF Safe").
 * @param {string} [props.tagColorHex] - Optional hex color used for the tag label.
 * @param {boolean} [props.showSwapButton=true] - Optional flag to show/hide the swap button.
 * @param {boolean} [props.showFooterCta=true] - Optional flag to show/hide the footer CTA.
 * @returns {JSX.Element} The rendered day view card.
 */
export default function MealPlanDayViewCard({
  dayNumber,
  meals,
  tagLabel = 'AIP Compliant',
  tagColorHex = '#FFBF00',
  showSwapButton = true,
  showFooterCta = true,
}: DayViewProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        maxWidth: 420,
        borderRadius: 3,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'grey.200',
        bgcolor: 'white',
      }}
    >
      {/* Header */}
      <Box sx={{ bgcolor: '#013D1D', px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography
          component="h3"
          sx={{
            color: 'white',
            fontWeight: 800,
            fontSize: '1.1rem',
            fontFamily: 'var(--font-heading, Montserrat)',
          }}
        >
          Day {dayNumber}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: tagColorHex }}>
          <ChefHat size={16} />
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: 'inherit' }}>{tagLabel}</Typography>
        </Box>
      </Box>

      {/* Meals */}
      <Box sx={{ p: 2, display: 'grid', gap: 1.5 }}>
        {meals.map((meal, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1,
              borderRadius: 2,
              '&:hover': { bgcolor: 'grey.50' },
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 2,
                bgcolor: 'grey.200',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              <MealImage src={meal.imageUrl} fallbackSrc={meal.fallbackImageUrl} alt={meal.name} />
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: '0.72rem', color: 'grey.600', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {meal.type}
              </Typography>
              {meal.href ? (
                <Link href={meal.href} style={{ textDecoration: 'none' }}>
                  <Typography
                    sx={{
                      color: '#013D1D',
                      fontWeight: 700,
                      lineHeight: 1.2,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textDecoration: 'underline',
                      textDecorationColor: 'rgba(1, 61, 29, 0.35)',
                      textUnderlineOffset: '3px',
                      '&:hover': { textDecorationColor: '#013D1D' },
                    }}
                  >
                    {meal.name}
                  </Typography>
                </Link>
              ) : (
                <Typography
                  sx={{
                    color: '#013D1D',
                    fontWeight: 700,
                    lineHeight: 1.2,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {meal.name}
                </Typography>
              )}
              {typeof meal.calories === 'number' ? (
                <Typography sx={{ fontSize: '0.8rem', color: 'grey.500', mt: 0.25 }}>{meal.calories} kcal</Typography>
              ) : null}
            </Box>

            {showSwapButton ? (
              <IconButton aria-label="Swap meal" sx={{ color: 'grey.400', '&:hover': { color: '#FFBF00' } }}>
                <RefreshCw size={18} />
              </IconButton>
            ) : null}
          </Box>
        ))}
      </Box>

      {showFooterCta ? (
        <Box sx={{ bgcolor: '#dcfce7', px: 2, py: 2, borderTop: '1px solid', borderTopColor: 'success.100', textAlign: 'center' }}>
          <Typography sx={{ color: '#013D1D', fontSize: '0.95rem', fontWeight: 700, mb: 1 }}>
            Don't like leftovers?
          </Typography>
          <Button
            variant="contained"
            endIcon={<ArrowRight size={18} />}
            sx={{
              bgcolor: '#FFBF00',
              color: '#013D1D',
              fontWeight: 800,
              borderRadius: 999,
              px: 3,
              py: 1,
              width: '100%',
              maxWidth: 320,
              '&:hover': { bgcolor: '#ffe066' },
            }}
          >
            Customize This Day
          </Button>
        </Box>
      ) : null}
    </Paper>
  );
}