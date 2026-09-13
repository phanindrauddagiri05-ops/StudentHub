import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack config (Next.js 16 default)
  turbopack: {
    resolveAlias: {
      // pdfjs-dist needs canvas excluded in browser builds
      canvas: { browser: './src/lib/pdf/canvas-stub.js' },
    },
  },
  images: {
    dangerouslyAllowSVG: false,
    remotePatterns: [],
  },
};

export default nextConfig;
