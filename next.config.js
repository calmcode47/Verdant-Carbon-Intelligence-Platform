/**
 * @file next.config.js
 * @description Next.js build configuration file for the Verdant Carbon Intelligence Platform.
 * Configures experimental features, allows external profile avatar images,
 * and sets up webpack externals for canvas libraries to support 3D rendering.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { domains: ['avatars.githubusercontent.com', 'ui-avatars.com'] },
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  webpack: (config) => {
    config.externals.push({ canvas: 'canvas' });
    return config;
  },
};

module.exports = nextConfig;
