import { withBotId } from "botid/next/config";
import type { NextConfig } from "next";

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
  "style-src 'self' 'unsafe-inline' https://vercel.live",
  // Page images come resized from next/image on this origin; parsed figures come as data
  "img-src 'self' data: blob: https://vercel.live https://vercel.com",
  "font-src 'self' data: https://vercel.live https://assets.vercel.com",
  // Uploads go from the browser straight to storage, through presigned links
  "connect-src 'self' https://*.amazonaws.com https://vercel.live wss://ws-us3.pusher.com",
  "frame-src https://vercel.live",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  // The fonts the server draws Word and PowerPoint pages with
  outputFileTracingIncludes: {
    "/api/files/*/pages/*": ["./vendor/powerbottom/fonts/*"],
  },
  // Clear of the sidebar's footer
  devIndicators: { position: "bottom-right" },
  experimental: {
    // A parse result never changes and a chat polls its own state, so pages
    // visited in the last minutes open from the client cache
    staleTimes: { dynamic: 300 },
  },
  // Page images are full-size scans, which next/image resizes to where they
  // show. A resized page keeps as long as its route lets it, which is until
  // the chat expires; the floor here is low so it can't outlast that. The
  // resizer fetches nothing else, a 100 MB file under /api/files least of all.
  images: {
    minimumCacheTTL: 60,
    localPatterns: [{ pathname: "/api/chats/*/pages/**", search: "" }],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), camera=(), microphone=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
      // Nothing the API serves runs as a page: an uploaded file opened from
      // its link gets no script and no origin of its own
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "sandbox; default-src 'none'",
          },
        ],
      },
    ];
  },
};

export default withBotId(nextConfig);
