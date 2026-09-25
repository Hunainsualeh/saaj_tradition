import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const isVercelPreview =
  process.env.VERCEL_ENV !== undefined && process.env.VERCEL_ENV !== "production";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // 'unsafe-eval' is only required by React Fast Refresh in development.
      // It is dropped in production to reduce XSS surface.
      // NOTE: 'unsafe-inline' on script-src remains for Next.js inline bootstrap
      // scripts. Migrating to a per-request nonce (removing 'unsafe-inline') is
      // the recommended follow-up but needs end-to-end testing.
      `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      // Block plugin/embed vectors and <base> hijacking (safe hardening).
      "object-src 'none'",
      "base-uri 'self'",
      // Allow any HTTPS image source so admins can use external partner-logo
      // URLs (rendered directly via <img>). Uploads still go to Cloudinary.
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https://res.cloudinary.com",
      "connect-src 'self'",
      "frame-src https://www.google.com https://maps.google.com",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Enable the React Compiler in every environment so localhost behaves like
  // production (automatic memoization → far fewer re-renders during dev).
  reactCompiler: true,
  poweredByHeader: false,
  // Tree-shake large icon / UI / animation packages so only the components
  // actually used are bundled (smaller JS, much faster dev compile + HMR).
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "react-icons",
      "framer-motion",
      "radix-ui",
    ],
  },
  images: {
    // Custom loader: Cloudinary-hosted images (all products/categories/blogs)
    // are delivered straight from Cloudinary's CDN instead of being re-proxied
    // through the Vercel Image Optimization API. This removes a redundant cold
    // transform per size and, critically, stops burning the Vercel Hobby-plan
    // optimization quota — the cause of product images rendering inconsistently
    // in production. See src/lib/image-loader.ts.
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    // Inert while the custom loaderFile is set (no built-in optimizer runs).
    // Kept so the AVIF-first intent survives if the loader strategy changes.
    formats: ["image/avif", "image/webp"],
    // 50/60/75 cover the bulk of the UI (default is 75). 85/90 are reserved for
    // focal images (main product photo / hero) that opt into a crisper render.
    qualities: [50, 60, 75, 85, 90],
    // Cache optimized images for 31 days instead of the 60s default.
    minimumCacheTTL: 2678400,
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
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.saajtradition.com" }],
        destination: "https://saajtradition.com/:path*",
        permanent: true,
      },
      { source: "/home", destination: "/", permanent: true },
      { source: "/index", destination: "/", permanent: true },
      { source: "/products", destination: "/shop", permanent: true },
      { source: "/products/:slug", destination: "/product/:slug", permanent: true },
      { source: "/shop/all", destination: "/shop", permanent: true },
      { source: "/contact", destination: "/support", permanent: true },
      { source: "/contact-us", destination: "/support", permanent: true },
      { source: "/faq", destination: "/support", permanent: true },
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/store-location", destination: "/location", permanent: true },
      { source: "/ahmedpur-east", destination: "/location", permanent: true },
      { source: "/bahawalpur", destination: "/boutique-in-bahawalpur", permanent: true },
      { source: "/news", destination: "/blog", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: isVercelPreview
          ? [...securityHeaders, { key: "X-Robots-Tag", value: "noindex, nofollow" }]
          : securityHeaders,
      },
      {
        source: "/(admin|cart|checkout|track|unsubscribe|api)(.*)",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        // Static brand assets (images, video, poster) rarely change and are not
        // content-hashed. Cache hard at the browser/CDN with a background
        // revalidation window so updates still propagate within a day.
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
