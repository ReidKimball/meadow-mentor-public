import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router'; // Hook to get URL parameters
import { PortableText, PortableTextComponents } from '@portabletext/react'; // Import the renderer
import { API_BASE_URL } from '../../../env-config.js'; // Adjust path if needed
// Optional: Import Sanity image URL builder if needed for mainImage
import imageUrlBuilder from '@sanity/image-url';
import { createClient } from '@sanity/client'; // If using image builder

// Define an interface for the SEO data (adjust field names based on the plugin)
interface SeoData {
  metaTitle?: string;
  metaDescription?: string;
  openGraphImage?: any; // Sanity image object
  // Add other fields the plugin might provide (e.g., canonicalUrl, keywords)
}

// Define an interface for the author structure
interface Author {
  name?: string;
  image?: any; // Sanity image object
  bio?: any[]; // Portable Text array for bio
}

// Define an interface for the single post structure (if using TypeScript)
interface SingleBlogPost {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt: string;
  authorName?: Author; // Now returns the full author object
  mainImage?: any; // Type appropriately based on Sanity image structure or URL builder usage
  body?: any[]; // Portable Text is an array of blocks
  seo?: SeoData; // SEO data from Sanity
}

// need to get VITE to work, use them from the comments below
const sanityClient = createClient({
    projectId: 'jtquqimk', // Use Vite env var import.meta.env.VITE_SANITY_PROJECT_ID || 
    dataset: 'production',     // Use Vite env var import.meta.env.VITE_SANITY_DATASET || 
    useCdn: true, // `false` if you want to ensure fresh data
    apiVersion: '2023-05-03', // use a UTC date string
    // token: import.meta.env.VITE_SANITY_API_READ_TOKEN, // Uncomment if using a token
  });

const builder = imageUrlBuilder(sanityClient);
function urlFor(source: any) { // Keep 'any' or use a specific Sanity image type
  if (!source) {
     // Handle cases where the image source might be missing or invalid
     console.warn("urlFor called with invalid source:", source);
     return undefined; // Or return a placeholder image URL
  }
  return builder.image(source);
}

// --- Custom Component for Rendering Images within Portable Text ---
// The 'value' prop will be the image object from the Portable Text array
const PortableTextImage = ({ value }: { value: any }) => {
  // Basic check if the image asset reference exists
  if (!value?.asset?._ref) {
    return null; // Don't render anything if the image data is invalid
  }
  return (
    <img
      src={urlFor(value)?.width(800).auto('format').url()} // Use urlFor, add optimization
      alt={value.alt || 'Blog post image'} // Use alt text from Sanity if available, otherwise fallback
      loading="lazy" // Improve performance
      // change the w-2/3 to resize images
      className="my-4 mx-auto rounded-lg shadow-md w-full sm:w-2/3 h-auto"
    />
  );
};

// --- Define the components mapping for PortableText ---
const ptComponents: Partial<PortableTextComponents> = {
  types: {
    image: PortableTextImage, // Tell PortableText to use our custom component for 'image' blocks
    // You can add overrides for other types here if needed (e.g., 'block', 'code', etc.)
  },
  // You can also customize marks (bold, italic), list items, etc.
  // marks: {
  //   strong: ({children}) => <strong className="font-bold text-purple-600">{children}</strong>,
  // }
};

function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>(); // Get slug from URL
  const [post, setPost] = useState<SingleBlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return; // Don't fetch if slug is not available yet

    const fetchPost = async () => {
      setIsLoading(true);
      setError(null);
      setPost(null); // Clear previous post data

      try {
        const response = await fetch(`${API_BASE_URL}/api/blog/posts/${slug}`);

        if (response.status === 404) {
          throw new Error("Post not found");
        }
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: SingleBlogPost = await response.json();
        console.log("Debug - Fetched Post Data:", data);
        console.log("Debug - Author Object:", data.authorName);
        setPost(data);
      } catch (err) {
        console.error(`Failed to fetch post with slug "${slug}":`, err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [slug]); // Re-run effect if the slug changes

  if (isLoading) {
    return <div className="container mx-auto min-h-screen max-w-3xl p-8">Loading post...</div>;
  }

  if (error) {
    return <div className="container mx-auto min-h-screen max-w-3xl p-8">Error: {error}</div>;
  }

  if (!post) {
    // Should ideally be caught by error state, but good as a fallback
    return <div className="container mx-auto min-h-screen max-w-3xl p-8">Post data not available.</div>;
  }

  // --- Prepare SEO data with fallbacks --- 
  // uses the data from the Sanity Studio editor, do not use MetaTags component
  const pageTitle = post.seo?.metaTitle || post.title; // Fallback to post title
  const siteName = 'Meadow Mentor';
  const metaDescription = post.seo?.metaDescription || ''; // Fallback to empty or generate from body
  const ogImageUrl = post.seo?.openGraphImage
    ? urlFor(post.seo.openGraphImage)?.width(1200).height(630).fit('crop').url() // Standard OG image size
    : post.mainImage ? urlFor(post.mainImage)?.width(1200).height(630).fit('crop').url() : undefined; // Fallback to main image

  const mainImageUrl = post.mainImage ? urlFor(post.mainImage)?.width(800).url() : undefined;

  // Define alt text for OG image
  const ogImageAltText = post.seo?.openGraphImage?.alt || 
                         post.mainImage?.alt || 
                         `Image for ${pageTitle} - ${siteName}`;

  return (
    <article className="container mx-auto min-h-screen max-w-3xl p-8 mb-8 bg-white rounded-lg shadow-md">
        <title>{`${pageTitle} - ${siteName}`}</title>
        {metaDescription && <meta name="description" content={metaDescription} />}

        <meta name="title" property="og:title" content={pageTitle} />
        {metaDescription && <meta name="description" property="og:description" content={metaDescription} />}
        
        {ogImageUrl && <meta name="image" property="og:image" content={ogImageUrl} />}
        {ogImageUrl && <meta property="og:image:secure_url" content={ogImageUrl} />}
        {ogImageUrl && ogImageAltText && <meta property="og:image:alt" content={ogImageAltText} />}

        <meta property="og:site_name" content={siteName} />
        <meta property="og:type" content="article" /> 
        <meta property="og:url" content={`https://meadowmentor.com/blog/${post.slug.current}`} />

        {post.authorName && <meta name="author" content={post.authorName.name} />}
        
        <link rel="canonical" href={`https://meadowmentor.com/blog/${post.slug.current}`} />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} /> 
        <meta name="twitter:description" content={metaDescription} /> 
        <meta name="twitter:image" content={ogImageUrl} /> 

      <p><Link to='/blog'>BLOG </Link>/</p>
      <h1 className="text-4xl font-bold mb-2">{post.title}</h1>
      <p className="text-gray-600 mb-4">
        Published on this day in hell {new Date(post.publishedAt).toLocaleDateString()}
        {post.authorName?.name && ` by ${post.authorName.name}`}
      </p>

      {/* Optional: Render Main Image - Basic Example */}
      {/* You might need @sanity/image-url for more control (cropping, etc.) */}
      {mainImageUrl && ( // Only render if mainImageUrl is valid
        <img
          src={mainImageUrl} // Use the generated URL
          alt={post.title}
          className="mb-8 w-full h-auto object-cover rounded-lg shadow-md" // Added some styling
        />
      )}
      
      {/* Render the Portable Text content */}
      <div className="prose-xl lg:prose-2xl max-w-none">
        {post.body ? (
          // --- Pass the custom components to PortableText ---
          <PortableText value={post.body} components={ptComponents} />
          // -------------------------------------------------
        ) : (
          <p>Post content is missing.</p>
        )}
      </div>
      {/* Author Bio Section */}
      {post.authorName && post.authorName.bio && (
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex items-start gap-4">
            {post.authorName.image && (
              <img
                src={urlFor(post.authorName.image)?.width(80).height(80).fit('crop').url()}
                alt={post.authorName.name || 'Author'}
                className="w-20 h-20 rounded-full object-cover flex-shrink-0"
              />
            )}
            <div>
              {post.authorName.name && (
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  About {post.authorName.name}
                </h3>
              )}
              <div className="prose prose-sm text-gray-600">
                <PortableText value={post.authorName.bio} components={ptComponents} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mt-8">
        <p className="text-gray-600">
          Share this post:
          <a href={`https://twitter.com/intent/tweet?text=${post.title}&url=https://meadowmentor.com/blog/${post.slug.current}&hashtags=meadowmentor`} target="_blank" rel="noopener noreferrer" className="ml-2">
            Twitter
          </a>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=https://meadowmentor.com/blog/${post.slug.current}&hashtag=%23meadowmentor`} target="_blank" rel="noopener noreferrer" className="ml-2">
            Facebook
          </a>
        </p>
      </div>
    </article>
  );
}

export default BlogPostPage;
