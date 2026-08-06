import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for the production Docker image: emits a self-contained
  // server bundle at .next/standalone that the runtime stage copies in.
  output: "standalone",

  async redirects() {
    return [
      { source: "/settings", destination: "/administrator/system-settings", permanent: false },
      { source: "/profile", destination: "/dashboard", permanent: false },
    ];
  },

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
