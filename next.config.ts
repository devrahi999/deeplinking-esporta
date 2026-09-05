import type { NextConfig } from 'next';

/**
 * `app.esporta.site` — the deep-link host.
 *
 * Two jobs, and the config exists almost entirely for the first one:
 *
 *  1. **Serve the two association files byte-for-byte at `/.well-known/`.** They
 *     live in `public/.well-known/`, which Next copies to the deployment root, so
 *     no rewrite touches them. The `headers()` block below forces
 *     `application/json` on both — `apple-app-site-association` has no file
 *     extension, so every host that guesses a MIME type from the name gets it
 *     wrong (usually `application/octet-stream`), and iOS then refuses the file.
 *     `assetlinks.json` gets the header too rather than relying on the extension.
 *
 *  2. Render a browser fallback for `/p/*`, `/s/*`, `/pp/*`, `/op/*`. These are
 *     real App Router routes, NOT rewrites to a single shell — a catch-all
 *     rewrite is exactly what serves HTML from `/.well-known/` and silently
 *     breaks App Link verification.
 *
 * There is deliberately **no `images` block and no `next/image`**. Post
 * attachments come from Cloudflare R2, Cloudflare Stream and Supabase Storage,
 * on hostnames an operator can change without touching this repo, and a
 * `remotePatterns` allowlist would blank out previews the day a new bucket
 * appears. Same reasoning as `core-admin/next.config.ts`.
 *
 * There is also no `redirects()`. Canonical Esporta URLs must stay exactly as
 * shared: a redirect would change the URL the OS is asked to match.
 */
const WELL_KNOWN_JSON = [
  { key: 'Content-Type', value: 'application/json' },
  // Public by definition, and read by verifiers rather than browsers.
  { key: 'Cache-Control', value: 'public, max-age=300, s-maxage=3600' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
];

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Pin the workspace root to this directory. Without it Next walks up, finds the
  // repository root's package-lock.json and treats the whole Esporta checkout as
  // the workspace — which makes file tracing consider the Flutter app and the
  // other Node projects when bundling. `esporta-deeplinking/` is self-contained
  // and is what Vercel's Root Directory points at.
  turbopack: { root: import.meta.dirname },
  outputFileTracingRoot: import.meta.dirname,

  async headers() {
    return [
      { source: '/.well-known/apple-app-site-association', headers: WELL_KNOWN_JSON },
      { source: '/.well-known/assetlinks.json', headers: WELL_KNOWN_JSON },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // A shared link is meant to be embedded as a preview card, never framed
          // as a page.
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

export default config;
