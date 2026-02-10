import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/db", "@repo/shared"],
  serverExternalPackages: ["@libsql/client"],
};

export default nextConfig;
