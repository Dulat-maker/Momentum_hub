"use client";

import { useActionState } from "react";

import { type ActionState, emptyActionState } from "@/lib/action-state";
import {
  CATEGORY_HINTS,
  CATEGORY_LABELS,
  POST_CATEGORIES,
  type PostRow,
} from "@/lib/types";

import { ErrorAlert } from "./alert";
import { SubmitButton } from "./submit-button";

/**
 * Used both by the composer in the community sidebar and by the edit page,
 * so the two cannot drift apart in what they accept.
 */
export function PostForm({
  action,
  post,
  defaultCategory = "general",
  submitLabel = "Post to community",
  pendingLabel = "Posting...",
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  post?: PostRow;
  defaultCategory?: string;
  submitLabel?: string;
  pendingLabel?: string;
}) {
  const [state, formAction] = useActionState(action, emptyActionState);

  const value = (name: string, fallback = "") =>
    state.values?.[name] ?? fallback;
  const invalid = (name: string) => state.field === name;

  return (
    <form key={state.stamp ?? "new"} action={formAction} className="space-y-4">
      {post ? <input type="hidden" name="post_id" value={post.id} /> : null}

      <ErrorAlert message={state.error} />

      <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
        <div>
          <label className="field-label" htmlFor="post-title">
            Title
          </label>
          <input
            id="post-title"
            name="title"
            required
            defaultValue={value("title", post?.title)}
            aria-invalid={invalid("title") || undefined}
            autoFocus={invalid("title")}
            className="input"
            placeholder="How do you tune a PID for the arm?"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="post-category">
            Category
          </label>
          <select
            id="post-category"
            name="category"
            defaultValue={value("category", post?.category ?? defaultCategory)}
            className="input"
          >
            {POST_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="post-body">
          Your post
        </label>
        <textarea
          id="post-body"
          name="body"
          rows={post ? 10 : 5}
          required
          defaultValue={value("body", post?.body)}
          aria-invalid={invalid("body") || undefined}
          autoFocus={invalid("body")}
          className="input resize-y"
          placeholder="Give enough detail that someone can actually help."
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-fg-dim">{CATEGORY_HINTS.general}</p>
        <SubmitButton pendingLabel={pendingLabel}>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
