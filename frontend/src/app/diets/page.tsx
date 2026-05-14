import React from 'react';
import { Box, Container, Typography, Grid, Link as MuiLink, Button, Card, CardContent } from '@mui/material';
import { Metadata } from 'next';
import Link from 'next/link';
import CTAButton from '@/components/CTAButton';
import {
  RestaurantMenu,
  Healing,
  Explore,
  Warning,
  Psychology,
  AutoAwesome,
  Security,
  Opacity,
  ShoppingCart
} from '@mui/icons-material';

export const metadata: Metadata = {
  title: 'What is a Therapeutic Diet?',
  description: 'Learn about therapeutic diets like SCD, AIP, and Low-FODMAP. Discover how they work to manage conditions like IBD, IBS, and Celiac Disease.',
  openGraph: {
    title: 'What is a Therapeutic Diet?',
    description: 'Learn about therapeutic diets like SCD, AIP, and Low-FODMAP. Discover how they work to manage conditions like IBD, IBS, and Celiac Disease.',
    type: 'article',
  },
};

export default function DietsPage() {
  const heroImage = 'https://storage.googleapis.com/meadow_mentor_public_media/images/meadow_mentor_product_hero_clean_v3.webp';

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Therapeutic Diets for Gut Health: Mediterranean, SCD, GAPS, and AIP Guide",
    "description": "A comprehensive guide to therapeutic diets like Mediterranean, SCD, GAPS, and AIP for managing IBD, IBS, and Celiac disease.",
    "publisher": {
      "@id": "https://meadowmentor.com/#organization" // Links back to your Brand
    },
    "about": [
      {
        "@type": "Diet",
        "name": "Specific Carbohydrate Diet (SCD)",
        "description": "A restrictive diet that removes complex carbohydrates (disaccharides and polysaccharides) to starve harmful gut bacteria.",
        "dietFeatures": "Grain-free, sugar-free, starch-free, lactose-free. Homemade 24 hour yogurt is an essential part of the diet.",
        "expertConsiderations": "Often used for Crohn's Disease, Ulcerative Colitis, and Celiac Disease.",
        "endorsers": {
          "@type": "Organization",
          "name": "Breaking the Vicious Cycle"
        }
      },
      {
        "@type": "Diet",
        "name": "Gut and Psychology Syndrome (GAPS)",
        "description": "A comprehensive healing protocol focusing on bone broth, fermentation, and gut lining repair.",
        "dietFeatures": "Bone broth, fermented foods, grain-free, starch-free. Homemade 24 hour yogurt is an essential part of the diet."
      },
      {
        "@type": "Diet",
        "name": "Autoimmune Protocol (AIP)",
        "description": "A strict elimination diet designed to reset the immune system by removing inflammatory triggers.",
        "dietFeatures": "No nightshades, nuts, seeds, eggs, or dairy. Includes bone broth and fermented foods."
      },
      {
        "@type": "Diet",
        "name": "Mediterranean Diet",
        "description": "A heart-healthy diet rich in fruits, vegetables, whole grains, and healthy fats.",
        "dietFeatures": "Rich in fruits, vegetables, whole grains, and healthy fats. Minimizes processed foods and added sugars."
      }
    ],
    "mainEntity": [{
      "@type": "Question",
      "name": "What is a therapeutic diet?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A therapeutic diet is a nutrition plan designed to manage specific medical conditions like IBD or IBS. Unlike weight-loss diets, protocols like SCD or AIP focus on removing inflammatory triggers to heal the gut."
      }
    }, {
      "@type": "Question",
      "name": "What are examples of therapeutic diets for gut health?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Common therapeutic diets include the Specific Carbohydrate Diet (SCD) for Crohn's/Colitis, the Autoimmune Protocol (AIP) for inflammation, and the Low-FODMAP diet for IBS management."
      }
    }, {
      "@type": "Question",
      "name": "How does Meadow Mentor help with therapeutic diets?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Meadow Mentor automates the complex rules of diets like SCD and AIP. It generates safe, personalized meal plans and recipes based on your specific condition and flare status."
      }
    }]
  };

  const diets = [
    {
      title: 'Specific Carbohydrate Diet (SCD)',
      href: '/diets/scd-diet-app',
      desc: 'A grain-free, lactose-free, and sugar-free protocol often used for Crohn\'s and Colitis.',
      icon: <RestaurantMenu color="primary" />,
      color: '#013D1D'
    },
    {
      title: 'Autoimmune Protocol (AIP)',
      href: '/diets/aip-diet-app',
      desc: 'An elimination diet designed to calm the immune system by removing nightshades, nuts, and seeds.',
      icon: <Healing color="primary" />,
      color: '#013D1D'
    },
    {
      title: 'GAPS Diet',
      href: '/diets/gaps-diet-app',
      desc: 'Focuses on gut lining repair using bone broths and fermented foods for gut-brain healing.',
      icon: <Psychology color="primary" />,
      color: '#013D1D'
    },
    {
      title: 'Mediterranean Diet',
      href: '/diets/mediterranean-diet-app',
      desc: 'A dietary pattern high in healthy fats and plant-based foods that reduces systemic inflammation.',
      icon: <Explore color="primary" />,
      color: '#013D1D'
    },
    {
      title: 'Low-FODMAP (Coming Soon)',
      href: '#',
      desc: 'A temporary restriction diet ideal for managing IBS bloating and gas by identifying carb triggers.',
      icon: <Warning color="disabled" />,
      color: '#666',
      disabled: true
    }
  ];

  const comparisonData = [
    {
      diet: 'SCD',
      bestFor: "Crohn's, Colitis",
      restrictions: 'No grains, sugars, processed foods',
      healing: '✅ Restricts complex carbs to starve harmful bacteria'
    },
    {
      diet: 'GAPS',
      bestFor: 'Gut Healing, Dysbiosis',
      restrictions: 'No starch, focus on broth/ferments',
      healing: '✅ Heals "leaky gut" with bone broth & probiotics'
    },
    {
      diet: 'AIP',
      bestFor: 'Autoimmune Conditions',
      restrictions: 'No nightshades, nuts, seeds, eggs',
      healing: '✅ Calms immune system by removing triggers'
    },
    {
      diet: 'Mediterranean',
      bestFor: 'Heart Health, Longevity',
      restrictions: 'Limits processed foods, added sugars',
      healing: '✅ Reduces inflammation with whole plant foods'
    }
  ];

  return (
    <Box sx={{ bgcolor: '#fafafa', minHeight: '100vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 1. Hero Section */}
      <Box
        sx={{
          minHeight: '60vh',
          width: '100%',
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          mb: 8
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              maxWidth: { xs: '100%', md: '700px' },
              bgcolor: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(12px)',
              borderRadius: 4,
              p: { xs: 4, md: 6 },
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            }}
          >
            <Typography
              variant="h1"
              sx={{
                fontWeight: 800,
                color: '#013D1D',
                fontFamily: 'var(--font-heading, Montserrat)',
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                lineHeight: 1.2,
                mb: 2,
              }}
            >
              Therapeutic Diets. <br />
              <Box component="span" sx={{ color: '#FFBF00' }}>Healed by AI.</Box>
            </Typography>

            <Typography
              variant="h5"
              sx={{
                color: '#444',
                fontFamily: 'var(--font-body, "Source Sans 3")',
                fontSize: { xs: '1.1rem', md: '1.25rem' },
                lineHeight: 1.6,
                mb: 4,
              }}
            >
              Stop guessing. Start thriving. Whether it&apos;s SCD, AIP, or GAPS, Meadow Mentor turns complex medical protocols into simple, delicious daily meal plans.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'stretch', sm: 'flex-start' }, gap: 2 }}>
              <CTAButton size="large" fullWidth={false}>
                Find My Healing Protocol
              </CTAButton>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* 1.5 Diet Comparison (Responsive: Table for Desktop, Cards for Mobile) */}
      <Container maxWidth="lg" sx={{ mb: 12 }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ color: '#013D1D', fontWeight: 700, mb: 1, fontFamily: 'var(--font-heading, Montserrat)' }}>
            Compare Protocols
          </Typography>
          <Typography sx={{ color: '#666' }}>Find the right approach for your unique health journey.</Typography>
        </Box>

        {/* Desktop Table View (md and up) */}
        <Box
          sx={{
            display: { xs: 'none', md: 'block' },
            overflowX: 'hidden',
            borderRadius: 4,
            boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
            border: '1px solid rgba(1, 61, 29, 0.1)',
            bgcolor: '#fff'
          }}
        >
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <Box component="tr" sx={{ bgcolor: '#DCFCE7' }}>
                {['Diet', 'Best For', 'Key Restrictions', 'Key Healing Approach'].map((head: string) => (
                  <Box
                    component="th"
                    key={head}
                    sx={{
                      p: 3,
                      textAlign: 'left',
                      color: '#013D1D',
                      fontFamily: 'var(--font-heading, Montserrat)',
                      fontWeight: 700,
                      borderBottom: '2px solid rgba(1, 61, 29, 0.1)'
                    }}
                  >
                    {head}
                  </Box>
                ))}
              </Box>
            </thead>
            <tbody>
              {comparisonData.map((row: any, idx: number) => (
                <Box
                  component="tr"
                  key={idx}
                  sx={{
                    '&:hover': { bgcolor: 'rgba(220, 252, 231, 0.3)' },
                    transition: 'background-color 0.2s',
                    borderBottom: idx === comparisonData.length - 1 ? 'none' : '1px solid rgba(1, 61, 29, 0.05)'
                  }}
                >
                  <Box component="td" sx={{ p: 3, fontWeight: 700, color: '#013D1D', fontFamily: 'var(--font-heading, Montserrat)' }}>{row.diet}</Box>
                  <Box component="td" sx={{ p: 3, color: '#444', fontFamily: 'var(--font-body, "Source Sans 3")' }}>{row.bestFor}</Box>
                  <Box component="td" sx={{ p: 3, color: '#444', fontFamily: 'var(--font-body, "Source Sans 3")' }}>{row.restrictions}</Box>
                  <Box component="td" sx={{ p: 3, color: '#013D1D', fontWeight: 600, fontFamily: 'var(--font-body, "Source Sans 3")' }}>{row.healing}</Box>
                </Box>
              ))}
            </tbody>
          </Box>
        </Box>

        {/* Mobile Card View (xs to sm) */}
        <Grid container spacing={2} sx={{ display: { xs: 'flex', md: 'none' } }}>
          {comparisonData.map((row: any, idx: number) => (
            <Grid size={{ xs: 12, sm: 6 }} key={idx}>
              <Card
                sx={{
                  borderRadius: 4,
                  boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                  border: '1px solid rgba(1, 61, 29, 0.08)',
                  height: '100%'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" sx={{ color: '#013D1D', fontWeight: 700, mb: 2, fontFamily: 'var(--font-heading, Montserrat)', borderBottom: '2px solid #FFBF00', pb: 1, display: 'inline-block' }}>
                    {row.diet}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ color: '#888', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1 }}>Best For</Typography>
                    <Typography sx={{ color: '#333', fontWeight: 500 }}>{row.bestFor}</Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ color: '#888', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1 }}>Key Restrictions</Typography>
                    <Typography sx={{ color: '#666', fontSize: '0.95rem' }}>{row.restrictions}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: '#888', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1 }}>Healing Approach</Typography>
                    <Typography sx={{ color: '#013D1D', fontWeight: 600, fontSize: '0.95rem' }}>{row.healing}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* 2. Definition Section */}
      <Container maxWidth="md" sx={{ mb: 12 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              color: '#013D1D',
              fontFamily: 'var(--font-heading, Montserrat)',
              mb: 3
            }}
          >
            What is a Therapeutic Diet?
          </Typography>
          <Typography
            sx={{
              fontSize: '1.25rem',
              color: '#555',
              lineHeight: 1.8,
              fontStyle: 'italic'
            }}
          >
            &quot;A therapeutic diet is a nutrition plan designed to manage specific medical conditions like IBD, IBS, or Celiac Disease.&quot;
          </Typography>
        </Box>

        <Box sx={{ bgcolor: '#fff', borderRadius: 4, p: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', borderLeft: '6px solid #013D1D' }}>
          <Typography paragraph sx={{ mb: 2, lineHeight: 1.8, color: '#333', fontSize: '1.1rem' }}>
            Unlike weight-loss fads, therapeutic protocols focus on <strong>removing inflammatory food triggers</strong> to reduce symptoms and support long-term gut healing. They replace irritation with nourishment by swapping difficult-to-digest ingredients for nutrient-dense whole foods.
          </Typography>
          <Typography sx={{ lineHeight: 1.8, color: '#333', fontSize: '1.1rem' }}>
            The goal isn&apos;t just to eat healthy; it&apos;s to eat <strong>safely</strong>.
          </Typography>
        </Box>
      </Container>

      {/* 3. The Diet Grid */}
      <Box sx={{ py: 10, bgcolor: '#e8f5e9' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 700,
                color: '#013D1D',
                fontFamily: 'var(--font-heading, Montserrat)',
                mb: 2
              }}
            >
              Which Diet is Right for You?
            </Typography>
            <Typography variant="h6" sx={{ color: '#444', fontWeight: 400 }}>
              Select a protocol to see how Meadow Mentor automates the journey.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {diets.map((diet, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                <Link href={diet.href} passHref style={{ textDecoration: 'none' }}>
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: 4,
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      cursor: diet.disabled ? 'default' : 'pointer',
                      '&:hover': !diet.disabled ? {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 30px rgba(0,0,0,0.1)'
                      } : {},
                      opacity: diet.disabled ? 0.7 : 1,
                      border: '1px solid rgba(0,0,0,0.05)'
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ bgcolor: '#f0f4f0', p: 1, borderRadius: 2 }}>
                          {diet.icon}
                        </Box>
                        <Typography variant="h6" sx={{ color: diet.color, fontWeight: 700, lineHeight: 1.2 }}>
                          {diet.title}
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.6 }}>
                        {diet.desc}
                      </Typography>
                    </CardContent>
                  </Card>
                </Link>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 4. The Challenge (Empathy) */}
      <Box sx={{ py: 12, bgcolor: '#fff' }}>
        <Container maxWidth="md">
          <Typography
            variant="h2"
            align="center"
            sx={{
              fontWeight: 700,
              color: '#013D1D',
              fontFamily: 'var(--font-heading, Montserrat)',
              mb: 8,
            }}
          >
            The Challenge: &quot;Pantry Panic&quot;
          </Typography>

          <Grid container spacing={4}>
            {[
              { icon: <Warning sx={{ fontSize: 40, color: '#FFBF00' }} />, title: "Confusion", desc: '"Is this store-bought tomato sauce legal?"' },
              { icon: <Opacity sx={{ fontSize: 40, color: '#FFBF00' }} />, title: "Exhaustion", desc: "Cooking 3 meals from scratch while feeling sick." },
              { icon: <Security sx={{ fontSize: 40, color: '#FFBF00' }} />, title: "Isolation", desc: "Feeling like you can never eat with family again." }
            ].map((item, index) => (
              <Grid size={{ xs: 12, md: 4 }} key={index}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ mb: 2 }}>{item.icon}</Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#013D1D' }}>{item.title}</Typography>
                  <Typography variant="body1" sx={{ color: '#666' }}>{item.desc}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 5. The Solution (Meadow Mentor Features) */}
      <Box sx={{ py: 12, bgcolor: '#013D1D', color: '#fff' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            align="center"
            sx={{
              fontWeight: 700,
              fontFamily: 'var(--font-heading, Montserrat)',
              mb: 8,
            }}
          >
            Your Kitchen. Decoded.
          </Typography>

          <Grid container spacing={6}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <AutoAwesome sx={{ fontSize: 60, mb: 3, color: '#4ade80' }} />
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Instant Safety Check</Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>
                  Our AI cross-references every recipe against the rules of your diet (e.g., &quot;SCD + Nut Free&quot;) to ensure every bite is safe.
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Opacity sx={{ fontSize: 60, mb: 3, color: '#4ade80' }} />
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Flare-Friendly Mode</Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>
                  Having a bad week? Toggle on <strong>&quot;In Flare&quot;</strong> to instantly adjust your meal plan for easy digestion and soft textures.
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <ShoppingCart sx={{ fontSize: 60, mb: 3, color: '#4ade80' }} />
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>One-Click Shopping</Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>
                  Turn your safe meal plan into an organized grocery list in one click. No more standing in aisles reading labels for hours.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 6. Final CTA */}
      <Box sx={{ py: { xs: 8, md: 12 }, textAlign: 'center', bgcolor: '#fafafa' }}>
        <Container maxWidth="md">
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              color: '#013D1D',
              fontFamily: 'var(--font-heading, Montserrat)',
              fontSize: { xs: '2.25rem', md: '3.75rem' },
              mb: 4,
            }}
          >
            Start Thriving Today.
          </Typography>
          <Typography variant="h6" sx={{ mb: 6, color: '#555', maxWidth: '600px', mx: 'auto' }}>
            Stop asking &quot;Can I eat this?&quot; and start asking &quot;What do I want to eat?&quot;
          </Typography>
          <CTAButton size="large">
            Generate My Free Healing Plan
          </CTAButton>
        </Container>
      </Box>
    </Box>
  );
}
