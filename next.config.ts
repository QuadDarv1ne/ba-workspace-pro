import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // @ts-expect-error - turbopack.root is a valid config option despite not being typed
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
