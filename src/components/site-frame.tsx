import type { ReactNode } from 'react';
import { SITE_URL } from '@/lib/config';

/**
 * The page chrome every route shares: the mark, the content column, the footer.
 *
 * Intentionally plain. This site is a waiting room — somebody tapped an Esporta
 * link on a device without the app, and the only two things they need are "what
 * was I sent" and "how do I get the app". Anything else competes with those.
 */
export function SiteFrame({ children }: { children: ReactNode }) {
  return (
    <div className="page">
      <a className="brand" href={SITE_URL} aria-label="Esporta home">
        <span className="brand-mark" aria-hidden="true">
          E
        </span>
        Esporta
      </a>
      <main className="shell">{children}</main>
      <footer className="footer">
        Esporta — the esports marketplace. <a href={SITE_URL}>app.esporta.site</a>
      </footer>
    </div>
  );
}

/** The verified tick, in brand green. Same meaning as the badge in the app. */
export function VerifiedTick() {
  return (
    <svg className="tick" viewBox="0 0 24 24" fill="currentColor" role="img" aria-label="Verified">
      <path d="M12 1.6 14.7 4l3.5-.5 1 3.4 3 1.9-1.4 3.2 1.4 3.2-3 1.9-1 3.4-3.5-.5L12 22.4 9.3 20l-3.5.5-1-3.4-3-1.9L4.2 12 2.8 8.8l3-1.9 1-3.4L10.3 4 12 1.6Zm-1.2 13.6 5.4-5.4-1.5-1.5-3.9 3.9-2-2-1.5 1.5 3.5 3.5Z" />
    </svg>
  );
}

/**
 * An avatar, or the first letter when there is none.
 *
 * A plain `<img>` rather than `next/image` on purpose — see the note in
 * `next.config.ts`: these URLs come from R2, Cloudflare Stream and Supabase
 * Storage, and an allowlist would blank them out the day a bucket changes.
 */
export function Avatar({
  src,
  name,
  large = false,
}: {
  src: string | null;
  name: string;
  large?: boolean;
}) {
  const className = large ? 'avatar avatar-lg' : 'avatar';
  if (src) {
    return <img className={className} src={src} alt="" width={large ? 72 : 44} height={large ? 72 : 44} />;
  }
  return (
    <span className={`${className} avatar-fallback`} aria-hidden="true">
      {name.trim().charAt(0) || 'E'}
    </span>
  );
}
