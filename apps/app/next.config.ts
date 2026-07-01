import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compile the workspace design system (raw TS/TSX) as part of the app build.
  transpilePackages: ["ui-system"],
};

export default nextConfig;
