import HeroSection from '@/components/HeroSection_v4';
import WhoIsThisForSection from '@/components/WhoIsThisForSection';
import SafeFoodsSection from '@/components/SafeFoodsSection';
import FeatureSection from '@/components/FeatureSection';
import FounderStorySection from '@/components/FounderStorySection';
import FinalCTA from '@/components/FinalCTA';
import { Box } from '@mui/material';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Meadow Mentor App — AI-Powered Diet Tools',
  description: 'AI-powered personal chef app for navigating therapeutic diets like AIP, GAPS, Mediterranean, and SCD. Generate recipes, scan ingredients, and build meal plans.',
  openGraph: {
    title: 'Meadow Mentor App — AI-Powered Diet Tools',
    description: 'AI-powered personal chef app for navigating therapeutic diets like AIP, GAPS, Mediterranean, and SCD.',
  }
};

export default function AppLandingPage() {

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Meadow Mentor',
    url: 'https://meadowmentor.com/app',
    applicationCategory: "HealthApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript. Optimized for Chrome, Safari, Firefox.",
    author: {
        '@id': 'https://meadowmentor.com/#organization' 
    },
    description: 'AI-powered personal chef app for navigating therapeutic diets like AIP, GAPS, Mediterranean, and SCD.',
    offers: {
      '@type': "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free to start with core features"
    },
    featureList: [
      'AI Recipe Generator for AIP, GAPS, Mediterranean, and SCD',
      'AI Recipe Adaptation to individual needs',
      'AI Ingredient Label Scanner',
      'AI Shopping List Generator',
      'AI 1-14 Day Meal Plan Generator',
      'AI Diet Coaching',
      'Food Safety Database',
    ],
    image: 'https://storage.googleapis.com/meadow_mentor_public_media/images/chef_kay_in_sun_v4_sm.webp',
    screenshot: 'https://storage.googleapis.com/meadow_mentor_public_media/images/meadow_mentor_og_image_1200x630.webp'
  }

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Box sx={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
        <HeroSection />
        <WhoIsThisForSection />
        <SafeFoodsSection />
        <FeatureSection />
        <FounderStorySection />
        <FinalCTA />
      </Box>
    </main>
  );
}
