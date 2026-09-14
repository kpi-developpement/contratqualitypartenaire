/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // HADI HIA LI KAT-KHELLI DOCKER Y-KHEDDEM MZYAN
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;