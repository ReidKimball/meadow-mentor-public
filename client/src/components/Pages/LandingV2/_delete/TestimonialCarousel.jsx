import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Card, CardContent, Avatar } from '@mui/material';
import { Quote } from 'lucide-react';

/**
 * TestimonialCarousel - Flexible testimonial component
 * 
 * Features:
 * - Easily movable between sections
 * - Auto-rotating testimonials
 * - Placeholder for future database integration
 * - Clean, trust-building design
 */
const TestimonialCarousel = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Placeholder testimonials - will be replaced with database integration
  const testimonials = [
    {
      id: 1,
      name: "Sarah M.",
      condition: "Crohn's Disease",
      text: "Finally, an app that understands what I'm going through. The ingredient checker has saved me from so many painful flare-ups.",
      avatar: "SM"
    },
    {
      id: 2,
      name: "Michael R.",
      condition: "Ulcerative Colitis",
      text: "I went from eating the same 5 foods every day to actually enjoying meals again. The recipe suggestions are incredible.",
      avatar: "MR"
    },
    {
      id: 3,
      name: "Jennifer L.",
      condition: "IBS",
      text: "The meal journal helped me identify trigger foods I never would have noticed. I feel in control of my diet for the first time.",
      avatar: "JL"
    }
  ];

  // Auto-rotate testimonials every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const currentTestimonialData = testimonials[currentTestimonial];

  return (
    <Box
      sx={{
        py: { xs: 6, md: 8 },
        backgroundColor: '#f8f9fa',
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontSize: { xs: '1.5rem', md: '2rem' },
              fontWeight: 600,
              color: '#1a1a1a',
              mb: 2,
            }}
          >
            Real Stories from Real People
          </Typography>
          <Typography
            sx={{
              color: '#666',
              fontSize: { xs: '0.9rem', md: '1rem' },
            }}
          >
            Join thousands who've found relief and confidence in their therapeutic diet journey
          </Typography>
        </Box>

        <Card
          elevation={0}
          sx={{
            backgroundColor: 'white',
            borderRadius: 3,
            border: '1px solid #e0e0e0',
            position: 'relative',
            overflow: 'visible',
          }}
        >
          {/* Quote icon */}
          <Box
            sx={{
              position: 'absolute',
              top: -15,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#1976d2',
              borderRadius: '50%',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Quote size={24} color="white" />
          </Box>

          <CardContent sx={{ pt: 5, pb: 4, px: { xs: 3, md: 4 } }}>
            <Typography
              sx={{
                fontSize: { xs: '1.1rem', md: '1.25rem' },
                lineHeight: 1.6,
                color: '#333',
                textAlign: 'center',
                mb: 4,
                fontStyle: 'italic',
              }}
            >
              "{currentTestimonialData.text}"
            </Typography>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
              }}
            >
              <Avatar
                sx={{
                  backgroundColor: '#2e7d32',
                  color: 'white',
                  fontWeight: 600,
                }}
              >
                {currentTestimonialData.avatar}
              </Avatar>
              <Box sx={{ textAlign: 'left' }}>
                <Typography
                  sx={{
                    fontWeight: 600,
                    color: '#1a1a1a',
                    fontSize: '1rem',
                  }}
                >
                  {currentTestimonialData.name}
                </Typography>
                <Typography
                  sx={{
                    color: '#666',
                    fontSize: '0.875rem',
                  }}
                >
                  {currentTestimonialData.condition}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Testimonial indicators */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 1,
            mt: 3,
          }}
        >
          {testimonials.map((_, index) => (
            <Box
              key={index}
              onClick={() => setCurrentTestimonial(index)}
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: index === currentTestimonial ? '#1976d2' : '#ccc',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
                '&:hover': {
                  backgroundColor: index === currentTestimonial ? '#1976d2' : '#999',
                },
              }}
            />
          ))}
        </Box>

        {/* Note for future database integration */}
        <Box
          sx={{
            mt: 4,
            p: 2,
            backgroundColor: '#fff3e0',
            borderRadius: 2,
            border: '1px solid #ffcc02',
          }}
        >
          <Typography
            sx={{
              fontSize: '0.875rem',
              color: '#f57c00',
              textAlign: 'center',
              fontStyle: 'italic',
            }}
          >
            📝 Future Enhancement: This component will integrate with a testimonial database where users can submit their own stories for approval and display.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default TestimonialCarousel;
