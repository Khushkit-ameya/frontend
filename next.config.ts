import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack(config) {
    // Exclude svg from Next.js' default image loader
    config.module.rules = config.module.rules.map((rule: { test?: RegExp }) => {
      if (rule.test instanceof RegExp && rule.test.test(".svg")) {
        return { ...rule, exclude: /\.svg$/i };
      }
      return rule;
    });

    // Add SVGR loader for SVGs
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
};

export default nextConfig;
