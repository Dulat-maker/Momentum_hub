"use client";

import { useActionState } from "react";

import { emptyActionState } from "@/lib/action-state";
import { saveFeedbackAction } from "@/lib/actions/events";

import { ErrorAlert, SuccessAlert } from "./alert";
import { StarRatingInput } from "./star-rating-input";
import { SubmitButton } from "./submit-button";

export function FeedbackForm({
  eventId,
  existingBody,
  existingRating,
}: {
  eventId: string;
  existingBody?: string;
  existingRating?: number;
}) {
  const [state, formAction] = useActionState(
    saveFeedbackAction,
    emptyActionState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="event_id" value={eventId} />

      <ErrorAlert message={state.error} />
      <SuccessAlert message={state.success} />

      <div>
        <span className="field-label">Rating</span>
        <StarRatingInput name="rating" defaultValue={existingRating ?? 0} />
      </div>

      <div>
        <label className="field-label" htmlFor="body">
          {existingBody ? "Your feedback" : "How was it?"}
        </label>
        <textarea
          id="body"
          name="body"
          rows={4}
          required
          defaultValue={existingBody ?? ""}
          className="input resize-y"
          placeholder="What worked, what the hosts could do better, would you come again?"
        />
      </div>

      <SubmitButton pendingLabel="Posting...">
        {existingBody ? "Update feedback" : "Post feedback"}
      </SubmitButton>
    </form>
  );
}
