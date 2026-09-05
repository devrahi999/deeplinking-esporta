import { buildLinkMetadata, LinkPage } from '@/components/link-page';
import type { Metadata } from 'next';

/** `https://app.esporta.site/s/<shortId>` — a short. A short is a post row with `type_id = 'short'`. */
type Params = { params: Promise<{ id: string }> };

export function generateMetadata({ params }: Params): Promise<Metadata> {
  return params.then(({ id }) => buildLinkMetadata('s', id));
}

export default async function ShortLinkPage({ params }: Params) {
  const { id } = await params;
  return <LinkPage segment="s" id={id} />;
}
