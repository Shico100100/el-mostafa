import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
  ...(isDev
    ? {}
    : {
        images: { unoptimized: true },
      }),
  reactStrictMode: true,
  trailingSlash: true,
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS?.split(',')?.filter(Boolean) || [],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
