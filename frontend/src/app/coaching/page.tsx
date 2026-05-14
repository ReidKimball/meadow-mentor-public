import { Metadata } from 'next';
import CoachingClient from './CoachingClient';

export const metadata: Metadata = {
  title: 'Gut Health Coaching | Meadow Mentor',
  description: 'Take back control of your gut health. 1-on-1 coaching using the 5-R Framework for people with IBD, Crohn\'s, and Ulcerative Colitis. Free gut healing checklist included.',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'Gut Health Coaching | Meadow Mentor',
    description: 'Take back control of your gut health. 1-on-1 coaching using the 5-R Framework for IBD, Crohn\'s, and Ulcerative Colitis.',
  }
};

export default function CoachingPage() {
  return <CoachingClient />;
}
