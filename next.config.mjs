/** @type {import('next').NextConfig} */
const nextConfig = {
  // swisseph is a native Node module — exclude from webpack bundling
  // and explicitly include its build artifacts in Vercel's file tracer
  webpack(config, { isServer }) {
    if (isServer) {
      config.externals = [...(config.externals || []), 'swisseph'];
    }
    return config;
  },

  experimental: {
    // Tell Next.js to treat swisseph as a server-external package
    serverComponentsExternalPackages: ['swisseph'],
  },

  // Ensure Vercel includes the native .node binary when bundling API routes
  outputFileTracingIncludes: {
    '/api/houses': ['./node_modules/swisseph/**/*'],
    '/api/cron/generate-today': ['./node_modules/swisseph/**/*'],
  },
};

export default nextConfig;
