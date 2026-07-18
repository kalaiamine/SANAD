import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse and tesseract.js spawn worker threads with paths that break when bundled.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "@napi-rs/canvas", "tesseract.js"],
};

export default nextConfig;
