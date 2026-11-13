import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CommentForm } from "@/components/comment-form";
import { MessageIcon, TrashIcon } from "@/components/icons";
import { PostLikeButton } from "@/components/like-buttons";
import { SetupNotice } from "@/components/setup-notice";
import { IconSubmitButton } from "@/components/submit-button";
import { TeamAvatar } from "@/components/team-avatar";
import { TeamTag } from "@/components/team-tag";
import {
  deleteCommentAction,
  deletePostAction,
} from "@/lib/actions/community";
import { getCurrentTeam } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  CATEGORY_LABELS,
  type PostComment,
  type PostWithTeam,
  countOf,
  teamHref,
} from "@/lib/types";

const POST_DETAIL_SELECT = [
  "id",
  "team_id",
  "title",
  "body",
  "category",
  "created_at",
  "team:teams!posts_team_id_fkey(id, program, team_number, name, city, logo_url)",
  "likes:post_likes(count)",
  "comments:post_comments(count)",
].join(", ");

async function loadPost(id: string): Promise<PostWithTeam | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(POST_DETAIL_SELECT)
    .eq("id", id)
    .maybeSingle();

  return (data as unknown as PostWithTeam | null) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  if (!isSupabaseConfigured) return { title: "Community" };

  const { id } = await params;
  const post = await loadPost(id);

  if (!post) return { title: "Post not found" };

  return { title: post.title, description: post.body.slice(0, 150) };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured) {
    return (
      <div className="px-4 py-16 sm:px-6">
        <SetupNotice />
      </div>
    );
  }

  const { id } = await params;
  const post = await loadPost(id);

  if (!post) notFound();

  const supabase = await createClient();
  const [{ data: commentData }, team] = await Promise.all([
    supabase
      .from("post_comments")
      .select(
        "id, post_id, team_id, body, created_at, team:teams(id, program, team_number, name, city, logo_url)",
      )
      .eq("post_id", id)
      .order("created_at", { ascending: true }),
    getCurrentTeam(),
  ]);

  const comments = (commentData ?? []) as unknown as PostComment[];

  const liked = team
    ? Boolean(
        (
          await supabase
            .from("post_likes")
            .select("post_id")
            .eq("post_id", id)
            .eq("team_id", team.id)
            .maybeSingle()
        ).data,
      )
    : false;

  const author = post.team;
  const isAuthor = team?.id === post.team_id;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/community"
        className="text-sm text-fg-muted transition-colors hover:text-fg"
      >
        &larr; Back to community
      </Link>

      <article className="card mt-6 p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <TeamAvatar
              name={author?.name ?? "?"}
              logoUrl={author?.logo_url}
              size="md"
            />
            <div className="min-w-0">
              {author ? (
                <Link
                  href={teamHref(author)}
                  className="text-sm font-medium hover:text-brand-mid"
                >
                  <TeamTag team={author} />
                </Link>
              ) : (
                <span className="text-sm text-fg-dim">Team removed</span>
              )}
              <p className="text-xs text-fg-dim">{timeAgo(post.created_at)}</p>
            </div>
          </div>

          {isAuthor ? (
            <form action={deletePostAction}>
              <input type="hidden" name="post_id" value={post.id} />
              <IconSubmitButton
                className="btn btn-danger btn-sm"
                title="Delete this post"
              >
                <TrashIcon className="size-4" />
              </IconSubmitButton>
            </form>
          ) : null}
        </div>

        <span className="chip mt-5 border-brand-mid/25 text-brand-soft">
          {CATEGORY_LABELS[post.category]}
        </span>

        <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">
          {post.title}
        </h1>

        <p className="mt-4 text-sm leading-relaxed whitespace-pre-line text-fg-muted">
          {post.body}
        </p>

        <div className="mt-6 flex items-center gap-2 border-t border-line pt-5">
          <PostLikeButton
            id={post.id}
            liked={liked}
            count={countOf(post.likes)}
            canLike={Boolean(team)}
            size="lg"
          />
          <span className="chip">
            <MessageIcon className="size-3.5" />
            {comments.length}
          </span>
        </div>
      </article>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">
          Replies
          <span className="ml-2 text-sm font-normal text-fg-dim">
            {comments.length}
          </span>
        </h2>

        <div className="mt-5 space-y-3">
          {comments.length === 0 ? (
            <p className="text-sm text-fg-dim">
              No replies yet. Be the team that helps.
            </p>
          ) : (
            comments.map((comment) => (
              <article key={comment.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <TeamAvatar
                    name={comment.team?.name ?? "?"}
                    logoUrl={comment.team?.logo_url}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-fg-dim">
                      {comment.team ? (
                        <Link
                          href={teamHref(comment.team)}
                          className="font-medium text-fg-muted hover:text-fg"
                        >
                          <TeamTag team={comment.team} />
                        </Link>
                      ) : (
                        <span>Team removed</span>
                      )}
                      <span aria-hidden="true">·</span>
                      <span>{timeAgo(comment.created_at)}</span>
                    </div>
                    <p className="mt-1.5 text-sm whitespace-pre-line text-fg-muted">
                      {comment.body}
                    </p>
                  </div>

                  {team?.id === comment.team_id ? (
                    <form action={deleteCommentAction}>
                      <input
                        type="hidden"
                        name="comment_id"
                        value={comment.id}
                      />
                      <input type="hidden" name="post_id" value={post.id} />
                      <IconSubmitButton title="Delete your reply">
                        <TrashIcon className="size-4" />
                      </IconSubmitButton>
                    </form>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </div>

        <div className="card mt-6 p-5">
          {team ? (
            <>
              <p className="mb-3 text-xs text-fg-dim">
                Replying as <TeamTag team={team} />
              </p>
              <CommentForm postId={post.id} />
            </>
          ) : (
            <p className="text-sm text-fg-muted">
              <Link
                href={`/login?next=/community/${post.id}`}
                className="text-brand-mid underline decoration-brand-mid/40 underline-offset-4"
              >
                Log in with your team account
              </Link>{" "}
              to reply.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
