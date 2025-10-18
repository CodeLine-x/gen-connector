import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // For App Router - increase body size limit for video uploads
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "ce7d78at3t2f5cjj.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "fal.media",
      },
      {
        protocol: "https",
        hostname: "v3b.fal.media",
      },
      {
        protocol: "https",
        hostname: "**.storage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
    ],
    unoptimized: true, // Disable optimization for external images
  },
};

export default nextConfig;
