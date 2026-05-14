import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: [
        'GPTBot',
        'CCBot',
        'Google-Extended',
        'ClaudeBot',
        'PerplexityBot',
        '*', // Fallback for all other bots
      ],
      allow: '/',
      disallow: ['/api/', '/admin/'],
    },
    sitemap: 'https://meadowmentor.com/sitemap.xml',
  };
}