import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    // Direct LAN access (mobile / other devices on the network)
    "172.20.10.4",
    // Localhost — all tenant paths served from same origin now
    "localhost",
  ],
};

export default nextConfig;
