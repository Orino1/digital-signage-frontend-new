/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: falsew, // Ignore TypeScript build errors
  },
  eslint: {
    ignoreDuringBuilds: true, // Disable ESLint during the build process
  },
};

export default nextConfig;
