import type { Metadata } from "next";
import { Montserrat, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Box } from '@mui/material';
import { CSPostHogProvider } from './providers';
// 1. IMPORT SCRIPT COMPONENT
import Script from 'next/script'; 

const montserrat = Montserrat({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  display: "swap",
});

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://meadowmentor.com/#organization', // Unique ID for connecting graph nodes
  name: 'Meadow Mentor',
  url: 'https://meadowmentor.com',
  logo: {
    '@type': 'ImageObject',
    url: 'https://storage.googleapis.com/meadow_mentor_public_media/images/chef_kay_in_sun_v4_sm.webp', // Your mascot/logo
    width: 350,
    height: 350
  },
  // This connects YOU to the Brand (AEO Gold)
  founder: {
    '@type': 'Person',
    name: 'Reid Kimball',
    url: 'https://reidkimball.com',
    description: 'Patient-founder with 20+ years of lived experience managing Crohn’s Disease using therapeutic diets like SCD and GAPS.',
    sameAs: [
      'https://www.linkedin.com/in/reidkimball/'
    ]
  },
  // Explicitly stating you are NOT a store
  sameAs: [
    'https://www.youtube.com/@MeadowMentor', // If you have one
    'https://www.facebook.com/profile.php?id=61575780256074' // If you have one
  ]
};


// 2. UPDATED METADATA (Software Utility Focus to fix Google Classification)
export const metadata: Metadata = {
  title: {
    default: 'Meadow Mentor - AI Chef for AIP, Mediterranean, GAPS, & SCD Diets', // Stronger AEO title
    template: '%s | Meadow Mentor',
  },
  description:
    "The AI-powered kitchen companion for therapeutic diets. Generate custom AIP, Mediterranean, GAPS & SCD recipes, scan ingredients for safety, and automate your meal planning.",
  metadataBase: new URL('https://meadowmentor.com'),
  authors: [
    {
      name: 'Reid Kimball',
      url: 'https://meadowmentor.com',
    },
  ],
  // 3. UPDATED KEYWORDS (Software feature focused)
  keywords: [
    'SCD recipes app',
    'GAPS diet meal planner',
    'AIP friendly recipes',
    'Mediterranean diet recipes',
    'low residue diet recipes',
    'therapeutic diet tool',
    'gut health food scanner',
    'AI recipe generator',
    'Specific Carbohydrate Diet app',
    'Mediterranean Diet app',
    'GAPS Diet app',
    'AIP Diet app'
  ],
  alternates: {
    canonical: 'https://meadowmentor.com',
  },
  openGraph: {
    type: 'website',
    url: 'https://meadowmentor.com',
    title: 'Meadow Mentor - AI Personal Chef for AIP, Mediterranean, GAPS, & SCD Diets',
    description:
      "The AI-powered kitchen companion for therapeutic diets. Generate custom AIP, Mediterranean, GAPS & SCD recipes, scan ingredients for safety, and automate your meal planning.",
    images: [
      {
        url: 'https://storage.googleapis.com/meadow_mentor_public_media/images/meadow_mentor_og_image_1200x630.webp',
        width: 1200,
        height: 630,
        alt: 'Meadow Mentor - AI Chef for Gut Health',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Meadow Mentor - AI Personal Chef for AIP, Mediterranean, GAPS, & SCD Diets',
    description:
      "The AI-powered kitchen companion for therapeutic diets. Generate custom AIP, Mediterranean, GAPS & SCD recipes, scan ingredients for safety, and automate your meal planning.",
    images: ['https://storage.googleapis.com/meadow_mentor_public_media/images/meadow_mentor_og_image_1200x630.webp'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (    
    <html lang="en">
      <body className={`${montserrat.variable} ${sourceSans.variable}`}>
        {/* 4. INJECTED SCRIPT HERE */}
        <Script
          id="org-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <CSPostHogProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <Header />
              <Box component="main" sx={{ flex: 1 }}>
                {children}
              </Box>
              <Footer />
            </Box>
          </ThemeProvider>
        </CSPostHogProvider>
      </body>
    </html>    
  );
}
