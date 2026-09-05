import { buildLinkMetadata, LinkPage } from '@/components/link-page';
import type { Metadata } from 'next';

/**
 * `https://app.esporta.site/p/<postId>` — a post.
 *
 * A real route, not a rewrite. See `@/components/link-page` for why, and for why
 * nothing here redirects.
 */
type Params = { params: Promise<{ id: string }> };

export function generateMetadata({ params }: Params): Promise<Metadata> {
  return params.then(({ id }) => buildLinkMetadata('p', id));
}

export default async function PostLinkPage({ params }: Params) {
  const { id } = await params;
  return <LinkPage segment="p" id={id} />;
}
