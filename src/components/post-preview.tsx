import { formatCount, formatDate, formatDuration } from '@/lib/format';
import type { LinkPreview } from '@/lib/preview';
import { Avatar, VerifiedTick } from './site-frame';

/**
 * A post or a short, as much of it as a signed-out visitor is entitled to see.
 *
 * Whatever the backend returned is all there is: private and deleted posts never
 * reach this component, they 404 upstream. So there is no visibility check here —
 * adding one would imply the data might be sensitive, which would be the wrong
 * mental model for a page served to the whole internet.
 */
export function PostPreview({ preview }: { preview: LinkPreview }) {
  const post = preview.post;
  if (!post) return null;

  const { author } = post;
  const name = author.display_name || author.username || 'Esporta';
  const isShort = preview.kind === 'short';
  const lead = post.media[0] ?? null;
  const image = lead?.thumbnail_url ?? (lead?.media_type === 'image' ? lead.url : null);
  const duration = formatDuration(lead?.duration_seconds ?? null);
  const posted = formatDate(post.created_at);
  const extraMedia = post.media.length - 1;

  return (
    <article className="card">
      <div className="card-pad">
        <p className="eyebrow">{isShort ? 'Short on Esporta' : 'Post on Esporta'}</p>
        <div className="who">
          <Avatar src={author.avatar_url} name={name} />
          <div className="who-text">
            <div className="who-name">
              {name}
              {author.verified ? <VerifiedTick /> : null}
            </div>
            {author.username ? <div className="who-handle">@{author.username}</div> : null}
          </div>
        </div>
      </div>

      {image ? (
        <div className="media">
          {/* Plain <img>: see next.config.ts on why next/image is not used here. */}
          <img
            src={image}
            alt={post.caption ? `Attachment from ${name}` : `Post by ${name}`}
            width={lead?.width ?? undefined}
            height={lead?.height ?? undefined}
          />
          {isShort || lead?.media_type === 'video' ? (
            <span className="media-badge">{duration ? `▶ ${duration}` : '▶ Video'}</span>
          ) : null}
        </div>
      ) : null}

      <div className="card-pad">
        {post.caption ? (
          <p className="body">{post.caption}</p>
        ) : (
          <p className="body muted">No caption.</p>
        )}

        <ul className="stats">
          <li>
            <b>{formatCount(post.reactions_count)}</b> reactions
          </li>
          <li>
            <b>{formatCount(post.comments_count)}</b> comments
          </li>
          {extraMedia > 0 ? (
            <li>
              <b>+{extraMedia}</b> more {extraMedia === 1 ? 'attachment' : 'attachments'}
            </li>
          ) : null}
          {posted ? <li>{posted}</li> : null}
        </ul>
      </div>
    </article>
  );
}
