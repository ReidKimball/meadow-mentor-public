'use client';

import { Box, Container, Typography, Chip } from '@mui/material';
import CTAButton from './CTAButton';
import { motion } from 'framer-motion';
import { Sparkles, Users, Star } from 'lucide-react';

const HeroImage = 'https://storage.googleapis.com/meadow_mentor_public_media/images/meadow_mentor_product_hero_clean_v3.webp';
const KayImage = 'https://storage.googleapis.com/meadow_mentor_public_media/images/chef_kay_in_sun_v4_headerbar.webp';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' as const } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

export default function HeroSection() {
  return (
    <Box
      sx={{
        height: '100vh',
        width: '100%',
        backgroundImage: `url(${HeroImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            maxWidth: { xs: '100%', md: '520px', lg: '560px' },
            display: 'flex',
            flexDirection: 'column',
            alignItems: { xs: 'center', md: 'flex-start' },
            textAlign: { xs: 'center', md: 'left' },
            gap: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(12px)',
            borderRadius: '24px',
            p: { xs: 4, md: 5 },
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.6)',
            mx: { xs: 2, md: 0 },
          }}
        >
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            {/* Kay Mascot Badge */}
            <motion.div variants={fadeInUp}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 3,
                  py: 1.25,
                  borderRadius: '50px',
                  bgcolor: 'rgba(1, 61, 29, 0.06)',
                  border: '1px solid rgba(1, 61, 29, 0.12)',
                }}
              >
                <Box
                  component="img"
                  src={KayImage}
                  alt="Chef Kay"
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #FFBF00',
                  }}
                />
                <Typography
                  sx={{
                    color: '#013D1D',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Meet Chef Kay — Your AI Guide
                </Typography>
              </Box>
            </motion.div>

            {/* Headline */}
            <motion.div variants={fadeInUp}>
              <Typography
                variant="h1"
                sx={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  color: '#013D1D',
                  fontSize: { xs: '1.85rem', sm: '2.25rem', md: '2.5rem' },
                  lineHeight: 1.2,
                }}
              >
                AI-Powered Meal Planning for IBD, SCD, GAPS &amp; More
              </Typography>
            </motion.div>

            {/* Subheadline */}
            <motion.div variants={fadeInUp}>
              <Typography
                sx={{
                  fontFamily: 'var(--font-body)',
                  color: '#444',
                  fontSize: { xs: '1rem', md: '1.1rem' },
                  lineHeight: 1.7,
                }}
              >
                Generate personalized recipes, scan ingredient labels for compliance, 
                and build 1&#8209;14 day meal plans tailored to your therapeutic diet.
              </Typography>
            </motion.div>

            {/* Feature Pills */}
            <motion.div variants={fadeInUp}>
              <Box sx={{ py: 2, display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'center', md: 'flex-start' } }}>
                {[
                  { icon: <Sparkles size={12} />, label: 'Personalized Recipes' },
                  { icon: <Sparkles size={12} />, label: 'AI Diet Mentor' },
                  { icon: <Sparkles size={12} />, label: 'Meal Plans' },
                  { icon: <Sparkles size={12} />, label: 'Food Safety DB' },
                ].map((f) => (
                  <Chip
                    key={f.label}
                    icon={f.icon}
                    label={f.label}
                    size="small"
                    sx={{
                      bgcolor: '#FFF8E5',
                      color: '#013D1D',
                      borderRadius: '50px',
                      fontWeight: 600,
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.75rem',
                      border: '1px solid rgba(255, 191, 0, 0.3)',
                      '& .MuiChip-icon': { color: '#FFBF00', ml: 0.5 },
                    }}
                  />
                ))}
              </Box>
            </motion.div>

            {/* Social Proof Bar */}
            {/* <motion.div variants={fadeInUp}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  flexWrap: 'wrap',
                  justifyContent: { xs: 'center', md: 'flex-start' },
                  color: '#666',
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Users size={12} />
                  <span>10,000+ meals planned</span>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Star size={12} fill="#FFBF00" color="#FFBF00" />
                  <span>4.8 from 200+ reviews</span>
                </Box>
                <br />
                <br />
              </Box>
            </motion.div> */}

            {/* Dual CTAs */}
            <motion.div variants={fadeInUp}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: { xs: 'center', md: 'flex-start' }, width: '100%' }}>
                <CTAButton
                  href="/signup"
                  variant="primary"
                  size="large"
                  trackingLocation="app_hero_primary"
                >
                  Try Free — No Credit Card
                </CTAButton>
                <CTAButton
                  href="/features"
                  variant="secondary"
                  size="large"
                  trackingLocation="app_hero_secondary"
                >
                  See How It Works
                </CTAButton>
              </Box>
            </motion.div>
          </motion.div>
        </Box>
      </Container>
    </Box>
  );
}
