/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Fail build on lint errors in production
    ignoreDuringBuilds: process.env.NODE_ENV !== "production",
  },
  typescript: {
    // Fail build on type errors in production
    ignoreBuildErrors: process.env.NODE_ENV !== "production",
  },
  experimental: {
    optimisticClientCache: false,
    instrumentationHook: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  productionBrowserSourceMaps: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
