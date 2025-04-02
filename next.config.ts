import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'example.com',
            },
            // Add other domains as needed
            {
                protocol: 'https',
                hostname: 'www.alamy.com',
            },
            {
                protocol: 'https',
                hostname: 'en.wikipedia.org',
            },
        ],
    },
};

export default nextConfig;
