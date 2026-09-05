import { buildLinkMetadata, LinkPage } from '@/components/link-page';
import type { Metadata } from 'next';

/**
 * `https://app.esporta.site/op/<otherProfileId>` — any non-personal profile:
 * esports team, news page, tournament organiser, and every other
 * `team_categories` kind.
 */
type Params = { params: Promise<{ id: string }> };

export function generateMetadata({ params }: Params): Promise<Metadata> {
  return params.then(({ id }) => buildLinkMetadata('op', id));
}

export default async function OtherProfileLinkPage({ params }: Params) {
  const { id } = await params;
  return <LinkPage segment="op" id={id} />;
}
