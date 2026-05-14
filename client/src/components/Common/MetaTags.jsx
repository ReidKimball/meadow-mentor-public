import React from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';

// Define a default image URL (Absolute URL!) - replace with your actual default OG image
// this image is on my google storage bucket that is uniform and public

const DEFAULT_OG_IMAGE_URL = "https://storage.googleapis.com/meadow_mentor_public_media/images/Meadow_Mentor_OG_Image_1200x630.webp";
const DEFAULT_SITE_NAME = "Meadow Mentor";
const DEFAULT_AUTHOR_NAME = "Meadow Mentor"; // Default author

function MetaTags({
    title, // Required: The specific page title
    description, // Required: The specific page description
    url, // Required: The canonical URL for the specific page
    imageUrl = DEFAULT_OG_IMAGE_URL, // Optional: Specific image for this page, defaults to the general one
    imageAlt = "Meadow Mentor - Your in-home chef helping you thrive one meal at a time.", // Optional: Alt text for the image
    siteName = DEFAULT_SITE_NAME, // Optional: Site name (usually consistent)
    authorName = DEFAULT_AUTHOR_NAME, // Optional: Author name
    // Add other props if needed, e.g., twitterHandle
}) {

    // Basic validation (optional but good practice)
    if (!title || !description || !url) {
        console.warn("MetaTags component is missing required props: title, description, or url.");
        // You might want to return null or default tags here in a real app
        // For now, we'll proceed but log a warning.
    }

    // Determine the correct image URL from the potentially complex `imageUrl` prop.
    let sourceUrl = imageUrl;
    if (typeof sourceUrl === 'object' && sourceUrl !== null) {
      // For social media, the original, highest quality image is best.
      sourceUrl = sourceUrl.original || sourceUrl.display || DEFAULT_OG_IMAGE_URL;
    }

    // Construct the absolute URL for the image to ensure it's accessible by social media crawlers.
    let finalImageUrl;
    if (sourceUrl && typeof sourceUrl === 'string' && sourceUrl.startsWith('http')) {
        // Use the provided absolute URL directly.
        finalImageUrl = sourceUrl;
    } else {
        // Fallback to the default site-wide image if no valid URL is found.
        finalImageUrl = DEFAULT_OG_IMAGE_URL;
    }

    return (
        <Helmet>
            <title>{`${title} - ${siteName}`}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={url} />

            <meta property="og:type" content="website" />
            <meta property="og:url" content={url} />
            <meta name="title" property="og:title" content={title} />
            <meta name="description" property="og:description" content={description} />
            <meta name="image" property="og:image" content={finalImageUrl} />
            <meta property="og:image:secure_url" content={finalImageUrl} />
            <meta property="og:image:alt" content={imageAlt} />
            <meta property="og:site_name" content={siteName} />

            <meta name="author" content={authorName} />

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={url} />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={finalImageUrl} />
            <meta name="twitter:image:alt" content={imageAlt} />
        </Helmet>
    );
}

export default MetaTags;
