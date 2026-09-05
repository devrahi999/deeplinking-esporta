/**
 * Formatting helpers.
 *
 * All of them are **locale-independent on purpose**. These pages are cached and
 * server-rendered, so a format that depended on the request's locale or the
 * server's timezone would either produce a hydration mismatch or serve one
 * visitor's formatting to the next one out of the CDN. Fixed `en`/`en-GB` and
 * explicit UTC keep a cached page correct for everybody.
 */

const COUNT = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

const DATE = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** `1200` → `1.2K`. */
export function formatCount(value: number): string {
  return COUNT.format(value);
}

/** An ISO timestamp → `4 Sep 2026`, or null when unparseable. */
export function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : DATE.format(date);
}

/** `0:42`, `12:05`, `1:02:30`. */
export function formatDuration(seconds: number | null): string | null {
  if (seconds === null || !Number.isFinite(seconds) || seconds <= 0) return null;
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`;
}

/**
 * A lookup slug → a label.
 *
 * The known ids are spelled out so the common cases read the way the app words
 * them, and anything unrecognised is title-cased rather than dropped: `roles` and
 * `team_categories` are operator-editable tables, and a new row must not render
 * as a blank chip on this page.
 */
const LABELS: Record<string, string> = {
  player: 'Player',
  coach: 'Coach',
  manager: 'Manager',
  analyst: 'Analyst',
  content_creator: 'Content Creator',
  caster: 'Caster',
  esports_team: 'Esports Team',
  esports_org: 'Esports Organisation',
  news_media: 'News & Media',
  tournament_organizer: 'Tournament Organiser',
};

export function labelize(slug: string | null): string | null {
  if (!slug) return null;
  return (
    LABELS[slug] ??
    slug
      .split(/[_\-\s]+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  );
}

/** Trims a caption for a meta description without cutting a word in half. */
export function truncate(text: string, max = 200): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
