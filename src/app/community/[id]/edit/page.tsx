import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TrashIcon } from "@/components/icons";
import { PostForm } from "@/components/post-form";
import { IconSubmitButton } from "@/components/submit-button";
import {
  deletePostAction,
  updatePostAction,
} from "@/lib/actions/community";
import { requireTeam } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { PostRow } from "@/lib/types";

export const metadata: Metadata = { title: "Edit post" };

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const team = await requireTeam(`/community/${id}/edit`);

  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("id, team_id, title, body, category, created_at")
    .eq("id", id)
    .maybeSingle();

  const post = data as PostRow | null;

  if (!post || post.team_id !== team.id) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href={`/community/${post.id}`}
        className="text-sm text-fg-muted transition-colors hover:text-fg"
      >
        &larr; Back to the post
      </Link>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Your post</p>
          <h1 className="mt-2 text-3xl font-semibold">Edit post</h1>
          <p className="mt-2 text-sm text-fg-muted">
            Replies stay where they are.
          </p>
        </div>

        <form action={deletePostAction}>
          <input type="hidden" name="post_id" value={post.id} />
          <IconSubmitButton
            className="btn btn-danger btn-sm"
            title="Delete this post"
          >
            <TrashIcon className="size-4" />
            Delete
          </IconSubmitButton>
        </form>
      </div>

      <div className="card mt-8 p-6 sm:p-8">
        <PostForm
          action={updatePostAction}
          post={post}
          submitLabel="Save changes"
          pendingLabel="Saving..."
        />
      </div>
    </div>
  );
}
