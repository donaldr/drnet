import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  //const nextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/work",
        destination: "/",
      },
      {
        source: "/work/:slug",
        destination: "/",
      },
      {
        source: "/resume",
        destination: "/",
      },
      {
        source: "/contact",
        destination: "/",
      },
    ];
  },
  webpack: (config, options) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: ["raw-loader", "glslify-loader"],
    });

    return config;
  },
};

export default nextConfig;
