import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    // Direct LAN access (mobile / other devices on the network)
    "172.20.10.4",
    // Wildcard subdomain testing on localhost
    "*.localhost",
    // Wildcard subdomain testing on the LAN IP — e.g. tenant.172.20.10.4:3000
    // Note: browsers don't support wildcard IP subdomains in practice, but
    // Next.js dev server uses this list for cross-origin cookie/request allowance
    "*.172.20.10.4",
  ],
};

export default nextConfig;
