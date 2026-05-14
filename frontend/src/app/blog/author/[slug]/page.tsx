
import React from 'react';
import { client, urlFor } from '@/lib/sanity';
import { Box, Container, Typography, Grid, Card, CardContent, CardMedia, Chip, Divider } from '@mui/material';
import Link from 'next/link';
import { PortableText } from '@portabletext/react';
import { Metadata } from 'next';
import { Calendar } from 'lucide-react';

export const revalidate = 60;

// Custom components for Portable Text (reused from blog post page)
const ptComponents = {
  marks: {
    link: ({ children, value }: any) => {
      return (
        <Box
          component="a"
          href={value?.href}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            color: '#013D1D',
            textDecoration: 'underline',
            fontWeight: 600,
            transition: 'text-decoration 0.2s ease',
            '&:hover': {
              textDecoration: 'none',
            },
          }}
        >
          {children}
        </Box>
      );
    },
  },
};

async function getAuthorData(slug: string) {
  const query = `{
    "author": *[_type == "author" && slug.current == $slug][0]{
      name,
      image,
      bio
    },
    "posts": *[_type == "post" && author->slug.current == $slug] | order(publishedAt desc) {
      title,
      slug,
      publishedAt,
      mainImage,
      description,
      categories[]->{title}
    }
  }`;
  return client.fetch(query, { slug });
}

export async function generateStaticParams() {
  const query = `*[_type == "author"]{
    slug
  }`;
  const authors = await client.fetch(query);

  return authors.map((author: any) => ({
    slug: author.slug.current,
  }));
}

type Params = Promise<{ slug: string }>;

export async function generateMetadata(props: { params: Params }): Promise<Metadata> {
  const params = await props.params;
  const data = await getAuthorData(params.slug);

  if (!data.author) {
    return {
      title: 'Author Not Found',
    };
  }

  return {
    title: `${data.author.name} | Meadow Mentor`,
    description: `Read articles by ${data.author.name} on Meadow Mentor.`,
    openGraph: {
      title: `${data.author.name} - Author at Meadow Mentor`,
      images: data.author.image ? [urlFor(data.author.image).width(1200).height(630).url()] : [],
    },
  };
}

export default async function AuthorPage(props: { params: Params }) {
  const params = await props.params;
  const { author, posts } = await getAuthorData(params.slug);

  if (!author) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#fff' }}>
        <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
          <Typography variant="h4">Author not found</Typography>
          <Link href="/blog" style={{ textDecoration: 'none' }}>
            <Typography sx={{ color: '#013D1D', mt: 2, textDecoration: 'underline' }}>Back to Blog</Typography>
          </Link>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#fff', minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ py: 8 }}>
        
        {/* Author Profile Section */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          alignItems: 'center', 
          gap: 6, 
          mb: 10, 
          textAlign: { xs: 'center', md: 'left' } 
        }}>
          {author.image && (
            <Box
              component="img"
              src={urlFor(author.image).width(300).height(300).fit('crop').url()}
              alt={author.name}
              sx={{ 
                width: { xs: 200, md: 280 }, 
                height: { xs: 200, md: 280 }, 
                borderRadius: '50%', 
                objectFit: 'cover',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
              }}
            />
          )}
          <Box sx={{ maxWidth: '600px' }}>
            <Typography variant="h2" component="h1" sx={{ 
              fontWeight: 800, 
              color: '#013D1D', 
              mb: 3, 
              fontFamily: 'var(--font-heading, Montserrat)' 
            }}>
              {author.name}
            </Typography>
            <Box sx={{ color: '#555', fontSize: '1.1rem', lineHeight: 1.7, fontFamily: 'var(--font-body, "Source Sans 3")' }}>
              <PortableText value={author.bio} components={ptComponents} />
            </Box>
          </Box>
        </Box>

        <Divider sx={{ mb: 8 }} />

        {/* Author's Posts Section */}
        <Typography variant="h4" component="h2" sx={{ 
          mb: 6, 
          fontWeight: 700, 
          color: '#013D1D', 
          fontFamily: 'var(--font-heading, Montserrat)' 
        }}>
          Articles by {author.name}
        </Typography>

        <Grid container spacing={4}>
          {posts.map((post: any) => (
            <Grid size={{ xs: 12, md: 4 }} key={post.slug.current}>
              <Link href={`/blog/${post.slug.current}`} style={{ textDecoration: 'none' }}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderRadius: 4,
                  boxShadow: 'none',
                  border: '1px solid #eee',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.08)'
                  }
                }}>
                  {post.mainImage && (
                    <CardMedia
                      component="img"
                      height="240"
                      image={urlFor(post.mainImage).width(600).height(400).url()}
                      alt={post.title}
                    />
                  )}
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {post.categories?.slice(0, 2).map((cat: any) => (
                        <Chip 
                          key={cat.title} 
                          label={cat.title} 
                          size="small" 
                          sx={{ bgcolor: '#e6f7ed', color: '#013D1D', fontWeight: 600, fontSize: '0.75rem' }} 
                        />
                      ))}
                    </Box>
                    <Typography gutterBottom variant="h5" component="h3" sx={{ 
                      fontWeight: 700, 
                      color: '#013D1D', 
                      fontFamily: 'var(--font-heading, Montserrat)',
                      mb: 2
                    }}>
                      {post.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      mb: 2, 
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {post.description}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#888', mt: 'auto' }}>
                      <Calendar size={16} />
                      <Typography variant="caption">
                        {new Date(post.publishedAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Link>
            </Grid>
          ))}
        </Grid>

        {posts.length === 0 && (
          <Typography sx={{ color: '#666', fontStyle: 'italic' }}>
            No articles found for this author.
          </Typography>
        )}

      </Container>
    </Box>
  );
}