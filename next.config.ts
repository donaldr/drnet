import type { NextConfig } from "next";
//import CopyWebpackPlugin from 'copy-webpack-plugin';
import path from "path";

const nextConfig: NextConfig = {
  devIndicators: {
    appIsrStatus: false,
  },
  images: {
    domains: ["til8tmqclrhrb7ie.public.blob.vercel-storage.com"],
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
    
      /*
      config.plugins.push(
        new CopyWebpackPlugin({
          patterns: [
            {
              from: path.resolve(__dirname, 'node_modules/@dimforge/rapier3d/rapier_wasm3d_bg.wasm'),
              to: path.resolve(__dirname, 'public/rapier_wasm3d_bg.wasm'),
            },
          ],
        })
      )
      */
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
