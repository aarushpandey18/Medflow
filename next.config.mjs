const backendUrl = process.env.BACKEND_INTERNAL_URL ?? process.env.BACKEND_URL ?? "http://localhost:4000";

const nextConfig = {
  async rewrites() {
    if (process.env.VERCEL) {
      return [];
    }
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
