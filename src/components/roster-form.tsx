"use client";

import { useActionState } from "react";

import { emptyActionState } from "@/lib/action-state";
import { addRosterPersonAction } from "@/lib/actions/teams";

import { ErrorAlert, SuccessAlert } from "./alert";
import { PlusIcon } from "./icons";
import { ImageUpload } from "./image-upload";
import { SubmitButton } from "./submit-button";

/**
 * The captain writing somebody onto the roster.
 *
 * Only the name is required. A photo and a line about them is what turns the
 * team page from a list into people, but a team should be able to get its
 * fourteen names up in two minutes and come back for the rest.
 */
export function RosterForm({
  teamId,
  nextSortOrder,
}: {
  teamId: string;
  nextSortOrder: number;
}) {
  const [state, formAction] = useActionState(
    addRosterPersonAction,
    emptyActionState,
  );

  const value = (name: string, fallback = "") =>
    state.values?.[name] ?? fallback;

  return (
    <form key={state.stamp ?? "new"} action={formAction} className="space-y-4">
      <ErrorAlert message={state.error} />
      <SuccessAlert message={state.success} />

      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_110px]">
        <div>
          <label className="field-label" htmlFor="member-name">
            Name
          </label>
          <input
            id="member-name"
            name="full_name"
            required
            defaultValue={value("full_name")}
            aria-invalid={state.field === "full_name" || undefined}
            className="input"
            placeholder="Aidana Serikova"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="member-title">
            Role
          </label>
          <input
            id="member-title"
            name="title"
            defaultValue={value("title")}
            className="input"
            placeholder="Programmer"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="member-order">
            Order
          </label>
          <input
            id="member-order"
            name="sort_order"
            type="number"
            defaultValue={value("sort_order", String(nextSortOrder))}
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="member-bio">
          A line about them
        </label>
        <textarea
          id="member-bio"
          name="bio"
          rows={2}
          defaultValue={value("bio")}
          className="input resize-y"
          placeholder="Writes the autonomous. Has never lost a drivers' meeting."
        />
        <p className="mt-1.5 text-xs text-fg-dim">
          Shown on the back of their badge on the team page.
        </p>
      </div>

      <ImageUpload
        name="photo_url"
        bucket="team-logos"
        prefix="member"
        teamId={teamId}
        label="Photo"
        hint="A head and shoulders works best. PNG, JPG or WebP, up to 2 MB."
        defaultValue={value("photo_url")}
      />

      <SubmitButton className="btn btn-outline" pendingLabel="Adding...">
        <PlusIcon className="size-4" />
        Add to the roster
      </SubmitButton>
    </form>
  );
}
