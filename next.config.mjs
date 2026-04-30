/** @type {import('next').NextConfig} */
const nextConfig = {
  // swisseph-wasm uses Node's createRequire / fs / path internally; Webpack
  // can't bundle that correctly. Mark it external for the server build so
  // Node loads it natively at runtime.
  experimental: {
    serverComponentsExternalPackages: ["swisseph-wasm"],
  },
};

export default nextConfig;
