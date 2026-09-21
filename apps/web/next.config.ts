import type { NextConfig } from "next";

const R2_HOST = "https://pub-56eee1e388224dd293f25bccc68afdca.r2.dev";

// Content Security Policy.
//
// `script-src` keeps 'unsafe-inline' because Next.js emits inline hydration
// scripts and the GA4 snippet is inline. Tightening that needs per-request
// nonces, which means running the proxy on every route — deliberately not
// done: this site has no user-generated content, and the one injection sink
// (JSON-LD) is escaped at source in lib/jsonld.ts. Revisit if that changes.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${R2_HOST} https://www.googletagmanager.com https://picsum.photos`,
  `media-src 'self' ${R2_HOST}`,
  "font-src 'self' data:",
  [
    "connect-src 'self'",
    R2_HOST,
    "https://www.google-analytics.com",
    "https://*.google-analytics.com",
    "https://*.analytics.google.com",
    "https://www.googletagmanager.com",
    "https://vitals.vercel-insights.com",
  ].join(" "),
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Redundant with frame-ancestors, but honoured by older browsers.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "pub-56eee1e388224dd293f25bccc68afdca.r2.dev",
      },
    ],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // The control panel must never be indexed, whatever a page exports.
      {
        source: "/controlpanel/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
