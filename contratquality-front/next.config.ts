import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  // eslint a été retiré car il n'est plus supporté ici dans Next.js 15+
};

export default nextConfig;