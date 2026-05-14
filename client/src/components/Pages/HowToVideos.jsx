/**
 * @file Defines the HowToVideos page.
 * @description A protected in-app page that embeds short, step-by-step videos to help users
 * navigate gut-friendly cooking and meal planning.
 * @requires module:react - Core React library.
 * @requires module:@mui/material - UI primitives used to render the page layout.
 * @author Cascade
 * @version 1.0.0
 * @date 2025-12-13
 */

// React/Third-Party Libraries
import React from 'react';
import { Box, Container, Grid, Paper, Typography } from '@mui/material';

/**
 * @typedef {object} HowToVideo
 * @property {string} id - The YouTube video ID.
 * @property {string} title - The user-facing title shown above the embedded video.
 */

/**
 * @constant {HowToVideo[]}
 * @description The list of YouTube Shorts to embed on the page.
 */
const HOW_TO_VIDEOS = [
  { id: 'ME64Ni42W14', title: 'Create recipes' },
  { id: '4KTl_1MxEDg', title: 'Edit recipes' },
  { id: 'P-mdig32uWA', title: 'Create a shopping list' },
  { id: 'ADcDA2iegr0', title: 'Create meal plans' },
  { id: '3te8Ek82iiY', title: 'Edit meal plans' },
];

/**
 * @component HowToVideos
 * @description Renders a branded, mobile-friendly grid of embedded YouTube Shorts.
 * Uses the Meadow Mentor brand tokens (Deep Forest Green, Pale Cream, Soft Mint)
 * to keep text readable and consistent with the rest of the app.
 * @returns {JSX.Element} The rendered HowToVideos page.
 */
export default function HowToVideos() {
  return (
    <Box sx={{ width: '100%' }}>
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 3,
            backgroundColor: '#FFF8E5',
            border: '1px solid #DCFCE7',
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            sx={{ color: '#013D1D', fontWeight: 700, mb: 1 }}
          >
            How-to videos for gut-friendly cooking and meal planning
          </Typography>

          <Typography variant="body1" sx={{ color: '#013D1D', mb: 3 }}>
            Quick, step-by-step demos to help you thrive, one meal at a time.
          </Typography>

          <Grid container spacing={2}>
            {HOW_TO_VIDEOS.map((video) => (
              <Grid key={video.id} item xs={12} sm={6} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    border: '1px solid #DCFCE7',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{ color: '#013D1D', fontWeight: 700, mb: 1 }}
                  >
                    {video.title}
                  </Typography>

                  <Box
                    sx={{
                      width: '100%',
                      aspectRatio: '9 / 16',
                      borderRadius: 2,
                      overflow: 'hidden',
                      backgroundColor: '#013D1D',
                    }}
                  >
                    <iframe
                      title={video.title}
                      src={`https://www.youtube.com/embed/${video.id}`}
                      style={{ width: '100%', height: '100%', border: 0 }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="strict-origin-when-cross-origin"
                    />
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
}
