'use client';

import { Button } from '@mui/material';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import posthog from 'posthog-js';
//import { APP_BASE_URL } from '@/lib/api';

/**
 * SeeRecipePageButton - Reusable call-to-action button component
 * 
 * Consistent styling for primary CTA across the landing page
 * 
 * @param variant - 'primary' (green) or 'secondary' (white with arrow)
 * @param trackingLocation - Location identifier for analytics (e.g., 'hero', 'header')
 */

interface SeeRecipePageButtonProps {
  href?: string;
  children: React.ReactNode;
  size?: 'medium' | 'large';
  fullWidth?: boolean;
  variant?: 'primary' | 'secondary';
  trackingLocation?: string;
}

export default function SeeRecipePageButton({
  href = `/recipes`,
  children,
  size = 'large',
  fullWidth = false,
  variant = 'primary',
  trackingLocation = 'unknown_cta',
}: SeeRecipePageButtonProps) {
  const primaryStyles = {
    bgcolor: '#013D1D',
    color: '#fff',
    px: 4,
    py: size === 'large' ? 1.5 : 1.25,
    fontSize: size === 'large' ? '1.1rem' : '1rem',
    fontWeight: 600,
    textTransform: 'none' as const,
    width: fullWidth ? '100%' : 'auto',
    '&:hover': {
      bgcolor: '#047857',
    },
  };

  const secondaryStyles = {
    backgroundColor: 'white',
    color: '#1976d2',
    fontWeight: 700,
    fontSize: { xs: '1.1rem', md: '1.25rem' },
    px: { xs: 4, md: 6 },
    py: { xs: 2, md: 2.5 },
    borderRadius: 3,
    textTransform: 'none' as const,
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    width: fullWidth ? '100%' : 'auto',
    '&:hover': {
      backgroundColor: '#f5f5f5',
      boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
      transform: 'translateY(-2px)',
    },
    transition: 'all 0.3s ease',
  };

  const buttonStyles = variant === 'secondary' ? secondaryStyles : primaryStyles;

  const endIcon = variant === 'secondary' ? <ArrowRight size={24} /> : undefined;

  const handleClick = () => {
    posthog.capture('see_recipe_page_clicked', { location: trackingLocation });
  };

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none', width: fullWidth ? '100%' : 'auto' }} onClick={handleClick}>
        <Button
          variant="contained"
          size={size}
          endIcon={endIcon}
          sx={buttonStyles}
        >
          {children}
        </Button>
      </Link>
    );
  }

  return (
    <Button
      variant="contained"
      size={size}
      endIcon={endIcon}
      sx={buttonStyles}
      onClick={handleClick}
    >
      {children}
    </Button>
  );
}
