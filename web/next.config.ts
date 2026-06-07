import type { NextConfig } from "next";
import path from "path";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const beOrigin =
  process.env.NEXT_PUBLIC_API_SERVER?.replace(/\/$/, "") ||
  "http://localhost:8889";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  reactStrictMode: true,
  /** Proxy BE qua cùng origin — tránh CORS / Failed to fetch khi OAuth callback. */
  async rewrites() {
    return [
      {
        source: "/api/be/:path*",
        destination: `${beOrigin}/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  compiler: {
    styledComponents: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.builder.io",
        pathname: "/api/v1/image/assets/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8002",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "localhost",
        port: "8002",
        pathname: "/**",
      },
    ],
  },
  // Turbopack config for Next.js 16
  // Fix "Next.js inferred your workspace root" when there are multiple lockfiles in parent dirs.
  turbopack: {
    root: __dirname,
  },
  // Webpack config for backward compatibility
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname),
    };
    return config;
  },
};

export default nextConfig;
