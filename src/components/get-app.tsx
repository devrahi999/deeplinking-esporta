import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/config';

/**
 * The "Get Esporta" call to action.
 *
 * **Deliberately does not try to open the app.** When the app is installed and
 * the domain is verified, Android App Links and iOS Universal Links hand the URL
 * over at the OS level and this page is never rendered — so anyone reading it has
 * already been established as not having the app, or as being on a client that
 * bypassed the association. Firing a scheme or `intent://` redirect at that
 * visitor is the classic way to produce an "unknown address" interstitial or a
 * redirect loop, and it would need an app-side intent filter that does not exist
 * yet. Nothing here touches the deep-link chain: the URL stays exactly as shared.
 *
 * Both platforms are always offered, and no user agent is inspected — sniffing
 * would make every response uncacheable to save a visitor one glance.
 */
export function GetApp({ lead }: { lead?: string }) {
  return (
    <section className="cta" aria-labelledby="get-esporta">
      <h2 className="eyebrow" id="get-esporta" style={{ textAlign: 'center', margin: 0 }}>
        Get Esporta
      </h2>
      <p className="cta-lead">{lead ?? 'Open this on Esporta to see it in full.'}</p>
      <a className="btn btn-primary" href={PLAY_STORE_URL} rel="noopener">
        Get it on Google Play
      </a>
      {APP_STORE_URL ? (
        <a className="btn btn-secondary" href={APP_STORE_URL} rel="noopener">
          Download on the App Store
        </a>
      ) : (
        // No listing yet. An inert chip is honest; a link to a search page or a
        // dead itms:// URL is not.
        <span className="btn btn-inert" aria-disabled="true">
          iOS — coming soon
        </span>
      )}
    </section>
  );
}
