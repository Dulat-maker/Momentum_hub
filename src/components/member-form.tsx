"use client";

import { useActionState, useEffect, useRef } from "react";

import { emptyActionState } from "@/lib/action-state";
import { addMemberAction } from "@/lib/actions/teams";

import { ErrorAlert } from "./alert";
import { PlusIcon } from "./icons";
import { SubmitButton } from "./submit-button";

export function MemberForm({ nextSortOrder }: { nextSortOrder: number }) {
  const [state, formAction] = useActionState(addMemberAction, emptyActionState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <ErrorAlert message={state.error} />

      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_120px_90px_auto] sm:items-end">
        <div>
          <label className="field-label" htmlFor="full_name">
            Name
          </label>
          <input
            id="full_name"
            name="full_name"
            required
            className="input"
            placeholder="Aisultan K."
          />
        </div>
        <div>
          <label className="field-label" htmlFor="role">
            Role
          </label>
          <input
            id="role"
            name="role"
            className="input"
            placeholder="Programmer"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="grade">
            Grade
          </label>
          <input id="grade" name="grade" className="input" placeholder="11" />
        </div>
        <div>
          <label className="field-label" htmlFor="sort_order">
            Order
          </label>
          <input
            id="sort_order"
            name="sort_order"
            type="number"
            defaultValue={nextSortOrder}
            className="input"
          />
        </div>

        <SubmitButton className="btn btn-outline" pendingLabel="Adding...">
          <PlusIcon className="size-4" />
          Add
        </SubmitButton>
      </div>
    </form>
  );
}
