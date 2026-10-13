import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // small self-contained server for Docker
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
