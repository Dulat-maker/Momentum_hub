"use client";

import { useActionState } from "react";

import { emptyActionState } from "@/lib/action-state";
import {
  addParticipantsAction,
  removeParticipantAction,
  saveScoresAction,
} from "@/lib/actions/scores";
import {
  type EventParticipant,
  PROGRAM_LABELS,
  type TeamSummary,
  bestRound,
} from "@/lib/types";

import { ErrorAlert, SuccessAlert } from "./alert";
import { PlusIcon, TrashIcon } from "./icons";
import { IconSubmitButton, SubmitButton } from "./submit-button";

export function ScoreboardEditor({
  eventId,
  participants,
  teams,
}: {
  eventId: string;
  participants: EventParticipant[];
  /** Teams on the hub, to tie a name on the board to one of them. */
  teams: TeamSummary[];
}) {
  const [addState, addAction] = useActionState(
    addParticipantsAction,
    emptyActionState,
  );
  const [saveState, saveAction] = useActionState(
    saveScoresAction,
    emptyActionState,
  );

  return (
    <div className="space-y-6">
      <form key={addState.stamp ?? "new"} action={addAction} className="space-y-3">
        <input type="hidden" name="event_id" value={eventId} />

        <ErrorAlert message={addState.error} />
        <SuccessAlert message={addState.success} />

        <div>
          <label className="field-label" htmlFor="participant-names">
            Teams taking part
          </label>
          <textarea
            id="participant-names"
            name="names"
            rows={4}
            defaultValue={addState.values?.names ?? ""}
            aria-invalid={addState.field === "names" || undefined}
            className="input resize-y font-mono text-sm"
            placeholder={"winX\nAdvomaas\nINFINITY"}
          />
          <p className="mt-1.5 text-xs text-fg-dim">
            One per line. Pasting the list again adds only the new names and
            leaves the scores alone.
          </p>
        </div>

        <SubmitButton className="btn btn-outline" pendingLabel="Adding...">
          <PlusIcon className="size-4" />
          Add to the board
        </SubmitButton>
      </form>

      {participants.length > 0 ? (
        <form action={saveAction} className="space-y-3">
          <input type="hidden" name="event_id" value={eventId} />

          <ErrorAlert message={saveState.error} />
          <SuccessAlert message={saveState.success} />

          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-sm">
              <thead>
                <tr className="text-left text-xs tracking-wider text-fg-dim uppercase">
                  <th className="py-2 pr-3 font-medium">Team</th>
                  <th className="w-20 px-1 py-2 font-medium">R1</th>
                  <th className="w-20 px-1 py-2 font-medium">R2</th>
                  <th className="w-20 px-1 py-2 font-medium">R3</th>
                  <th className="w-16 px-1 py-2 text-right font-medium">Best</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {participants.map((entry) => (
                  <tr key={entry.id} className="border-t border-line">
                    <td className="min-w-44 py-2 pr-3 align-top">
                      <p className="font-medium">{entry.name}</p>

                      {/* Optional on purpose: most teams at a scrimmage have
                          no account here, and a board that insists on one
                          cannot record them. */}
                      <select
                        name={`link-${entry.id}`}
                        defaultValue={entry.team_id ?? ""}
                        aria-label={`Which team on the hub is ${entry.name}?`}
                        className="input mt-1.5 px-2 py-1 text-xs"
                      >
                        <option value="">Not on the hub</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {PROGRAM_LABELS[team.program]} #{team.team_number}{" "}
                            {team.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {([1, 2, 3] as const).map((round) => (
                      <td key={round} className="px-1 py-2 align-top">
                        <input
                          type="number"
                          min={0}
                          name={`score-${entry.id}-${round}`}
                          defaultValue={entry[`round_${round}`] ?? ""}
                          className="input px-2 py-1.5 text-sm"
                          aria-label={`${entry.name}, round ${round}`}
                        />
                      </td>
                    ))}

                    <td className="px-1 py-2 text-right align-top font-semibold tabular-nums">
                      {bestRound(entry) ?? "—"}
                    </td>

                    <td className="py-2 text-right align-top">
                      {/* Its own form: a nested one would submit the scores. */}
                      <span className="inline-block">
                        <IconSubmitButton
                          title={`Remove ${entry.name}`}
                          className="btn btn-ghost btn-sm"
                          form={`remove-${entry.id}`}
                        >
                          <TrashIcon className="size-4" />
                        </IconSubmitButton>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-fg-dim">
            Tying a name to a team on the hub puts this result on that team&apos;s
            own page.
          </p>

          <SubmitButton pendingLabel="Saving...">Save scores</SubmitButton>
        </form>
      ) : null}

      {/* Kept outside the scores form: HTML has no nested forms, so each
          remove button points at its own form by id. */}
      {participants.map((entry) => (
        <form
          key={entry.id}
          id={`remove-${entry.id}`}
          action={removeParticipantAction}
          className="hidden"
        >
          <input type="hidden" name="event_id" value={eventId} />
          <input type="hidden" name="participant_id" value={entry.id} />
        </form>
      ))}
    </div>
  );
}
