import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const apiUrl = (process.env.BACKEND_API_URL ?? 'http://127.0.0.1:5000').replace(/\/$/, '');
    return [
      {
        source: '/backend-api/:path*',
        destination: `${apiUrl}/api/:path*`
      }
    ];
  }
};

export default nextConfig;
