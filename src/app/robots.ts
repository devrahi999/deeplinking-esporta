import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/config';

/**
 * Explicit and permissive, for one reason: **the association files must stay
 * crawlable and fetchable.** Android's verifier and Apple's CDN do not read
 * `robots.txt`, but a blanket `Disallow: /` added later "to keep the fallback
 * pages out of Google" is the kind of change that also hides
 * `/.well-known/assetlinks.json` from every diagnostic tool and makes a broken
 * App Link very hard to explain. Writing the allow rule down makes that a
 * deliberate decision rather than an accident.
 *
 * The link routes themselves are marked `noindex` per-page in their metadata when
 * there is nothing worth indexing (dead links, failed previews); healthy previews
 * are left indexable, since they are the public face of a shared post.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    host: SITE_URL,
  };
}
