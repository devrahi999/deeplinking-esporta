import { buildLinkMetadata, LinkPage } from '@/components/link-page';
import type { Metadata } from 'next';

/**
 * `https://app.esporta.site/pp/<personalProfileId>` — a personal profile.
 *
 * The `pp` prefix is a hint rather than a fact: the backend resolves the id as a
 * personal identity first and falls back to the other kind, so a team id shared
 * under `/pp/` still renders the right page (with `/op/<id>` as its canonical).
 */
type Params = { params: Promise<{ id: string }> };

export function generateMetadata({ params }: Params): Promise<Metadata> {
  return params.then(({ id }) => buildLinkMetadata('pp', id));
}

export default async function PersonalProfileLinkPage({ params }: Params) {
  const { id } = await params;
  return <LinkPage segment="pp" id={id} />;
}
