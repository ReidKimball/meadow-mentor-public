/**
 * @file Defines the main homepage (`/`) for Meadow Mentor.
 * @description Server-side rendered landing page focused on gut health coaching
 *              for IBD, Crohn's, and Ulcerative Colitis. Fetches a featured recipe
 *              server-side to showcase the companion app's capabilities. Delegates
 *              all interactive rendering to the `HomeClient` component.
 * @requires module:next - Next.js framework for SSR, metadata, and async pages.
 * @requires module:react - React JSX types for component return types.
 * @requires @/services/recipeService - Service to fetch public recipe data.
 * @requires @/app/HomeClient - Interactive client component containing the full page UI.
 * @see {@link https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts|Next.js Pages Documentation}
 */

import { Metadata } from 'next'; // Next.js type for defining page metadata.
import HomeClient from './HomeClient'; // Client component containing the full interactive landing page UI.
import { getPublicRecipeBySlug } from '@/services/recipeService'; // Fetches public recipe data by slug for server-side rendering.

/**
 * Metadata configuration for the homepage.
 * Optimizes SEO and social sharing for coaching-focused search intent.
 * @type {Metadata}
 */
export const metadata: Metadata = {
  title: 'Gut Health Coaching | Meadow Mentor — IBD, Crohn\'s, Ulcerative Colitis',
  description: '1-on-1 gut health coaching using the 5-R Framework for IBD, Crohn\'s, and Ulcerative Colitis. Includes a companion AI app for meal planning, recipe generation, and diet compliance.',
  openGraph: {
    title: 'Gut Health Coaching | Meadow Mentor',
    description: '1-on-1 gut health coaching using the 5-R Framework for IBD, Crohn\'s, and Ulcerative Colitis.',
  }
};

/**
 * @component Home
 * @description Server Component for the main landing page (`/`). Fetches the
 *              featured `scd-chewy-ginger-cookies` recipe to display within the
 *              App Preview section of the client component. Falls back to a static
 *              recipe object if the backend API is unreachable. Also injects
 *              structured JSON-LD data for SEO.
 * @async
 * @returns {Promise<JSX.Element>} The rendered homepage with JSON-LD and HomeClient.
 * @example
 * // Accessed at the root URL:
 * GET https://meadowmentor.com/
 */
export default async function Home() {
  // The slug of the recipe featured in the "App Preview" section.
  const teaserRecipeSlug = 'scd-chewy-ginger-cookies';
  let teaserRecipe; // Will hold the fetched Recipe data or remain undefined.

  try {
    // Attempts to fetch the featured recipe from the public API.
    // Failure (e.g., backend down) is caught silently.
    const recipeResponse = await getPublicRecipeBySlug(teaserRecipeSlug);
    teaserRecipe = recipeResponse?.data; // Extracts the Recipe object from the API response.
  } catch {
    // If the API fails, teaserRecipe remains undefined to trigger the fallback.
    teaserRecipe = undefined;
  }

  /**
   * Fallback recipe object used when the backend API is unreachable.
   * Ensures the App Preview section always renders a valid RecipeSummaryCard.
   * @constant {object}
   */
  const fallbackRecipe = {
    _id: 'scd-chewy-ginger-cookies-fallback',
    slug: teaserRecipeSlug,
    recipeTitle: 'SCD Chewy Ginger Cookies',
    recipeDescription: 'Soft, chewy ginger cookies made with honey and almond flour. A comforting SCD-legal treat that satisfies sweet cravings without breaking your gut-healing protocol.',
    recipeImage: {
      thumbnail: 'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/Kay_Delivers_Recipe_Header_v2.jpeg',
      display: 'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/Kay_Delivers_Recipe_Header_v2.jpeg',
      original: 'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/Kay_Delivers_Recipe_Header_v2.jpeg',
    },
    recipeDiet: 'SCD',
    mealType: 'snack',
    tags: ['cookies', 'ginger', 'dessert', 'honey', 'almond flour', 'gut healing'],
    totalTime: '30 minutes',
    averageRating: 5,
    ratings: [1],
  };

  /**
   * Structured JSON-LD data describing the coaching service.
   * Injected into the page to improve SEO and rich snippet rendering.
   * @see {@link https://schema.org/ProfessionalService|Schema.org ProfessionalService}
   * @see {@link https://schema.org/Person|Schema.org Person}
   */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Meadow Mentor Gut Health Coaching',
    url: 'https://meadowmentor.com',
    description: '1-on-1 gut health coaching for IBD, Crohn\'s, and Ulcerative Colitis using the 5-R Framework.',
    provider: {
      '@type': 'Person',
      name: 'Reid Kimball',
      description: 'IBD health coach with 20+ years of lived experience managing Crohn\'s Disease.',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Worldwide',
    },
    serviceType: 'Health Coaching',
    knowsAbout: [
      'Specific Carbohydrate Diet (SCD)',
      'GAPS Diet',
      'AIP Diet',
      'Mediterranean Diet',
      'IBD Management',
      'Crohn\'s Disease',
      'Ulcerative Colitis',
    ],
    image: 'https://storage.googleapis.com/meadow_mentor_public_media/images/chef_kay_in_sun_v4_sm.webp',
  };

  return (
    <main>
      {/* Injects structured JSON-LD data into the <head> for SEO and rich snippets. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Renders the interactive client component, passing the fetched recipe (or fallback). */}
      <HomeClient teaserRecipe={teaserRecipe || fallbackRecipe} />
    </main>
  );
}
