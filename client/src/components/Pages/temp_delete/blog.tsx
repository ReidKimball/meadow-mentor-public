import React, { useState, useEffect } from 'react';
import { Link } from 'react-router'; // Assuming you use React Router
import imageUrlBuilder from '@sanity/image-url';
import { API_BASE_URL } from '../../env-config'; // Adjust path if needed
import MetaTags from '../Common/MetaTags.jsx';

// --- Sanity Image URL Builder Setup ---
// Ensure SANITY_PROJECT_ID and SANITY_DATASET are correctly exported from your env-config
// Handle potential undefined values if necessary
const builder = imageUrlBuilder({
  projectId: 'jtquqimk', // Provide a fallback or ensure these are always defined
  dataset: 'production',   // Provide a fallback or ensure these are always defined
});

function urlFor(source: any) { // Use 'any' or import SanityImageSource if available/typed
  return source ? builder.image(source) : null;
}
// --- End Sanity Image URL Builder Setup ---

// Define an interface for the post structure (if using TypeScript)
interface BlogPost {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt: string;
  description: string;
  mainImage?: any; // Add mainImage - Use 'any' or a more specific Sanity image type
  // Add excerpt if you fetch it from the API later
  // excerpt?: string;
}

function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]); // Use interface here
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/blog/posts`); // Use API_BASE_URL
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: BlogPost[] = await response.json(); // Type assertion
        setPosts(data);
      } catch (err) {
        console.error("Failed to fetch posts:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []); // Empty dependency array means this runs once on mount

  if (isLoading) {
    return <div className="container mx-auto min-h-screen max-w-3xl p-8">Loading posts...</div>;
  }

  if (error) {
    return <div className="container mx-auto min-h-screen max-w-3xl p-8">Error loading posts: {error}</div>;
  }

  const pageInfo = {
    title: "IBD & Therapeutic Diet Blog | Meadow Mentor", // 50 characters. Keyword-rich and branded.
    description: "The top blog for managing IBD. Find recipes & tips for SCD, GAPS, Paleo AIP & Mediterranean diets to calm inflammation and manage Crohn's & colitis.",
    url: "https://meadowmentor.com/blog/",
    imageUrl: "https://storage.googleapis.com/meadow_mentor_public_media/images/meadow_mentor_og_image_1200x630.webp"
  };
  
  return (
    <>
      <MetaTags {...pageInfo} />
      
      <main className="container mx-auto min-h-screen max-w-3xl p-8 ">
        <h1 className="text-4xl font-bold mb-12 text-center">Our Latest Posts</h1> {/* Updated heading */}
        {posts.length === 0 ? (
          <p className="text-center text-gray-500">No posts found yet. Check back soon!</p> /* Centered message */
        ) : (
          <ul className="space-y-10"> {/* Increased spacing between posts */}
            {posts.map((post) => {
              const imageUrl = urlFor(post.mainImage)?.width(800).height(450).auto('format').url(); // Generate URL, set size, auto format
              const postUrl = `/blog/${post.slug.current}`; // Define post URL once

              return (
                <li key={post._id} className="border border-gray-200 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 bg-white">
                  <Link to={postUrl} className="block group hover:no-underline"> {/* Make the whole card clickable */}
                    {imageUrl && (
                      <div className="w-full h-48 sm:h-64 overflow-hidden"> {/* Fixed height container */}
                        <img
                          src={imageUrl}
                          alt={post.title || 'Blog post image'} // Add alt text
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" // Cover, zoom on hover
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h2 className="text-2xl font-semibold mb-2 group-hover:text-blue-600 transition-colors duration-200">{post.title}</h2>
                      <p className="text-sm text-gray-500 mb-4">
                        Published on: {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      <p className="prose-lg text-gray-500 mb-4">
                        {post.description || 'Unknown Description'}
                      </p>
                      {/* Add excerpt here if available */}
                      {/* {post.excerpt && <p className="text-gray-700 mb-4">{post.excerpt}</p>} */}
                      <span className="text-blue-500 group-hover:underline">Read More &rarr;</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      
    </>
  );
}

export default BlogPage;
