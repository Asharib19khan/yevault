import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/marketing_study_guide.html',
      },
    ];
  },
};

export default nextConfig;
