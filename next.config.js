/**
 * Copyright (c) 2026 LinkedFlow Technologies
 * Licensed under the Business Source License 1.1
 * You may not use this file except in compliance with the License.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Type checking happens in CI, allow builds with type errors locally
    ignoreBuildErrors: true
  },
  eslint: {
    // ESLint runs separately, skip during build for speed
    ignoreDuringBuilds: true
  },
  experimental: {
    serverComponentsExternalPackages: ['pino', 'pino-pretty']
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*'
      }
    ]
  },
  env: {
    API_URL: process.env.API_URL || 'http://localhost:3001'
  }
}

module.exports = nextConfig