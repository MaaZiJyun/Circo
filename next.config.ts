import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  serverExternalPackages: ["better-sqlite3", "pdf-parse"],
  experimental: {
    turbopackFileSystemCacheForBuild: false,
  },
};

export default nextConfig;
