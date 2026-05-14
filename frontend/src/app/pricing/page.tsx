import { Metadata } from 'next';
import PricingClient from './PricingClient';

export const metadata: Metadata = {
  title: 'Pricing | Affordable Gut Health Coaching & Tools',
  description: 'Pay as you go with Meadow Credits. Generate personalized meal plans, AI recipe scans, and therapeutic food art without monthly subscriptions.',
  openGraph: {
    title: 'Pricing | Affordable Gut Health Coaching & Tools',
    description: 'Pay as you go with Meadow Credits. Generate personalized meal plans, AI recipe scans, and therapeutic food art without monthly subscriptions.',
  }
};

export default function PricingPage() {
  return <PricingClient />;
}
