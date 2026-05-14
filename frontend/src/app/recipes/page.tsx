import { Metadata } from 'next';
import RecipesClient from './RecipesClient';

export const metadata: Metadata = {
  title: 'Gut Healing Recipes | Therapeutic Diets Collection',
  description: 'Explore a collection of gut-friendly recipes designed for therapeutic healing. Clean ingredients, delicious flavors.',
  openGraph: {
    title: 'Gut Healing Recipes | Therapeutic Diets Collection',
    description: 'Explore a collection of gut-friendly recipes designed for therapeutic healing. Clean ingredients, delicious flavors.',
  }
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Gut Healing Recipes Collection',
  description: 'Explore a collection of gut-friendly recipes designed for therapeutic healing. Clean ingredients, delicious flavors.',
  url: 'https://meadowmentor.com/recipes',
  about: {
    '@type': 'Thing',
    name: 'Therapeutic Diets',
    description: 'Resources for SCD, GAPS, Paleo AIP, and Mediterranean diets.'
  }
};

export default function PublicRecipesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RecipesClient />
    </>
  );
}
