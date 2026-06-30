/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  experimental: { optimizePackageImports: ['@heroicons/react', 'recharts'] },
};

module.exports = nextConfig;
