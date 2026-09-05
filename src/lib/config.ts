/**
 * Everything the site needs to know about its own identity, in one place.
 *
 * Values come from the environment so a preview deployment can point at a
 * staging backend without a code change, but each one has a sane production
 * default: a missing variable must never turn a shared link into a broken page.
 */

/** The origin this site is served from. Canonical URLs and `og:url` are built on it. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://app.esporta.site').replace(
  /\/+$/,
  '',
);

/**
 * The esporta-backend API root, including `/api/v1`.
 *
 * Read server-side only — it is not `NEXT_PUBLIC_`, so it never reaches the
 * browser bundle, and no page fetches previews from the client.
 */
export const API_BASE_URL = (process.env.ESPORTA_API_BASE_URL ?? '').replace(/\/+$/, '');

/** Android application id, from `android/app/build.gradle.kts`. */
export const ANDROID_PACKAGE = 'com.esporta.esporta';

export const PLAY_STORE_URL =
  process.env.NEXT_PUBLIC_PLAY_STORE_URL ??
  `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;

/**
 * Empty until the App Store listing exists. The CTA renders an inert
 * "coming soon" chip rather than a link to nowhere — see `GetApp`.
 */
export const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL?.trim() || null;

/**
 * How long a rendered preview may be reused.
 *
 * Five minutes: long enough that a link going around a group chat hits Postgres
 * once, short enough that an edited caption or a changed avatar is not stale for
 * an afternoon. The backend adds its own 60s CDN window on top.
 */
export const PREVIEW_REVALIDATE_SECONDS = 300;
