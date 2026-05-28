/** @type {import('next').NextConfig} */
const nextConfig = {
  // swisseph is a native Node module — exclude from webpack bundling
  webpack(config, { isServer }) {
    if (isServer) {
      config.externals = [...(config.externals || []), 'swisseph'];
    }
    return config;
  },
};

export default nextConfig;
