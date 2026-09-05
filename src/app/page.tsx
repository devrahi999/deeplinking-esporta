import { GetApp } from '@/components/get-app';
import { SiteFrame } from '@/components/site-frame';

/**
 * `https://app.esporta.site/` — the landing page.
 *
 * This host exists to serve deep links, so the root is the smallest honest thing:
 * what Esporta is, how to get it, and what the link shapes are. It is not a
 * marketing site and should not grow into one — the four link routes are the
 * product here.
 *
 * Static: it reads nothing, so it prerenders and costs nothing to serve.
 */
export default function LandingPage() {
  return (
    <SiteFrame>
      <section className="hero">
        <h1>Esporta links open in the app</h1>
        <p>
          Esporta is where players, teams, organisers and creators find each other. Tap an Esporta
          link on a phone with the app installed and it opens straight to the post or profile.
        </p>
      </section>

      <GetApp lead="Don’t have it yet?" />

      <article className="card card-pad">
        <p className="eyebrow">Link formats</p>
        <ul className="linkgrid">
          <li>
            <code>/p/…</code>
            <span className="muted">a post</span>
          </li>
          <li>
            <code>/s/…</code>
            <span className="muted">a short</span>
          </li>
          <li>
            <code>/pp/…</code>
            <span className="muted">a personal profile</span>
          </li>
          <li>
            <code>/op/…</code>
            <span className="muted">a team, organiser or news page</span>
          </li>
        </ul>
        <p className="body small muted">
          Without the app, each of these opens a preview here instead — the link never breaks.
        </p>
      </article>
    </SiteFrame>
  );
}
