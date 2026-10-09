import type { NextConfig } from "next";

// The order emails attach the trip summary page as a PDF, rendered with a bundled Chromium.
const chromiumFiles = ["./node_modules/@sparticuz/chromium/bin/**/*"];

const nextConfig: NextConfig = {
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  outputFileTracingIncludes: {
    "/api/order": chromiumFiles,
    "/api/stripe-webhook": chromiumFiles,
    "/order/success": chromiumFiles,
  },
};

export default nextConfig;
