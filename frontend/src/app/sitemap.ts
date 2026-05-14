import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://meadowmentor.com';

  // Static pages
  const routes: MetadataRoute.Sitemap = [
    '',
    '/diets',
    '/diets/scd-diet-app',
    '/diets/aip-diet-app',
    '/diets/gaps-diet-app',
    '/diets/mediterranean-diet-app',
    '/recipes',
    '/features',
    '/about',
    '/blog',
    '/pricing',
    '/privacy',
    '/terms',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: (route === '/blog' || route === '/recipes') ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : 0.8,
  }));

  return routes;
}