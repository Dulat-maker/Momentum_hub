"use client";

import { useActionState } from "react";

import { emptyActionState } from "@/lib/action-state";
import { createPostAction } from "@/lib/actions/community";
import { CATEGORY_HINTS, CATEGORY_LABELS, POST_CATEGORIES } from "@/lib/types";

import { ErrorAlert } from "./alert";
import { SubmitButton } from "./submit-button";

export function PostComposer({
  defaultCategory = "general",
}: {
  defaultCategory?: string;
}) {
  const [state, formAction] = useActionState(
    createPostAction,
    emptyActionState,
  );

  // A rejected form is cleared by React, so it is refilled from what came
  // back rather than making the writer type the post again.
  const value = (name: string, fallback = "") =>
    state.values?.[name] ?? fallback;
  const invalid = (name: string) => state.field === name;

  return (
    <form
      key={state.stamp ?? "new"}
      action={formAction}
      className="space-y-4"
    >
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
            defaultValue={value("title")}
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
            defaultValue={value("category", defaultCategory)}
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
          rows={5}
          required
          defaultValue={value("body")}
          aria-invalid={invalid("body") || undefined}
          autoFocus={invalid("body")}
          className="input resize-y"
          placeholder="Give enough detail that someone can actually help."
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-fg-dim">
          {CATEGORY_HINTS.general}
        </p>
        <SubmitButton pendingLabel="Posting...">Post to community</SubmitButton>
      </div>
    </form>
  );
}
