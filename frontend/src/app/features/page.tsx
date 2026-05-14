import { Metadata } from 'next';
import FeaturesClient from './FeaturesClient';

export const metadata: Metadata = {
  title: 'Features | AI Meal Planner & Ingredient Scanner',
  description: 'Discover tools for therapeutic diets: scan ingredients for safety, generate custom recipes, and plan healing meals.',
  openGraph: {
    title: 'Features | AI Meal Planner & Ingredient Scanner',
    description: 'Discover tools for therapeutic diets: scan ingredients for safety, generate custom recipes, and plan healing meals.',
  }
};

export default function FeaturesPage() {
  return <FeaturesClient />;
}
