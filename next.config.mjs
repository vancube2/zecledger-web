/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The Ironwood route reads proto/ironwood.proto at runtime, so it has to be
  // included in the serverless bundle rather than tree-shaken away.
  outputFileTracingIncludes: {
    "/api/ironwood": ["./proto/**/*"],
  },
};
export default nextConfig;
