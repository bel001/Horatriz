import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.100.7",
    "192.168.*",
    "192.168.0.*",
    "192.168.1.*",
    "192.168.100.*",
    "10.*",
    "172.*",
  ],
};

export default nextConfig;
