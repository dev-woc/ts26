/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Allow images from external domains if needed
  images: {
    domains: [],
  },
}

module.exports = nextConfig
