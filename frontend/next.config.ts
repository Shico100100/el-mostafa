import type { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';

const isDev = process.env.NODE_ENV !== 'production';

const withAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });

const baseConfig: NextConfig = {
  output: 'standalone',
  ...(isDev
    ? {}
    : {
        images: { unoptimized: true },
      }),
  reactStrictMode: true,
  trailingSlash: false,
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS?.split(',')?.filter(Boolean) || [],
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
      {
        source: '/((?!_next/static|api|uploads|_next/data).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-cache' },
        ],
      },
    ];
  },
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

const nextConfig = withAnalyzer(baseConfig);

export default nextConfig;
