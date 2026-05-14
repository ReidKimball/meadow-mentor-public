'use client';

/**
 * @file Defines the `BlogPostBody` component.
 * @description Client-side Portable Text renderer for blog post bodies.
 * This wrapper is required because the blog body can now contain interactive blocks
 * (ex: the `newsletterSignup` block which uses React hooks + Cloudflare Turnstile).
 *
 * @requires module:react - React.
 * @requires module:@portabletext/react - Portable Text renderer for Sanity content.
 * @requires module:@mui/material - MUI components for consistent styling.
 * @requires module:@/lib/sanity - `urlFor` helper for image URLs.
 * @requires module:@/components/NewsletterSignup - Inline newsletter signup card.
 * @author Cascade
 * @version 1.0.0
 * @date 2026-01-30
 */

// React/Third-Party Libraries
import React from 'react';
import { PortableText } from '@portabletext/react'; // Portable Text renderer.
import { Box, Typography } from '@mui/material'; // MUI primitives.

// Internal Modules
import { urlFor } from '@/lib/sanity'; // Sanity image URL builder.
import NewsletterSignup from '@/components/NewsletterSignup'; // Interactive newsletter signup block.

/**
 * @typedef {object} BlogPostBodyProps
 * @property {any} body - Sanity Portable Text array for the post body.
 */
export type BlogPostBodyProps = {
  body: any;
};

// Custom components for Portable Text (client-side only).
const ptComponents = {
  types: {
    image: ({ value }: any) => {
      if (!value?.asset?._ref) {
        return null;
      }
      return (
        <Box sx={{ my: 4, position: 'relative', width: '100%', borderRadius: 4, overflow: 'hidden' }}>
          <img
            src={urlFor(value).url()}
            alt={value.alt || ' '}
            style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
          />
        </Box>
      );
    },
    newsletterSignup: ({ value }: any) => (
      <NewsletterSignup
        headline={value?.headline}
        subheadline={value?.subheadline}
        ctaText={value?.ctaText}
        variant="light"
      />
    ),
  },
  block: {
    h1: ({ children }: any) => (
      <Typography
        variant="h2"
        component="h2"
        sx={{ mt: 6, mb: 2, color: '#013D1D', fontWeight: 700, fontFamily: 'var(--font-heading, Montserrat)' }}
      >
        {children}
      </Typography>
    ),
    h2: ({ children }: any) => (
      <Typography
        variant="h3"
        component="h3"
        sx={{ mt: 5, mb: 2, color: '#013D1D', fontWeight: 700, fontFamily: 'var(--font-heading, Montserrat)' }}
      >
        {children}
      </Typography>
    ),
    h3: ({ children }: any) => (
      <Typography
        variant="h4"
        component="h4"
        sx={{ mt: 4, mb: 2, color: '#013D1D', fontWeight: 600, fontFamily: 'var(--font-heading, Montserrat)' }}
      >
        {children}
      </Typography>
    ),
    normal: ({ children }: any) => (
      <Typography paragraph sx={{ mb: 2, lineHeight: 1.8, color: '#333', fontSize: '1.1rem' }}>
        {children}
      </Typography>
    ),
    blockquote: ({ children }: any) => (
      <Box sx={{ borderLeft: '4px solid #013D1D', pl: 3, my: 3, py: 1, bgcolor: '#f0fdf4', borderRadius: '0 8px 8px 0' }}>
        <Typography sx={{ fontStyle: 'italic', color: '#013D1D' }}>{children}</Typography>
      </Box>
    ),
  },
  list: {
    bullet: ({ children }: any) => (
      <Box component="ul" sx={{ pl: 4, mb: 3 }}>
        {children}
      </Box>
    ),
    number: ({ children }: any) => (
      <Box component="ol" sx={{ pl: 4, mb: 3 }}>
        {children}
      </Box>
    ),
  },
  listItem: {
    bullet: ({ children }: any) => <li style={{ marginBottom: '0.5rem', lineHeight: 1.6 }}>{children}</li>,
    number: ({ children }: any) => <li style={{ marginBottom: '0.5rem', lineHeight: 1.6 }}>{children}</li>,
  },
  marks: {
    link: ({ children, value }: any) => {
      return (
        <Box
          component="a"
          href={value?.href}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            color: '#013D1D',
            textDecoration: 'underline',
            fontWeight: 600,
            transition: 'text-decoration 0.2s ease',
            '&:hover': {
              textDecoration: 'none',
            },
          }}
        >
          {children}
        </Box>
      );
    },
  },
};

/**
 * @component BlogPostBody
 * @description Renders the blog post body Portable Text on the client.
 *
 * @param {BlogPostBodyProps} props - Component props.
 * @returns {JSX.Element} Rendered post body.
 */
export default function BlogPostBody({ body }: BlogPostBodyProps) {
  return <PortableText value={body} components={ptComponents} />;
}
