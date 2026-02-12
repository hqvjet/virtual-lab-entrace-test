import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['three'],
  transpilePackages: ['react-globe.gl', 'three-globe', 'globe.gl'],
};

export default nextConfig;
