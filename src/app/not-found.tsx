import type { Metadata } from 'next';
import { GetApp } from '@/components/get-app';
import { SiteFrame } from '@/components/site-frame';

/**
 * The 404 page, and it is a real 404: every route here reaches it by calling
 * `notFound()`, which sets the status code, so a crawler and a chat client both
 * learn the link is dead instead of caching a 200 that says "nothing here".
 *
 * It answers three cases with one page, on purpose — the wording never implies
 * which one it was:
 *
 *  * an id that does not exist, or a malformed one somebody mangled in a paste;
 *  * a post that was deleted, or an account that was closed;
 *  * a post that exists but is not public — followers-only or team-only.
 *
 * That last case is why this page must not say "deleted". The preview endpoint
 * answers the same 404 for private as for nonexistent, and this page keeps that
 * promise: confirming that a hidden post exists would leak exactly what its
 * author chose not to share.
 */
export const metadata: Metadata = {
  title: 'Link not found — Esporta',
  description: 'This Esporta link does not point to anything that can be shown.',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <SiteFrame>
      <article className="card card-pad">
        <p className="eyebrow">Esporta link</p>
        <h1 className="title">This link isn&rsquo;t available</h1>
        <p className="body muted">
          It may have been removed, or it may be private. Double-check the link — if somebody sent it
          to you, ask them to share it again.
        </p>
      </article>
      <GetApp lead="Already on Esporta? Open the app to find what you were looking for." />
    </SiteFrame>
  );
}
