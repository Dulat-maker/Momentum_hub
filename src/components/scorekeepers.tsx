"use client";

import { useActionState } from "react";

import { emptyActionState } from "@/lib/action-state";
import {
  addScorekeeperAction,
  removeScorekeeperAction,
} from "@/lib/actions/scores";
import type { EventScorekeeper } from "@/lib/types";

import { ErrorAlert, SuccessAlert } from "./alert";
import { PlusIcon, TrashIcon } from "./icons";
import { IconSubmitButton, SubmitButton } from "./submit-button";

/**
 * Who may enter robot game scores at this event.
 *
 * The host's captain always can; this is for the referees, who are usually
 * not on the hosting team at all.
 */
export function Scorekeepers({
  eventId,
  scorekeepers,
}: {
  eventId: string;
  scorekeepers: EventScorekeeper[];
}) {
  const [state, formAction] = useActionState(
    addScorekeeperAction,
    emptyActionState,
  );

  return (
    <div className="space-y-4">
      <form key={state.stamp ?? "new"} action={formAction} className="space-y-3">
        <input type="hidden" name="event_id" value={eventId} />

        <ErrorAlert message={state.error} />
        <SuccessAlert message={state.success} />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="field-label" htmlFor="scorekeeper-email">
              Their email
            </label>
            <input
              id="scorekeeper-email"
              name="email"
              type="email"
              required
              defaultValue={state.values?.email ?? ""}
              aria-invalid={state.field === "email" || undefined}
              className="input"
              placeholder="referee@example.com"
            />
          </div>

          <SubmitButton className="btn btn-outline" pendingLabel="Adding...">
            <PlusIcon className="size-4" />
            Add
          </SubmitButton>
        </div>

        <p className="text-xs text-fg-dim">
          They need an account on the hub. You keep access either way, as the
          captain of the hosting team.
        </p>
      </form>

      {scorekeepers.length > 0 ? (
        <ul className="divide-y divide-line border-t border-line">
          {scorekeepers.map((keeper) => (
            <li
              key={keeper.profile_id}
              className="flex items-center gap-3 py-2.5 text-sm"
            >
              <span className="min-w-0 flex-1 truncate">
                {keeper.profile?.full_name ?? "Someone"}
              </span>
              <form action={removeScorekeeperAction}>
                <input type="hidden" name="event_id" value={eventId} />
                <input
                  type="hidden"
                  name="profile_id"
                  value={keeper.profile_id}
                />
                <IconSubmitButton
                  title={`Take ${keeper.profile?.full_name ?? "them"} off the scoreboard`}
                >
                  <TrashIcon className="size-4" />
                </IconSubmitButton>
              </form>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
