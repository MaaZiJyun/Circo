import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    turbopackFileSystemCacheForBuild: false,
  },
};

export default nextConfig;
