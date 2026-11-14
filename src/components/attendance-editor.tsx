"use client";

import { useActionState } from "react";

import { emptyActionState } from "@/lib/action-state";
import {
  addAttendanceNamesAction,
  removeAttendanceAction,
} from "@/lib/actions/events";
import { type EventAttendance, attendeeName } from "@/lib/types";

import { ErrorAlert, SuccessAlert } from "./alert";
import { PlusIcon, TrashIcon } from "./icons";
import { IconSubmitButton, SubmitButton } from "./submit-button";

/**
 * The host's register.
 *
 * Teams with an account mark themselves down; this is for everybody else,
 * which at a scrimmage is most of the hall.
 */
export function AttendanceEditor({
  eventId,
  attendance,
}: {
  eventId: string;
  attendance: EventAttendance[];
}) {
  const [state, formAction] = useActionState(
    addAttendanceNamesAction,
    emptyActionState,
  );

  return (
    <div className="space-y-5">
      <form key={state.stamp ?? "new"} action={formAction} className="space-y-3">
        <input type="hidden" name="event_id" value={eventId} />

        <ErrorAlert message={state.error} />
        <SuccessAlert message={state.success} />

        <div>
          <label className="field-label" htmlFor="attendance-names">
            Teams in the hall
          </label>
          <textarea
            id="attendance-names"
            name="names"
            rows={4}
            defaultValue={state.values?.names ?? ""}
            aria-invalid={state.field === "names" || undefined}
            className="input resize-y font-mono text-sm"
            placeholder={"winX\nAdvomaas\nINFINITY"}
          />
          <p className="mt-1.5 text-xs text-fg-dim">
            One per line. They need no account here. Pasting the list again
            adds only who is new.
          </p>
        </div>

        <SubmitButton className="btn btn-outline" pendingLabel="Marking...">
          <PlusIcon className="size-4" />
          Mark as here
        </SubmitButton>
      </form>

      {attendance.length > 0 ? (
        <ul className="divide-y divide-line border-t border-line">
          {attendance.map((row) => (
            <li key={row.id} className="flex items-center gap-3 py-2.5 text-sm">
              <span className="min-w-0 flex-1 truncate">
                {attendeeName(row)}
                {row.team ? (
                  <span className="ml-2 text-xs text-fg-dim">
                    marked itself
                  </span>
                ) : null}
              </span>
              <form action={removeAttendanceAction}>
                <input type="hidden" name="event_id" value={eventId} />
                <input type="hidden" name="attendance_id" value={row.id} />
                <IconSubmitButton
                  title={`Take ${attendeeName(row)} off the register`}
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
