import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "pub-56eee1e388224dd293f25bccc68afdca.r2.dev",
      },
    ],
  },
};

export default nextConfig;
