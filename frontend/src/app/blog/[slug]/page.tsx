import React from 'react';
import { client, urlFor } from '@/lib/sanity';
import { Box, Container, Typography, Chip, Divider } from '@mui/material';
import Header from '@/components/Header';
import { Calendar, User } from 'lucide-react';
import { PortableText } from '@portabletext/react';
import Link from 'next/link';
import { Metadata } from 'next';
import { APP_BASE_URL } from '@/lib/api';
import BlogPostBody from '@/components/blog/BlogPostBody';

export const revalidate = 60;

async function getPost(slug: string) {
  const query = `*[_type == "post" && slug.current == $slug][0]{
    title,
    mainImage,
    description,
    body,
    publishedAt,
    author->{name, image, bio, slug},
    categories[]->{title}
  }`;
  return client.fetch(query, { slug });
}

export async function generateStaticParams() {
  const query = `*[_type == "post"]{
    slug
  }`;
  const posts = await client.fetch(query);

  return posts.map((post: any) => ({
    slug: post.slug.current,
  }));
}

type Params = Promise<{ slug: string }>;

export async function generateMetadata(props: { params: Params }): Promise<Metadata> {
  const params = await props.params;
  const post = await getPost(params.slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  const postUrl = `https://meadowmentor.com/blog/${params.slug}`;
  const imageUrl = post.mainImage ? urlFor(post.mainImage).width(1200).height(630).url() : null;

  return {
    title: `${post.title} | Meadow Mentor`,
    description: post.description,
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      type: 'article',
      url: postUrl,
      title: post.title,
      description: post.description,
      images: imageUrl ? [{
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: post.title,
      }] : [],
      publishedTime: post.publishedAt,
      authors: post.author?.name ? [post.author.name] : ['Meadow Mentor'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

// Custom components for Portable Text
const ptComponents = {
  types: {
    image: ({ value }: any) => {
      if (!value?.asset?._ref) {
        return null;
      }
      return (
        <Box sx={{ my: 4, position: 'relative', width: '100%', borderRadius: 4, overflow: 'hidden' }}>
          <img
            src={urlFor(value).url()}
            alt={value.alt || ' '}
            style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
          />
        </Box>
      );
    }
  },
  block: {
    h1: ({ children }: any) => <Typography variant="h2" component="h2" sx={{ mt: 6, mb: 2, color: '#013D1D', fontWeight: 700, fontFamily: 'var(--font-heading, Montserrat)' }}>{children}</Typography>,
    h2: ({ children }: any) => <Typography variant="h3" component="h3" sx={{ mt: 5, mb: 2, color: '#013D1D', fontWeight: 700, fontFamily: 'var(--font-heading, Montserrat)' }}>{children}</Typography>,
    h3: ({ children }: any) => <Typography variant="h4" component="h4" sx={{ mt: 4, mb: 2, color: '#013D1D', fontWeight: 600, fontFamily: 'var(--font-heading, Montserrat)' }}>{children}</Typography>,
    normal: ({ children }: any) => <Typography paragraph sx={{ mb: 2, lineHeight: 1.8, color: '#333', fontSize: '1.1rem' }}>{children}</Typography>,
    blockquote: ({ children }: any) => (
      <Box sx={{ borderLeft: '4px solid #013D1D', pl: 3, my: 3, py: 1, bgcolor: '#f0fdf4', borderRadius: '0 8px 8px 0' }}>
        <Typography sx={{ fontStyle: 'italic', color: '#013D1D' }}>{children}</Typography>
      </Box>
    ),
  },
  list: {
    bullet: ({ children }: any) => <Box component="ul" sx={{ pl: 4, mb: 3 }}>{children}</Box>,
    number: ({ children }: any) => <Box component="ol" sx={{ pl: 4, mb: 3 }}>{children}</Box>,
  },
  listItem: {
    bullet: ({ children }: any) => <li style={{ marginBottom: '0.5rem', lineHeight: 1.6 }}>{children}</li>,
    number: ({ children }: any) => <li style={{ marginBottom: '0.5rem', lineHeight: 1.6 }}>{children}</li>,
  },
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

export default async function BlogPost(props: { params: Params }) {
  const params = await props.params;
  const post = await getPost(params.slug);

  if (!post) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#fff' }}>
        {/* <Header /> */}
        <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
          <Typography variant="h4">Post not found</Typography>
          <Link href="/blog" style={{ textDecoration: 'none' }}>
            <Typography sx={{ 
              color: '#013D1D', 
              mt: 2, 
              textDecoration: 'underline',
              transition: 'text-decoration 0.2s',
              '&:hover': { textDecoration: 'none' } 
            }}>
              Back to Blog
            </Typography>
          </Link>
        </Container>
      </Box>
    );
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    image: post.mainImage ? urlFor(post.mainImage).width(1200).height(630).url() : undefined,
    datePublished: post.publishedAt,
    author: post.author ? {
      '@type': 'Person',
      name: post.author.name
    } : {
      '@type': 'Organization',
      name: 'Meadow Mentor'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Meadow Mentor',
      logo: {
        '@type': 'ImageObject',
        url: 'https://storage.googleapis.com/meadow_mentor_public_media/images/chef_kay_in_sun_v4_sm.webp'
      }
    }
  };

  return (
    <Box sx={{ bgcolor: '#fff', minHeight: '100vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* <Header /> */}

      <Container maxWidth="md" sx={{ py: 8 }}>
        {/* Header Info */}
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
            {post.categories?.map((cat: any) => (
              <Chip key={cat.title} label={cat.title} sx={{ bgcolor: '#e6f7ed', color: '#013D1D', fontWeight: 600 }} />
            ))}
          </Box>

          <Typography variant="h2" component="h1" sx={{ fontWeight: 800, color: '#013D1D', mb: 3, fontFamily: 'var(--font-heading, Montserrat)' }}>
            {post.title}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#666' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Calendar size={18} />
              <Typography variant="body2">
                {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </Typography>
            </Box>
            {post.author && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <User size={18} />
                {post.author.slug?.current ? (
                  <Link href={`/blog/author/${post.author.slug.current}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Typography variant="body2" sx={{ textDecoration: 'underline', '&:hover': { textDecoration: 'none' } }}>
                      {post.author.name}
                    </Typography>
                  </Link>
                ) : (
                  <Typography variant="body2">{post.author.name}</Typography>
                )}
              </Box>
            )}
          </Box>
        </Box>

        {/* Main Image */}
        {post.mainImage && (
          <Box sx={{ mb: 8, borderRadius: 4, overflow: 'hidden', boxShadow: '0 12px 24px rgba(0,0,0,0.1)' }}>
            <img
              src={urlFor(post.mainImage).width(1200).height(600).url()}
              alt={post.title}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </Box>
        )}

        {/* Content */}
        <Box sx={{ fontFamily: 'var(--font-body, "Source Sans 3")' }}>
          <BlogPostBody body={post.body} />
        </Box>

        {/* Author Bio Section */}
        {post.author && post.author.bio && (
          <Box sx={{ mt: 8, pt: 4, borderTop: '1px solid #eee' }}>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
              {post.author.image && (
                <Box
                  component="img"
                  src={urlFor(post.author.image).width(100).height(100).fit('crop').url()}
                  alt={post.author.name}
                  sx={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                />
              )}
              <Box>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 700, color: '#013D1D' }}>
                  About{' '}
                  {post.author.slug?.current ? (
                    <Link href={`/blog/author/${post.author.slug.current}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <Box component="span" sx={{ textDecoration: 'underline', '&:hover': { textDecoration: 'none' } }}>
                        {post.author.name}
                      </Box>
                    </Link>
                  ) : (
                    post.author.name
                  )}
                </Typography>
                <Box sx={{ color: '#555', fontSize: '0.95rem' }}>
                  <PortableText value={post.author.bio} components={ptComponents} />
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 8 }} />

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Enjoyed this article?</Typography>
          <Link href={`${APP_BASE_URL}/signup`} passHref style={{ textDecoration: 'none' }}>
            <Typography component="span" sx={{ 
              color: '#013D1D', 
              fontWeight: 700, 
              textDecoration: 'underline', 
              cursor: 'pointer',
              transition: 'text-decoration 0.2s',
              '&:hover': { textDecoration: 'none' }
            }}>
              Join Meadow Mentor for personalized gut health guidance.
            </Typography>
          </Link>
        </Box>

      </Container>
    </Box>
  );
}
