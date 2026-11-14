"use client";

import { useActionState } from "react";

import { emptyActionState } from "@/lib/action-state";
import { inviteMemberAction } from "@/lib/actions/teams";

import { ErrorAlert, SuccessAlert } from "./alert";
import { PlusIcon } from "./icons";
import { SubmitButton } from "./submit-button";

export function InviteForm() {
  const [state, formAction] = useActionState(
    inviteMemberAction,
    emptyActionState,
  );

  return (
    <form key={state.stamp ?? "new"} action={formAction} className="space-y-3">
      <ErrorAlert message={state.error} />
      <SuccessAlert message={state.success} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="field-label" htmlFor="invite-email">
            Their email
          </label>
          <input
            id="invite-email"
            name="email"
            type="email"
            required
            defaultValue={state.values?.email ?? ""}
            aria-invalid={state.field === "email" || undefined}
            className="input"
            placeholder="teammate@example.com"
          />
        </div>

        <SubmitButton className="btn btn-outline" pendingLabel="Inviting...">
          <PlusIcon className="size-4" />
          Invite
        </SubmitButton>
      </div>

      <p className="text-xs text-fg-dim">
        Use the address they signed up with. Nothing is emailed - the
        invitation appears on their dashboard. One sent before they register
        waits for them.
      </p>
    </form>
  );
}
