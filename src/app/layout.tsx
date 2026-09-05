import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { SITE_URL } from '@/lib/config';
import '@/styles/globals.css';

/**
 * `metadataBase` is what makes every relative URL in a child route's metadata
 * resolve to `https://app.esporta.site/...`. Without it, `og:url` and `canonical`
 * are emitted relative, and a scraper that follows them lands nowhere.
 *
 * The title template is `%s` — pages here compose their own complete titles
 * ("Rahi (@rahi) on Esporta"), because a link preview card shows the title alone
 * and a trailing " | Esporta" would eat the part that matters on a narrow screen.
 *
 * The `default` title is only ever used if a route forgets to set one: this host
 * has **no landing page**, so `/` itself is a 404 handled by `not-found.tsx`.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Esporta',
    template: '%s',
  },
  description: 'Open Esporta links on your phone to see them in the app.',
  applicationName: 'Esporta',
  openGraph: { siteName: 'Esporta', type: 'website' },
  // Served from public/favicon.ico. Declared rather than left to the browser's
  // root-path convention so the tag is in the HTML a scraper reads.
  icons: { icon: '/favicon.ico', shortcut: '/favicon.ico', apple: '/favicon.ico' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // The page follows the device: the palette has a designed light mode, so both
  // are declared rather than forcing dark chrome onto a light phone.
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
    { media: '(prefers-color-scheme: light)', color: '#f2f4f3' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
