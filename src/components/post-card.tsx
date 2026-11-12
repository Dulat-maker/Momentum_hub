import Link from "next/link";

import { timeAgo } from "@/lib/format";
import { CATEGORY_LABELS, type PostWithTeam, countOf } from "@/lib/types";

import { MessageIcon } from "./icons";
import { PostLikeButton } from "./like-buttons";
import { TeamAvatar } from "./team-avatar";

export function PostCard({
  post,
  liked,
  canLike,
}: {
  post: PostWithTeam;
  liked: boolean;
  canLike: boolean;
}) {
  const author = post.team;

  return (
    <article className="card card-link relative p-5">
      <Link
        href={`/community/${post.id}`}
        className="absolute inset-0 rounded-2xl"
        aria-label={post.title}
      />

      <div className="flex items-start gap-3">
        <TeamAvatar
          name={author?.name ?? "?"}
          logoUrl={author?.logo_url}
          size="md"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-fg-dim">
            <span className="chip border-accent/25 text-accent">
              {CATEGORY_LABELS[post.category]}
            </span>
            {author ? (
              <span className="truncate">
                #{author.team_number} {author.name}
              </span>
            ) : null}
            <span aria-hidden="true">·</span>
            <span>{timeAgo(post.created_at)}</span>
          </div>

          <h3 className="mt-2 text-base leading-snug font-semibold">
            {post.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-sm text-fg-muted">
            {post.body}
          </p>

          <div className="relative mt-4 flex items-center gap-2">
            <PostLikeButton
              id={post.id}
              liked={liked}
              count={countOf(post.likes)}
              canLike={canLike}
            />
            <span className="chip">
              <MessageIcon className="size-3.5" />
              {countOf(post.comments)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
