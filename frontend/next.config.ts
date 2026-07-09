import type { NextConfig } from 'next';

const isCapacitorBuild = process.env.CAPACITOR_BUILD === 'true';
const isDev = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
  ...(isDev
    ? {}
    : {
        output: isCapacitorBuild ? 'export' : 'standalone',
        images: { unoptimized: true },
      }),
  reactStrictMode: true,
  trailingSlash: true,
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS?.split(',')?.filter(Boolean) || [],
  ...(isCapacitorBuild
    ? {}
    : {
        async rewrites() {
          return [
            {
              source: '/api/:path*',
              destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/:path*`,
            },
            {
              source: '/uploads/:path*',
              destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/uploads/:path*`,
            },
          ];
        },
      }),
};

export default nextConfig;
