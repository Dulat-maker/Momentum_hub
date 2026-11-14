import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { MessageIcon } from "@/components/icons";
import { PostCard } from "@/components/post-card";
import { PostForm } from "@/components/post-form";
import { SetupNotice } from "@/components/setup-notice";
import { createPostAction } from "@/lib/actions/community";
import { getCurrentTeam } from "@/lib/auth";
import {
  POST_CARD_SELECT,
  describeQueryError,
  likedPostIds,
} from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  CATEGORY_HINTS,
  CATEGORY_LABELS,
  POST_CATEGORIES,
  type PostWithTeam,
  isPostCategory,
} from "@/lib/types";

export const metadata: Metadata = {
  title: "Community",
  description:
    "Ask for help, share what you built and find alliance partners - team to team.",
};

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!isSupabaseConfigured) {
    return (
      <div className="px-4 py-16 sm:px-6">
        <SetupNotice />
      </div>
    );
  }

  const params = await searchParams;
  const categoryParam = first(params.category);
  const category = isPostCategory(categoryParam) ? categoryParam : null;

  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select(POST_CARD_SELECT)
    .order("created_at", { ascending: false });

  if (category) query = query.eq("category", category);

  const [{ data, error }, team] = await Promise.all([
    query.limit(80),
    getCurrentTeam(),
  ]);

  const posts = (data ?? []) as unknown as PostWithTeam[];
  const liked = await likedPostIds(team?.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div>
        <p className="eyebrow">Team to team</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Community</h1>
        <p className="mt-2 max-w-xl text-fg-muted">
          The part of the hub where teams actually talk: ask for help, share what
          you built, find an alliance partner or a mentor.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/community"
              className={`chip ${!category ? "border-brand/50 bg-brand/15 text-brand-soft" : "hover:text-fg"}`}
            >
              Everything
            </Link>
            {POST_CATEGORIES.map((option) => (
              <Link
                key={option}
                href={`/community?category=${option}`}
                className={`chip ${
                  category === option
                    ? "border-brand/50 bg-brand/15 text-brand-soft"
                    : "hover:text-fg"
                }`}
              >
                {CATEGORY_LABELS[option]}
              </Link>
            ))}
          </div>

          {error ? (
            <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              Could not load posts: {describeQueryError(error)}
            </p>
          ) : null}

          <div className="mt-6 space-y-4">
            {posts.length === 0 ? (
              <EmptyState
                icon={<MessageIcon className="size-6" />}
                title={category ? "Nothing here yet" : "The board is empty"}
                body={
                  team
                    ? "Start it off - ask the question your team is stuck on, or show what you built this season."
                    : "Register your team to post the first question."
                }
                actionLabel={team ? undefined : "Register your team"}
                actionHref={team ? undefined : "/signup"}
              />
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  liked={liked.has(post.id)}
                  canLike={Boolean(team)}
                />
              ))
            )}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {team ? (
            <div className="card p-5">
              <h2 className="font-semibold">New post</h2>
              <p className="mt-1 mb-4 text-xs text-fg-dim">
                Posting as #{team.team_number} {team.name}
              </p>
              <PostForm
                action={createPostAction}
                defaultCategory={category ?? "general"}
              />
            </div>
          ) : (
            <div className="card p-5">
              <h2 className="font-semibold">Join in</h2>
              <p className="mt-2 text-sm text-fg-muted">
                Posting, replying and liking are done as a team, so you need an
                account and a team to be on.
              </p>
              <Link href="/signup" className="btn btn-primary mt-4 w-full">
                Create an account
              </Link>
              <Link
                href="/login?next=/community"
                className="btn btn-ghost mt-2 w-full"
              >
                Log in
              </Link>
            </div>
          )}

          <div className="card p-5">
            <h2 className="text-xs font-semibold tracking-wider text-fg-dim uppercase">
              What goes where
            </h2>
            <dl className="mt-3 space-y-3 text-sm">
              {POST_CATEGORIES.map((option) => (
                <div key={option}>
                  <dt className="font-medium">{CATEGORY_LABELS[option]}</dt>
                  <dd className="text-xs text-fg-dim">
                    {CATEGORY_HINTS[option]}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
