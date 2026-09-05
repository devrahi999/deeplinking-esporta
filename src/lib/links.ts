import { SITE_URL } from './config';

/**
 * The canonical Esporta link grammar, as this website sees it.
 *
 * A deliberate mirror of `lib/core/services/esporta_links.dart` in the Flutter
 * app — same four segments, same meaning. The app owns the grammar; this file
 * only needs to recognise it well enough to render a page and emit a correct
 * `og:url`. Nothing here parses anything the app does not already publish.
 *
 * `pp` vs `op` follows `identities.kind`: a personal identity is `pp`, and every
 * non-personal one — esports team, news page, tournament organiser — is an
 * *other profile*, so `op`. As in the app, the prefix is a **hint**: the backend
 * resolves an id as the kind the link claims and falls back to the other, so a
 * link built with the wrong prefix still renders the right page.
 */
export const LINK_SEGMENTS = ['p', 's', 'pp', 'op'] as const;

export type LinkSegment = (typeof LINK_SEGMENTS)[number];

/** What a resolved link turned out to point at. Mirrors the backend's `kind`. */
export type PreviewKind = 'post' | 'short' | 'personal_profile' | 'other_profile';

const SEGMENT_LABELS: Record<LinkSegment, string> = {
  p: 'post',
  s: 'short',
  pp: 'profile',
  op: 'profile',
};

/** Human wording for a link whose target could not be loaded. */
export function segmentLabel(segment: LinkSegment): string {
  return SEGMENT_LABELS[segment];
}

/** `https://app.esporta.site` + an absolute path. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
