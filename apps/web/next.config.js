/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@asuite/ui', '@asuite/utils', '@asuite/database'],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
};

module.exports = nextConfig;

