'use client';

import { useState } from 'react';
import { Box, Container, Typography, Tooltip, useTheme, useMediaQuery } from '@mui/material';
import Image from 'next/image';
import CTAButton from './CTAButton';

/**
 * WhoIsThisForSection - Interactive section showing conditions and diets
 * 
 * Features:
 * - Interactive digestive tract with hoverable condition dots
 * - Animated frying pan that cycles through diets
 * - Accessible keyboard navigation
 */

interface Condition {
  id: string;
  name: string;
  description: string;
}

const conditions: Condition[] = [
  { id: 'crohns', name: "Crohn's Disease", description: 'Inflammatory bowel disease affecting any part of the digestive tract' },
  { id: 'colitis', name: 'Ulcerative Colitis', description: 'Inflammatory bowel disease affecting the colon' },
  { id: 'ibs', name: 'Irritable Bowel Syndrome (IBS)', description: 'Chronic condition affecting the large intestine' },
  { id: 'celiac', name: 'Celiac Disease', description: 'Autoimmune disorder triggered by gluten' },
  { id: 'gerd', name: 'GERD & Acid Reflux', description: 'Chronic digestive condition affecting the esophagus' },
  { id: 'sibo', name: 'SIBO', description: 'Small Intestinal Bacterial Overgrowth' },
  { id: 'diverticulitis', name: 'Diverticulitis', description: 'Inflammation of digestive tract pouches' },
  { id: 'gastritis', name: 'Gastritis', description: 'Inflammation of the stomach lining' },
];

const diets = [
  'Specific Carbohydrate Diet (SCD)',
  'GAPS Protocol',
  'Paleo Autoimmune Protocol (AIP)',
  'Low-Residue Diet',
  'Mediterranean Diet',
];

export default function WhoIsThisForSection() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [currentDietIndex, setCurrentDietIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [activeConditionId, setActiveConditionId] = useState<string | null>(null);
  const handlePanClick = () => {
    if (isFlipping) return;

    setIsFlipping(true);
    setTimeout(() => {
      setCurrentDietIndex((prev) => (prev + 1) % diets.length);
      setIsFlipping(false);
    }, 600);
  };

  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: '#fafafa',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle background pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.03,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23013D1D" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative' }}>
        {/* Headline */}
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '2rem', md: '2.75rem' },
              fontWeight: 700,
              color: '#1a1a1a',
              mb: 2,
              lineHeight: 1.2,
            }}
          >
            Managing a Digestive Condition?
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontSize: { xs: '1.1rem', md: '1.25rem' },
              color: '#555',
              lineHeight: 1.6,
              maxWidth: '800px',
              mx: 'auto',
            }}
          >
            Meadow Mentor helps people with IBD, IBS, Celiac, and other digestive conditions confidently navigate therapeutic diets.
          </Typography>
        </Box>

        {/* Conditions Section */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 6, md: 8 },
            mb: { xs: 8, md: 10 },
            alignItems: 'center',
          }}
        >
          {/* Digestive Tract SVG */}
          <Box
            sx={{
              flex: { md: '0 0 40%' },
              display: 'flex',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                position: 'relative',
                width: { xs: '250px', md: '300px' },
                height: { xs: '500px', md: '600px' },
              }}
            >
              {/* Digestive tract image */}
              <Image
                src="https://storage.googleapis.com/meadow_mentor_public_media/images/gastro_intestinal_track_v4.webp"
                alt="Digestive system diagram showing conditions we support"
                fill
                style={{ objectFit: 'contain' }}
                priority
              />

              {/* Interactive dots with tooltips */}
              {[
                { id: 'gerd', top: '17%', left: '51%' },
                { id: 'gastritis', top: '39%', left: '50%' },
                { id: 'ibs', top: '46%', left: '63%' },
                { id: 'sibo', top: '64%', left: '50%' },
                { id: 'celiac', top: '53%', left: '40%' },
                { id: 'colitis', top: '59%', left: '91%' },
                { id: 'diverticulitis', top: '75%', left: '75%' },
                { id: 'crohns', top: '68%', left: '18%' },
              ].map((dot) => {
                const condition = conditions.find((c) => c.id === dot.id);
                const isActive = activeConditionId === dot.id;

                return (
                  <Tooltip
                    key={dot.id}
                    open={isActive}
                    componentsProps={{
                      tooltip: {
                        sx: {
                          backgroundColor: '#013D1D',
                          color: '#FFFFFF',
                          fontSize: '0.9rem',
                        },
                      },
                      arrow: {
                        sx: {
                          color: '#013D1D',
                        },
                      },
                    }}
                    title={
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: '#FFFFFF' }}>
                          {condition?.name}
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#FFFFFF' }}>
                          {condition?.description}
                        </Typography>
                      </Box>
                    }
                    arrow
                    placement={isMobile ? 'bottom' : 'right'}
                  >
                    <Box
                      onMouseEnter={() => setActiveConditionId(dot.id)}
                      onMouseLeave={() => setActiveConditionId(null)}
                      sx={{
                        position: 'absolute',
                        top: dot.top,
                        left: dot.left,
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: '#FFBF00',
                        transform: isActive ? 'translate(-50%, -50%) scale(1.3)' : 'translate(-50%, -50%)',
                        filter: isActive ? 'drop-shadow(0 0 8px rgba(255, 191, 0, 0.8))' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        zIndex: isActive ? 10 : 1,
                      }}
                    />
                  </Tooltip>
                );
              })}
            </Box>
          </Box>

          {/* Conditions List */}
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: '#1a1a1a',
                mb: 3,
              }}
            >
              We support people managing:
            </Typography>
            <Box
              component="ul"
              sx={{
                listStyle: 'none',
                p: 0,
                m: 0,
                '& li': {
                  position: 'relative',
                  pl: 3,
                  py: 1,
                  fontSize: '1.05rem',
                  color: '#333',
                  '&:before': {
                    content: '"•"',
                    position: 'absolute',
                    left: 0,
                    color: '#FFBF00',
                    fontWeight: 'bold',
                    fontSize: '1.5rem',
                  },
                },
              }}
            >
              {conditions.map((condition) => (
                <li
                  key={condition.id}
                  onMouseEnter={() => setActiveConditionId(condition.id)}
                  onMouseLeave={() => setActiveConditionId(null)}
                  style={{
                    cursor: 'pointer',
                    color: activeConditionId === condition.id ? '#013D1D' : '#333',
                    fontWeight: activeConditionId === condition.id ? 600 : 400,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {condition.name}
                </li>
              ))}
            </Box>
          </Box>
        </Box>

        {/* Diets Section */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: '#1a1a1a',
              mb: 4,
            }}
          >
            Through evidence-based therapeutic diets:
          </Typography>

          {/* Frying Pan Animation */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
            }}
          >
            {/* Diet Name Display */}
            <Typography
              variant="h4"
              sx={{
                fontSize: { xs: '1.5rem', md: '2rem' },
                fontWeight: 700,
                color: '#013D1D',
                minHeight: '60px',
                display: 'flex',
                alignItems: 'center',
                transition: 'opacity 0.3s ease',
                opacity: isFlipping ? 0 : 1,
              }}
            >
              {diets[currentDietIndex]}
            </Typography>

            {/* Frying Pan (Placeholder - you'll add actual images) */}
            <Box
              onClick={handlePanClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handlePanClick();
                }
              }}
              tabIndex={0}
              role="button"
              aria-label="Click to see next diet"
              sx={{
                width: { xs: '280px', md: '400px' },
                height: { xs: '210px', md: '300px' },
                position: 'relative',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'scale(1.05)',
                },
                '&:focus': {
                  outline: '3px solid #FFBF00',
                  outlineOffset: '4px',
                },
                transition: 'transform 0.3s ease',
              }}
            >
              {/* Frying pan with vegetables */}
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: isFlipping ? 'tilt-pan 0.8s ease-in-out' : 'none',
                  transformOrigin: '70% 50%', // Rotate around handle (right side)
                  '@keyframes tilt-pan': {
                    '0%': {
                      transform: 'rotate(0deg)',
                    },
                    '25%': {
                      transform: 'rotate(-8deg)', // Tilt down
                    },
                    '75%': {
                      transform: 'rotate(8deg)', // Tilt up
                    },
                    '100%': {
                      transform: 'rotate(0deg)', // Back to original
                    },
                  },
                }}
              >
                {/* Frying pan background image */}
                <Image
                  src="https://storage.googleapis.com/meadow_mentor_public_media/images/frying_pan_transparent.webp"
                  alt="Frying pan"
                  fill
                  style={{ objectFit: 'contain' }}
                  priority
                />

                {/* Individual Veggies with staggered bounce animations */}
                <Box
                  sx={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    gap: { xs: 1, md: 1.5 },
                    fontSize: { xs: '3rem', md: '3.5rem' },
                    alignItems: 'flex-end',
                    transform: 'translateY(-10px)', // Move all veggies up slightly to sit in pan
                    marginLeft: { xs: '-20px', md: '-30px' }, // Shift left to center in pan dish
                  }}
                >
                  {/* Carrot - bounces highest and fastest */}
                  <Box
                    sx={{
                      display: 'inline-block',
                      position: 'relative',
                      top: '-20px', // Static position
                      animation: isFlipping ? 'bounce-carrot 0.6s ease-in-out' : 'none',
                      '@keyframes bounce-carrot': {
                        '0%, 100%': {
                          transform: 'translateY(0)',
                        },
                        '50%': {
                          transform: 'translateY(-40px)',
                        },
                      },
                    }}
                  >
                    🥕
                  </Box>

                  {/* Broccoli - lowest bounce, most delayed */}
                  <Box
                    sx={{
                      display: 'inline-block',
                      position: 'relative',
                      left: '30px', // Static position
                      animation: isFlipping ? 'bounce-broccoli 0.8s ease-in-out 0.2s' : 'none',
                      '@keyframes bounce-broccoli': {
                        '0%, 100%': {
                          transform: 'translateY(0)',
                        },
                        '50%': {
                          transform: 'translateY(-20px)',
                        },
                      },
                    }}
                  >
                    🥦
                  </Box>

                  {/* Bell pepper - medium bounce, second */}
                  <Box
                    sx={{
                      display: 'inline-block',
                      position: 'relative',
                      top: '10px', // Static position
                      left: '-120px', // Static position
                      animation: isFlipping ? 'bounce-pepper 0.7s ease-in-out 0.1s' : 'none',
                      '@keyframes bounce-pepper': {
                        '0%, 100%': {
                          transform: 'translateY(0)',
                        },
                        '50%': {
                          transform: 'translateY(-30px)',
                        },
                      },
                    }}
                  >
                    🫑
                  </Box>
                </Box>
              </Box>
            </Box>

            <Typography
              sx={{
                fontSize: '0.875rem',
                color: '#666',
                fontStyle: 'italic',
              }}
            >
              {currentDietIndex + 1} of {diets.length}
            </Typography>
          </Box>
        </Box>

        {/* CTA */}
        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Typography
            sx={{
              fontSize: { xs: '1rem', md: '1.1rem' },
              color: '#555',
              mb: 3,
              lineHeight: 1.6,
            }}
          >
            Whether you&apos;re just starting a therapeutic diet or looking for better tools to stick with it,
            <br />
            <strong>Meadow Mentor is your personal guide for gut health.</strong>
          </Typography>

          <CTAButton
            href="/diets"
            trackingLocation="who_is_this_for"
          >
            Explore All Therapeutic Diets
          </CTAButton>
        </Box>
      </Container>
    </Box>
  );
}
