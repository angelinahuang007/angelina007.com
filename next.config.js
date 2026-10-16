/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Disable the optimizer endpoint until Next/Sharp are upgraded past
    // GHSA-2xp9-vwfh-vxw4. Serve original images without server-side decoding.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
  output: 'standalone',
};

module.exports = nextConfig;
