/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack(config) {
    // Configure proper handling for CSS
    return config;
  },
}

module.exports = nextConfig