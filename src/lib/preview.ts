import { API_BASE_URL, PREVIEW_REVALIDATE_SECONDS } from './config';
import type { LinkSegment, PreviewKind } from './links';

export interface PreviewMedia {
  media_type: string | null;
  url: string | null;
  thumbnail_url: string | null;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
}

export interface PreviewAuthor {
  id: string;
  kind: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  verified: boolean;
}

export interface LinkPreview {
  kind: PreviewKind;
  id: string;
  /** Canonical path for what was actually found — may differ from the requested prefix. */
  path: string;
  title: string;
  description: string | null;
  image: string | null;
  post?: {
    caption: string | null;
    created_at: string;
    reactions_count: number;
    comments_count: number;
    media: PreviewMedia[];
    author: PreviewAuthor;
  };
  profile?: {
    identity_kind: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    cover_url: string | null;
    short_bio: string | null;
    bio: string | null;
    country: string | null;
    city: string | null;
    verified: boolean;
    followers_count: number;
    created_at: string;
    role_id: string | null;
    category_id: string | null;
    tag: string | null;
    members_count: number | null;
    recruiting: boolean | null;
  };
}

/**
 * Three outcomes, and the difference between the last two is the whole point.
 *
 * * `ok` — render the preview.
 * * `dead` — the backend said 404. The link points at nothing the public can see:
 *   a wrong id, a deleted post, a private one, a closed account. Render the
 *   not-found page and answer HTTP 404.
 * * `unavailable` — the request itself failed (API down, misconfigured base URL,
 *   timeout). **This must not render as not-found.** A shared link is not dead
 *   because our API had a bad minute, and telling a scraper it is 404 poisons the
 *   preview card for everyone who sees that message later. Render the generic
 *   "open this in Esporta" fallback and answer 200.
 */
export type PreviewResult =
  | { status: 'ok'; preview: LinkPreview }
  | { status: 'dead' }
  | { status: 'unavailable' };

interface Envelope {
  success?: boolean;
  data?: LinkPreview | null;
  error?: { code?: string; message?: string } | null;
}

/**
 * Reads one link preview from the backend's public endpoint.
 *
 * Server-side only, and cached: `revalidate` means a link doing the rounds in a
 * group chat costs one upstream request per five minutes rather than one per
 * view. No `Authorization` header exists to send — the endpoint is `@Public()`
 * and reads as `anon`, so what comes back is exactly what a signed-out visitor is
 * entitled to see.
 */
export async function fetchPreview(segment: LinkSegment, id: string): Promise<PreviewResult> {
  if (!API_BASE_URL) return { status: 'unavailable' };

  let response: Response;
  try {
    response = await fetch(
      `${API_BASE_URL}/public/preview/${segment}/${encodeURIComponent(id)}`,
      {
        headers: { Accept: 'application/json' },
        next: { revalidate: PREVIEW_REVALIDATE_SECONDS },
      },
    );
  } catch {
    return { status: 'unavailable' };
  }

  if (response.status === 404) return { status: 'dead' };
  if (!response.ok) return { status: 'unavailable' };

  let envelope: Envelope;
  try {
    envelope = (await response.json()) as Envelope;
  } catch {
    return { status: 'unavailable' };
  }

  const preview = envelope.data;
  if (envelope.success !== true || !preview?.kind) return { status: 'unavailable' };
  return { status: 'ok', preview };
}
