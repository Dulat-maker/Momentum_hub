"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { type ActionState, failure } from "@/lib/action-state";
import { getCurrentTeam } from "@/lib/auth";
import { text } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";
import { isPostCategory } from "@/lib/types";

const NOT_SIGNED_IN = "Log in with your team account to do that.";

export async function createPostAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const team = await getCurrentTeam();
  if (!team) return failure(NOT_SIGNED_IN);

  const title = text(formData, "title");
  const body = text(formData, "body");
  const category = text(formData, "category");

  if (title.length < 4) return failure("Give your post a title.");
  if (body.length < 10) return failure("Write a few more words.");
  if (!isPostCategory(category)) return failure("Pick a category.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .insert({ team_id: team.id, title, body, category })
    .select("id")
    .single();

  if (error) return failure(error.message);

  revalidatePath("/community");
  revalidatePath("/dashboard");
  redirect(`/community/${data.id}`);
}

export async function deletePostAction(formData: FormData): Promise<void> {
  const team = await getCurrentTeam();
  if (!team) return;

  const postId = text(formData, "post_id");
  if (!postId) return;

  const supabase = await createClient();
  await supabase.from("posts").delete().eq("id", postId).eq("team_id", team.id);

  revalidatePath("/community");
  revalidatePath("/dashboard");
  redirect("/community");
}

export async function createCommentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const team = await getCurrentTeam();
  if (!team) return failure(NOT_SIGNED_IN);

  const postId = text(formData, "post_id");
  const body = text(formData, "body");

  if (!postId) return failure("Missing post id.");
  if (body.length < 2) return failure("Write a reply first.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("post_comments")
    .insert({ post_id: postId, team_id: team.id, body });

  if (error) return failure(error.message);

  revalidatePath(`/community/${postId}`);
  revalidatePath("/community");

  return { error: null };
}

export async function deleteCommentAction(formData: FormData): Promise<void> {
  const team = await getCurrentTeam();
  if (!team) return;

  const commentId = text(formData, "comment_id");
  const postId = text(formData, "post_id");
  if (!commentId) return;

  const supabase = await createClient();
  await supabase
    .from("post_comments")
    .delete()
    .eq("id", commentId)
    .eq("team_id", team.id);

  if (postId) revalidatePath(`/community/${postId}`);
  revalidatePath("/community");
}

export async function togglePostLikeAction(postId: string): Promise<void> {
  const team = await getCurrentTeam();
  if (!team) return;

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("team_id", team.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("team_id", team.id);
  } else {
    await supabase
      .from("post_likes")
      .insert({ post_id: postId, team_id: team.id });
  }

  revalidatePath("/community");
  revalidatePath(`/community/${postId}`);
}
