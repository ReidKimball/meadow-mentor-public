import React from 'react';
import { client, urlFor } from '@/lib/sanity';
import Link from 'next/link';
import { Box, Container, Typography, Card, CardContent, CardMedia, Grid, Chip } from '@mui/material';
import { Calendar, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';

// Revalidate every 60 seconds
export const revalidate = 60;

export const metadata = {
  title: 'Gut Health Blog | Therapeutic Diet Tips & Research',
  description: 'Expert insights and therapeutic guides for managing digestive health and thriving on your healing journey.',
  openGraph: {
    title: 'Gut Health Blog | Therapeutic Diet Tips & Research',
    description: 'Expert insights and therapeutic guides for managing digestive health and thriving on your healing journey.',
  }
};

async function getPosts() {
  const query = `*[_type == "post"] | order(publishedAt desc) {
    title,
    slug,
    mainImage,
    description,
    publishedAt,
    categories[]->{title}
  }`;
  return client.fetch(query);
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <Box sx={{ bgcolor: '#fafafa', minHeight: '100vh' }}>

      {/* Hero Section */}
      <Box sx={{
        background: 'linear-gradient(180deg, #e6f7ed 0%, #fafafa 100%)',
        pt: 8,
        pb: 6,
        textAlign: 'center'
      }}>
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 700,
              color: '#013D1D',
              mb: 2,
              fontFamily: 'var(--font-heading, Montserrat)',
            }}
          >
            Meadow Mentor Blog
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: '#525252',
              maxWidth: '700px',
              mx: 'auto',
              fontFamily: 'var(--font-body, "Source Sans 3")',
            }}
          >
            Tips, recipes, and insights for your gut health journey.
          </Typography>
        </Container>
      </Box>

      {/* Blog Grid */}
      <Container maxWidth="lg" sx={{ pb: 12 }}>
        <Grid container spacing={4} alignItems="stretch">
          {posts.length > 0 ? (
            posts.map((post: any) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={post.slug.current} sx={{ display: 'flex' }}>
                <Link href={`/blog/${post.slug.current}`} style={{ textDecoration: 'none', width: '100%' }}>
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 4,
                      border: '1px solid #e5e5e5',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 24px rgba(0,0,0,0.08)',
                        borderColor: '#013D1D'
                      }
                    }}
                  >
                    {post.mainImage && (
                      <Box sx={{ position: 'relative', pt: '56.25%' /* 16:9 aspect ratio */ }}>
                        <CardMedia
                          component="img"
                          image={urlFor(post.mainImage).width(800).height(450).url()}
                          alt={post.title}
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      </Box>
                    )}
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        {post.categories?.map((cat: any) => (
                          <Chip
                            key={cat.title}
                            label={cat.title}
                            size="small"
                            sx={{
                              bgcolor: '#e6f7ed',
                              color: '#013D1D',
                              fontWeight: 600,
                              fontSize: '0.75rem'
                            }}
                          />
                        ))}
                      </Box>

                      <Typography
                        variant="h5"
                        component="h2"
                        sx={{
                          fontWeight: 700,
                          color: '#013D1D',
                          mb: 1,
                          lineHeight: 1.3,
                          fontFamily: 'var(--font-heading, Montserrat)',
                        }}
                      >
                        {post.title}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: '#666' }}>
                        <Calendar size={16} />
                        <Typography variant="caption">
                          {new Date(post.publishedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Typography>
                      </Box>

                      <Typography
                        variant="body1"
                        sx={{
                          color: '#525252',
                          mb: 3,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {post.description}
                      </Typography>

                      <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', color: '#013D1D', fontWeight: 600 }}>
                        Read Article <ArrowRight size={16} style={{ marginLeft: 8 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Link>
              </Grid>
            ))
          ) : (
            <Box sx={{ width: '100%', textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                No posts found. Check back soon!
              </Typography>
            </Box>
          )}
        </Grid>
      </Container>
    </Box>
  );
}
