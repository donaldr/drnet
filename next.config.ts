import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    appIsrStatus: false,
  },
  images: {
    unoptimized: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "til8tmqclrhrb7ie.public.blob.vercel-storage.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
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
    // Enable WebAssembly support
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      topLevelAwait: true,
      layers: true,
    };

    // Set proper target for async/await support
    if (!options.isServer) {
      config.target = ["web", "es2020"];
    }

    // Handle WASM files properly
    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    });

    // Optimize for WebAssembly
    config.optimization = {
      ...config.optimization,
      moduleIds: "deterministic",
    };

    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: ["raw-loader", "glslify-loader"],
    });

    if (options.isServer) {
      config.resolve.alias["paper"] = false;
    } else {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }

    config.resolve.alias["onnxruntime-node"] = false;

    return config;
  },
};

export default nextConfig;
