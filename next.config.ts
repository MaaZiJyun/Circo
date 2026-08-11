import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ["better-sqlite3", "pdf-parse"],
  experimental: {
    turbopackFileSystemCacheForBuild: false,
  },
};

export default nextConfig;
