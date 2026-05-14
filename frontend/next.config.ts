import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/meadow_mentor_public_media/**',
      },
    ],
    // Skip Next.js image optimization for external GCS images
    // GCS already serves optimized webp images
    unoptimized: true,
  },
};

export default nextConfig;
