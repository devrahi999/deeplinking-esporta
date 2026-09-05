import { formatCount, formatDate, labelize } from '@/lib/format';
import type { LinkPreview } from '@/lib/preview';
import { Avatar, VerifiedTick } from './site-frame';

/**
 * A profile card — personal (`/pp/…`) or any other profile kind (`/op/…`):
 * esports team, news page, tournament organiser.
 *
 * One component for both, because the difference is which fields are populated,
 * not what the card is. The role chip comes from `roles` for a personal identity
 * and `team_categories` for the rest, and both arrive on the same field pair.
 */
export function ProfilePreview({ preview }: { preview: LinkPreview }) {
  const profile = preview.profile;
  if (!profile) return null;

  const name = profile.display_name || profile.username || 'Esporta';
  const isPersonal = profile.identity_kind === 'personal';
  const kindLabel = labelize(isPersonal ? profile.role_id : profile.category_id);
  const where = [profile.city, profile.country].filter(Boolean).join(', ') || null;
  const bio = profile.short_bio?.trim() || profile.bio?.trim() || null;
  const joined = formatDate(profile.created_at);

  return (
    <article className="card">
      <p className="eyebrow card-pad" style={{ paddingBottom: 0, margin: 0 }}>
        {isPersonal ? 'Profile on Esporta' : 'Page on Esporta'}
      </p>

      {profile.cover_url ? (
        <div className="cover">
          {/* Plain <img>: see next.config.ts on why next/image is not used here. */}
          <img src={profile.cover_url} alt="" />
        </div>
      ) : null}

      <div className="card-pad">
        <div className="who">
          <Avatar src={profile.avatar_url} name={name} large />
          <div className="who-text">
            <h1 className="who-name title" style={{ fontSize: '1.25rem' }}>
              {name}
              {profile.verified ? <VerifiedTick /> : null}
            </h1>
            {profile.username ? <div className="who-handle">@{profile.username}</div> : null}
          </div>
        </div>

        {bio ? <p className="body">{bio}</p> : null}

        <div className="chips">
          {kindLabel ? <span className="chip chip-accent">{kindLabel}</span> : null}
          {profile.tag ? <span className="chip">{profile.tag}</span> : null}
          {where ? <span className="chip">{where}</span> : null}
          {profile.recruiting ? <span className="chip chip-accent">Recruiting</span> : null}
        </div>

        <ul className="stats">
          <li>
            <b>{formatCount(profile.followers_count)}</b> followers
          </li>
          {profile.members_count !== null ? (
            <li>
              <b>{formatCount(profile.members_count)}</b>{' '}
              {profile.members_count === 1 ? 'member' : 'members'}
            </li>
          ) : null}
          {joined ? <li>Joined {joined}</li> : null}
        </ul>
      </div>
    </article>
  );
}
