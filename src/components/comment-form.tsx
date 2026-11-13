"use client";

import { useActionState, useEffect, useRef } from "react";

import { emptyActionState } from "@/lib/action-state";
import { createCommentAction } from "@/lib/actions/community";

import { ErrorAlert } from "./alert";
import { SubmitButton } from "./submit-button";

export function CommentForm({ postId }: { postId: string }) {
  const [state, formAction] = useActionState(
    createCommentAction,
    emptyActionState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the textarea once a reply goes through.
  useEffect(() => {
    if (state.error === null) formRef.current?.reset();
  }, [state]);

  return (
    <form
      key={state.stamp ?? "new"}
      ref={formRef}
      action={formAction}
      className="space-y-3"
    >
      <input type="hidden" name="post_id" value={postId} />

      <ErrorAlert message={state.error} />

      <textarea
        name="body"
        rows={3}
        required
        defaultValue={state.values?.body ?? ""}
        aria-invalid={state.field === "body" || undefined}
        className="input resize-y"
        placeholder="Write a reply..."
        aria-label="Your reply"
      />

      <SubmitButton pendingLabel="Sending...">Reply</SubmitButton>
    </form>
  );
}
