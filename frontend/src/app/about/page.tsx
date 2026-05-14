import { Box, Container, Typography, Grid, Paper, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import Image from 'next/image';
import { Heart, Target, Users, Shield, Check, X, Sparkles } from 'lucide-react';
import FinalCTA from '@/components/FinalCTA';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Meadow Mentor | Our Mission for Gut Health',
  description: 'Empowering you to thrive with personalized, therapeutic nutrition tools and community support.',
  openGraph: {
    title: 'About Meadow Mentor | Our Mission for Gut Health',
    description: 'Empowering you to thrive with personalized, therapeutic nutrition tools and community support.',
  }
};

const founderPhoto = 'https://storage.googleapis.com/meadow_mentor_public_media/images/about_reid_kimball_profile.webp';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Meadow Mentor',
  url: 'https://meadowmentor.com',
  logo: 'https://storage.googleapis.com/meadow_mentor_public_media/images/chef_kay_in_sun_v4_sm.webp',
  description: 'Empowering you to thrive with personalized, therapeutic nutrition tools and community support.',
  founder: {
    '@type': 'Person',
    name: 'Reid Kimball'
  }
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>

        {/* Hero Section */}
        <Box
          sx={{
            background: 'linear-gradient(180deg, rgba(220, 252, 231, 0.4) 0%, #fafafa 100%)',
            pt: { xs: 8, md: 12 },
            pb: { xs: 6, md: 8 },
            textAlign: 'center'
          }}
        >
          <Container maxWidth="lg">
            <Typography
              component="h1"
              variant="h1"
              sx={{
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                fontWeight: 700,
                color: '#013D1D',
                mb: 2,
                fontFamily: 'var(--font-heading, Montserrat)',
              }}
            >
              About Meadow Mentor
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '1.25rem', md: '1.5rem' },
                color: '#525252',
                fontWeight: 400,
                maxWidth: '800px',
                mx: 'auto',
                fontFamily: 'var(--font-body, "Source Sans 3")',
              }}
            >
              Your personal guide for gut health. Thrive, one meal at a time.
            </Typography>
          </Container>
        </Box>

        {/* Founder Story Section */}
        <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#fff' }}>
          <Container maxWidth="lg">
            <Grid container spacing={{ xs: 4, md: 8 }} alignItems="center">
              {/* Photo */}
              <Grid size={{ xs: 12, md: 5 }}>
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: { xs: '300px', md: '400px' },
                    mx: 'auto',
                    aspectRatio: '1',
                    borderRadius: 4,
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(1, 61, 29, 0.15)',
                  }}
                >
                  <Image
                    src={founderPhoto}
                    alt="Reid Kimball, Founder of Meadow Mentor"
                    fill
                    style={{ objectFit: 'cover' }}
                    priority
                  />
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    textAlign: 'center',
                    mt: 2,
                    color: '#666',
                    fontStyle: 'italic'
                  }}
                >
                  Reid enjoying SCD Waffles, recipe by Meadow Mentor
                </Typography>
              </Grid>

              {/* Story */}
              <Grid size={{ xs: 12, md: 7 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Heart size={32} color="#013D1D" />
                  <Typography
                    variant="h2"
                    sx={{
                      fontSize: { xs: '1.75rem', md: '2.25rem' },
                      fontWeight: 700,
                      color: '#013D1D',
                      fontFamily: 'var(--font-heading, Montserrat)',
                    }}
                  >
                    The Founder&apos;s Story
                  </Typography>
                </Box>

                <Typography
                  variant="body1"
                  sx={{
                    fontSize: '1.1rem',
                    color: '#333',
                    lineHeight: 1.8,
                    mb: 3,
                  }}
                >
                  I&apos;ll never forget the date: <strong>February 13, 1997</strong>. I was diagnosed with Crohn&apos;s disease,
                  a debilitating inflammatory bowel disease. It was 8 years later when I started using the{' '}
                  <a
                    href="https://breakingtheviciouscycle.info"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#013D1D', fontWeight: 600 }}
                  >
                    Specific Carbohydrate Diet
                  </a>{' '}
                  (SCD) to help me manage my symptoms. Over the years, I regained much of my health thanks to the SCD.
                  I was lucky—my mother taught me everything I know about the diet.
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    fontSize: '1.1rem',
                    color: '#333',
                    lineHeight: 1.8,
                    mb: 3,
                  }}
                >
                  Studies report that patients lack the education and guidance needed to have successful outcomes on the SCD.
                  <sup style={{ fontSize: '0.75rem' }}>(1)</sup>
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    fontSize: '1.1rem',
                    color: '#333',
                    lineHeight: 1.8,
                    mb: 3,
                  }}
                >
                  <strong>I&apos;m Reid</strong>, and Meadow Mentor is your personal chef to help you thrive, one meal at a time.
                  It aims to be complementary to other resources you may use in your therapeutic diet journey—books,
                  doctors, friends, and family.
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    fontSize: '1.1rem',
                    color: '#333',
                    lineHeight: 1.8,
                    mb: 3,
                  }}
                >
                  Meadow Mentor uses advanced artificial intelligence to provide you with personalized, contextualized
                  instant information that can help you follow your therapeutic diet exactly as it&apos;s prescribed.
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.9rem',
                    color: '#666',
                    mt: 4,
                  }}
                >
                  (1){' '}
                  <a
                    href="https://pmc.ncbi.nlm.nih.gov/articles/PMC10158462/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#013D1D' }}
                  >
                    Perspectives on Specific Carbohydrate Diet Education from Inflammatory Bowel Disease Patients and Caregivers: A Needs Assessment
                  </a>
                </Typography>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Vision & Mission Section */}
        <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#fafafa' }}>
          <Container maxWidth="lg">
            <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3 }}>
                <Target size={32} color="#013D1D" />
                <Typography
                  variant="h2"
                  sx={{
                    fontSize: { xs: '1.75rem', md: '2.25rem' },
                    fontWeight: 700,
                    color: '#013D1D',
                    fontFamily: 'var(--font-heading, Montserrat)',
                  }}
                >
                  Our Vision & Mission
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{
                  fontSize: '1.1rem',
                  color: '#525252',
                  maxWidth: '800px',
                  mx: 'auto',
                }}
              >
                We&apos;re building the future of personalized gut health management.
              </Typography>
            </Box>

            <Grid container spacing={4}>
              {/* Vision Card */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    height: '100%',
                    borderRadius: 4,
                    border: '1px solid #e5e5e5',
                    bgcolor: '#fff',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Sparkles size={28} color="#FFBF00" />
                    <Typography
                      variant="h3"
                      sx={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: '#013D1D',
                      }}
                    >
                      Our Vision
                    </Typography>
                  </Box>
                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: '1.05rem',
                      color: '#333',
                      lineHeight: 1.8,
                    }}
                  >
                    A world where digestive health is navigated with clarity, confidence, and data-driven precision.
                  </Typography>
                </Paper>
              </Grid>

              {/* Mission Card */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    height: '100%',
                    borderRadius: 4,
                    border: '1px solid #e5e5e5',
                    bgcolor: '#fff',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Shield size={28} color="#FFBF00" />
                    <Typography
                      variant="h3"
                      sx={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: '#013D1D',
                      }}
                    >
                      Our Mission
                    </Typography>
                  </Box>
                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: '1.05rem',
                      color: '#333',
                      lineHeight: 1.8,
                    }}
                  >
                    To empower people with GI conditions to thrive by translating complex personal health data into simple, secure, and actionable culinary guidance.
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Therapeutic Diets Section */}
        <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#fff' }}>
          <Container maxWidth="lg">
            <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3 }}>
                <Users size={32} color="#013D1D" />
                <Typography
                  variant="h2"
                  sx={{
                    fontSize: { xs: '1.75rem', md: '2.25rem' },
                    fontWeight: 700,
                    color: '#013D1D',
                    fontFamily: 'var(--font-heading, Montserrat)',
                  }}
                >
                  Understanding Therapeutic Diets
                </Typography>
              </Box>
              <Typography
                variant="body1"
                sx={{
                  fontSize: '1.1rem',
                  color: '#525252',
                  maxWidth: '800px',
                  mx: 'auto',
                }}
              >
                Therapeutic diets like SCD and Mediterranean are evidence-based nutritional approaches designed to help
                manage gastrointestinal conditions and promote healing.
              </Typography>
            </Box>

            {/* What They Do */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 5 },
                mb: 4,
                borderRadius: 4,
                border: '2px solid #DCFCE7',
                bgcolor: 'rgba(220, 252, 231, 0.2)',
              }}
            >
              <Typography
                variant="h3"
                sx={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: '#013D1D',
                  mb: 3,
                }}
              >
                The Functional Benefits
              </Typography>
              <Grid container spacing={3}>
                {[
                  {
                    title: 'Improve Symptoms',
                    description: 'Reduce bloating, cramping, diarrhea, and other digestive discomforts by eliminating trigger foods.',
                  },
                  {
                    title: 'Reduce Inflammation',
                    description: 'Remove foods that can irritate the gut lining and contribute to chronic inflammation.',
                  },
                  {
                    title: 'Aid Mucosal Healing',
                    description: 'Support the repair of the intestinal lining through easily digestible, nutrient-dense foods.',
                  },
                  {
                    title: 'Diversify Microbiome',
                    description: 'Promote beneficial gut bacteria while starving harmful bacteria that thrive on certain carbohydrates.',
                  },
                ].map((benefit, index) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={index}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Check size={24} color="#013D1D" style={{ flexShrink: 0, marginTop: 4 }} />
                      <Box>
                        <Typography
                          variant="h4"
                          sx={{
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            color: '#013D1D',
                            mb: 0.5,
                          }}
                        >
                          {benefit.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#525252',
                            lineHeight: 1.6,
                          }}
                        >
                          {benefit.description}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>

            {/* What's Included / Not Included */}
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    height: '100%',
                    borderRadius: 4,
                    border: '1px solid #e5e5e5',
                    bgcolor: '#fff',
                  }}
                >
                  <Typography
                    variant="h3"
                    sx={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: '#013D1D',
                      mb: 2,
                    }}
                  >
                    What Therapeutic Diets Include
                  </Typography>
                  <List dense>
                    {[
                      'Fresh meats, fish, and poultry',
                      'Vegetables and fruits',
                      'Fermented foods with probiotics',
                      'Healthy fats and oils (olive oil, coconut oil)',
                      'Bone broth and nutrient-dense foods',
                    ].map((item, index) => (
                      <ListItem key={index} disableGutters sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <Check size={18} color="#013D1D" />
                        </ListItemIcon>
                        <ListItemText
                          primary={item}
                          primaryTypographyProps={{
                            color: '#333',
                            fontSize: '0.95rem'
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    height: '100%',
                    borderRadius: 4,
                    border: '1px solid #e5e5e5',
                    bgcolor: '#fff',
                  }}
                >
                  <Typography
                    variant="h3"
                    sx={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: '#740D06',
                      mb: 2,
                    }}
                  >
                    What Therapeutic Diets Avoid
                  </Typography>
                  <List dense>
                    {[
                      'Refined sugars and sweeteners',
                      'Processed and packaged foods',
                      'Artificial additives and preservatives',
                      'Industrial seed oils (canola, soybean)',
                      'Highly processed grains',
                    ].map((item, index) => (
                      <ListItem key={index} disableGutters sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <X size={18} color="#740D06" />
                        </ListItemIcon>
                        <ListItemText
                          primary={item}
                          primaryTypographyProps={{
                            color: '#333',
                            fontSize: '0.95rem'
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>
            </Grid>

            {/* The Goal */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 5 },
                mt: 4,
                borderRadius: 4,
                bgcolor: '#013D1D',
                textAlign: 'center',
              }}
            >
              <Typography
                variant="h3"
                sx={{
                  fontSize: { xs: '1.5rem', md: '1.75rem' },
                  fontWeight: 700,
                  color: '#FFFFFF',
                  mb: 2,
                }}
              >
                The End Goal: Heal, Achieve Remission, Enjoy a Wider Diet
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontSize: '1.1rem',
                  color: '#DCFCE7',
                  maxWidth: '800px',
                  mx: 'auto',
                  lineHeight: 1.8,
                }}
              >
                Therapeutic diets aren&apos;t meant to be forever. The goal is to heal your gut, reduce inflammation,
                and achieve remission. As your body heals, many people are able to gradually reintroduce foods
                and enjoy a wider, more varied diet while maintaining their health gains.
              </Typography>
            </Paper>
          </Container>
        </Box>

        {/* CTA Section */}
        <FinalCTA />
      </Box>
    </>
  );
}
