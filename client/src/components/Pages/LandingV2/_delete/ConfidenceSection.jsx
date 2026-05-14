import React from 'react';
import { Box, Container, Typography, Grid } from '@mui/material';
import { BookOpen, TrendingUp, Shield } from 'lucide-react';

/**
 * ConfidenceSection - "Build Your Confidence With Every Meal"
 * 
 * Purpose: Show users how to turn this into a sustainable, long-term practice
 * Features:
 * - Focus on clarity over grading/scoring
 * - Supportive, non-clinical language
 * - Visual elements showing progress and control
 */
const ConfidenceSection = () => {
  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: 'white',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 4, md: 8 }} alignItems="center">
          {/* Left side - Meal journal imagery placeholder */}
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                width: '100%',
                height: { xs: '300px', md: '400px' },
                backgroundColor: '#f5f5f5',
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed #ccc',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Typography 
                color="text.secondary" 
                sx={{ 
                  textAlign: 'center',
                  px: 2,
                  fontSize: { xs: '0.9rem', md: '1rem' },
                }}
              >
                [Placeholder: Clean, modern interface showing a meal journal with supportive feedback - no grades or scores, just clarity and insights]
              </Typography>
            </Box>
          </Grid>

          {/* Right side - Copy and features */}
          <Grid item xs={12} md={6}>
            <Typography
              variant="h2"
              sx={{
                fontSize: { xs: '2rem', md: '2.75rem' },
                fontWeight: 700,
                color: '#1a1a1a',
                mb: 3,
                lineHeight: 1.2,
              }}
            >
              Build Your Confidence With Every Meal
            </Typography>
            
            <Typography
              variant="h6"
              sx={{
                fontSize: { xs: '1.1rem', md: '1.25rem' },
                color: '#555',
                mb: 5,
                lineHeight: 1.6,
              }}
            >
              Log your meals in our simple journal. We don't give you a grade. We give you clarity. See what works for your body, discover new safe meals, and finally, start to feel in control of your diet, not judged by it.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Feature 1 - Clarity over grading */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                <Box
                  sx={{
                    backgroundColor: '#e8f5e8',
                    borderRadius: '50%',
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 60,
                    minHeight: 60,
                  }}
                >
                  <BookOpen size={28} color="#2e7d32" />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1a1a1a' }}>
                    Gentle Insights, Not Grades
                  </Typography>
                  <Typography sx={{ color: '#666', lineHeight: 1.6 }}>
                    No pass/fail scores. Just clear, supportive feedback that helps you understand which foods align with your healing journey.
                  </Typography>
                </Box>
              </Box>

              {/* Feature 2 - Pattern recognition */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                <Box
                  sx={{
                    backgroundColor: '#e3f2fd',
                    borderRadius: '50%',
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 60,
                    minHeight: 60,
                  }}
                >
                  <TrendingUp size={28} color="#1976d2" />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1a1a1a' }}>
                    Discover Your Patterns
                  </Typography>
                  <Typography sx={{ color: '#666', lineHeight: 1.6 }}>
                    Track how different foods make you feel. Identify your personal triggers and safe foods to build confidence in your choices.
                  </Typography>
                </Box>
              </Box>

              {/* Feature 3 - Control and empowerment */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                <Box
                  sx={{
                    backgroundColor: '#fff3e0',
                    borderRadius: '50%',
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 60,
                    minHeight: 60,
                  }}
                >
                  <Shield size={28} color="#f57c00" />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1a1a1a' }}>
                    Take Back Control
                  </Typography>
                  <Typography sx={{ color: '#666', lineHeight: 1.6 }}>
                    Stop feeling overwhelmed by food choices. Build a personalized database of meals that work for your body and your lifestyle.
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ConfidenceSection;
