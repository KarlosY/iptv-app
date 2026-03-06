import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
    unoptimized: true,
  },
  // Allow all external image sources (logos from iptv-org)
  experimental: {},
};

export default nextConfig;
