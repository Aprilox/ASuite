const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@asuite/ui', '@asuite/utils', '@asuite/database'],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
  
  // HTTP Security Headers
  async headers() {
    return [
      {
        // Appliquer à toutes les routes
        source: '/:path*',
        headers: [
          {
            // Empêche le clickjacking
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            // Empêche le MIME type sniffing
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            // Protection XSS pour les anciens navigateurs
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            // Contrôle les informations envoyées dans le header Referer
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            // Désactive les fonctionnalités du navigateur non utilisées
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            // Force HTTPS en production
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);

