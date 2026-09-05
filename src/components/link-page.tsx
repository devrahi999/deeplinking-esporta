import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { absoluteUrl, type LinkSegment, segmentLabel } from '@/lib/links';
import { truncate } from '@/lib/format';
import { fetchPreview } from '@/lib/preview';
import { GetApp } from './get-app';
import { PostPreview } from './post-preview';
import { ProfilePreview } from './profile-preview';
import { SiteFrame } from './site-frame';

/**
 * The one implementation behind `/p/:id`, `/s/:id`, `/pp/:id` and `/op/:id`.
 *
 * The four routes exist as four real directories so that each is a static path in
 * the deployment rather than a rewrite — a catch-all rewrite is what serves HTML
 * from `/.well-known/` and quietly breaks App Link verification. They differ only
 * in the segment they pass here.
 *
 * **Nothing on this page redirects.** The URL a visitor arrived on is the URL a
 * link was shared as, and it stays in the address bar unchanged: if the id turns
 * out to be a short opened under `/p/`, that is expressed with a `canonical` link
 * and `og:url`, never a 301. Rewriting the URL would change what the OS is asked
 * to match the next time the same link is tapped with the app installed.
 *
 * Both `generateMetadata` and the component call `fetchPreview`. That is one
 * upstream request, not two — Next dedupes identical `fetch` calls within a
 * render pass, and the result is cached for `PREVIEW_REVALIDATE_SECONDS` anyway.
 */

const SITE_NAME = 'Esporta';

export async function buildLinkMetadata(segment: LinkSegment, id: string): Promise<Metadata> {
  const result = await fetchPreview(segment, id);
  const requestedUrl = absoluteUrl(`/${segment}/${id}`);

  if (result.status === 'dead') {
    return {
      title: 'Link not found — Esporta',
      description: 'This Esporta link does not point to anything that can be shown.',
      alternates: { canonical: requestedUrl },
      // A dead link must not enter an index, and a scraper must not cache a
      // preview card for it.
      robots: { index: false, follow: false },
    };
  }

  if (result.status === 'unavailable') {
    // Deliberately generic and still indexable-neutral: the resource probably
    // exists, we just could not read it this second, so nothing is asserted
    // about it either way.
    return {
      title: `Open this ${segmentLabel(segment)} in Esporta`,
      description: 'Open this link in the Esporta app.',
      alternates: { canonical: requestedUrl },
      robots: { index: false, follow: true },
      openGraph: { title: SITE_NAME, url: requestedUrl, siteName: SITE_NAME, type: 'website' },
    };
  }

  const { preview } = result;
  const canonical = absoluteUrl(preview.path);
  const description = preview.description ? truncate(preview.description) : undefined;
  const images = preview.image ? [{ url: preview.image }] : undefined;

  return {
    title: preview.title,
    description,
    alternates: { canonical },
    openGraph: {
      title: preview.title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: preview.kind === 'post' || preview.kind === 'short' ? 'article' : 'profile',
      images,
    },
    twitter: {
      card: preview.image ? 'summary_large_image' : 'summary',
      title: preview.title,
      description,
      images: preview.image ? [preview.image] : undefined,
    },
  };
}

export async function LinkPage({ segment, id }: { segment: LinkSegment; id: string }) {
  const result = await fetchPreview(segment, id);

  // A wrong id, a deleted post, a post that is not public, a closed account: all
  // arrive here as `dead`, all get a real HTTP 404 from `not-found.tsx`. The
  // backend answers the same 404 for "private" as for "nonexistent", so this page
  // cannot accidentally confirm that a hidden post exists.
  if (result.status === 'dead') notFound();

  if (result.status === 'unavailable') {
    return (
      <SiteFrame>
        <UnavailableCard segment={segment} />
        <GetApp lead="Get the app and this link will open straight to it." />
      </SiteFrame>
    );
  }

  const { preview } = result;
  const isPost = preview.kind === 'post' || preview.kind === 'short';

  return (
    <SiteFrame>
      {isPost ? <PostPreview preview={preview} /> : <ProfilePreview preview={preview} />}
      <GetApp
        lead={
          isPost
            ? 'Open this in Esporta to react, comment and see the rest.'
            : 'Open this in Esporta to follow, message and see the full profile.'
        }
      />
    </SiteFrame>
  );
}

/**
 * Shown when the preview API could not be reached — never for a link that is
 * genuinely dead.
 *
 * The distinction matters: a shared link is not broken because our backend had a
 * bad minute, and answering 404 would let a chat client cache "not found" as the
 * preview everybody sees afterwards. So this renders 200, says nothing about
 * whether the resource exists, and still gets the visitor to the app.
 */
function UnavailableCard({ segment }: { segment: LinkSegment }) {
  return (
    <article className="card card-pad">
      <p className="eyebrow">Esporta link</p>
      <h1 className="title">Open this {segmentLabel(segment)} in Esporta</h1>
      <p className="body muted">
        We could not load the preview just now. The link is fine — open it in the Esporta app to see
        it.
      </p>
    </article>
  );
}
