import React from 'react';
import { Box } from '@mui/material';
//import HeaderBar from './LandingV2/HeaderBar.jsx'; // not used
import HeroSection from './LandingV2/HeroSection';
import RecipeSection from './LandingV2/RecipeSection';

//import TestimonialCarousel from './LandingV2/TestimonialCarousel'; // not used
//import ConfidenceSection from './LandingV2/ConfidenceSection'; // not used
import FounderStorySection from './LandingV2/FounderStorySection';
import FinalCTA from './LandingV2/FinalCTA';
import MetaTags from '../Common/MetaTags';

/**
 * LandingPageV2 - Modern, minimal landing page focused on user emotional journey
 * 
 * Design Philosophy:
 * - Mobile-first responsive design
 * - Minimal cognitive load with short sentences and ample white space
 * - Emotional progression: Safe → Inspired → Confident → Trust
 * - Real imagery with subtle meadow/health theme (blues/greens with earthy accents)
 * - Live ingredient demo integration for immediate value demonstration
 */

/*  Below metatag pageInfo:
1.  **Starts with a Call to Action & Empowerment:** "Take control..." is a more powerful and active opening than "Effortlessly manage...". For a user who feels their health and diet are *out of control*, this language is incredibly resonant. It speaks directly to their desire for agency.
2.  **Stronger Verbs:** We've changed "give you" to "**finds**" and "build" to "**creates**." These verbs feel more active and intelligent, reinforcing the idea that the AI is doing powerful work on the user's behalf.
3.  **Adds the Keyword "Supports":** The phrase "...and **supports** you on..." is a great, emotionally intelligent way to frame the app's role. It also re-introduces a valuable keyword related to user intent ("IBD support," "SCD support," etc.).
*/

const pageInfo = {
  title: "Meadow Mentor - Personal Chef for Gut Health",
  description: "Your personal guide for gut health. Supporting IBD, IBS, celiac, and digestive conditions with personalized recipes and meal plans. Thrive, one meal at a time.",
  url: "https://meadowmentor.com",
  imageUrl: "https://storage.googleapis.com/meadow_mentor_public_media/images/meadow_mentor_og_image_1200x630.webp", // Optional: Add a specific preview image
};

const LandingPageV2 = () => {
  return (
    <>
      <MetaTags {...pageInfo} />
    
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#fafafa', // Soft, clean background
      }}
    >
      {/* Header with CTA - sticky for easy access */}
      {/* <HeaderBar /> */}
      
      {/* Section 1: Make users feel safe - "Instantly Know Which Foods Are Safe" */}
      <HeroSection />
      
      {/* Section 2: Make users feel inspired - "Go From What Can I Eat to What Do I Want to Eat" */}
      <RecipeSection />     

      {/* Testimonial Component - flexible placement between sections 2-3 */}
      {/* <TestimonialCarousel /> */}
      
      {/* Section 3: Make users feel confident - "Build Your Confidence With Every Meal" */}
      {/* <ConfidenceSection /> */}
      
      {/* Section 4: Make users feel trust - "Not Just an App. A Lifeline Built from Experience" */}
      <FounderStorySection />
      
      {/* Final CTA - "Start Eating with Confidence" */}
      <FinalCTA />
    </Box>
    </>
  );
};

export default LandingPageV2;
