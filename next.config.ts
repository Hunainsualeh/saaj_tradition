import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: process.env.NODE_ENV === "production",
  images: {
    qualities: [50, 60, 75, 95],
    remotePatterns: [
      // Cloudinary CDN (primary)
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
      // Vercel Blob (legacy — for any existing images still stored there)
      {
        protocol: "https",
        hostname: "pplr1yqdlwhx3zqh.public.blob.vercel-storage.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
