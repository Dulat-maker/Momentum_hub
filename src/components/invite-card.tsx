"use client";

import { useActionState } from "react";

import { emptyActionState } from "@/lib/action-state";
import { acceptInviteAction, declineInviteAction } from "@/lib/actions/teams";
import { PROGRAM_LABELS, type TeamInvite } from "@/lib/types";

import { ErrorAlert } from "./alert";
import { SubmitButton } from "./submit-button";
import { TeamAvatar } from "./team-avatar";

/**
 * An invitation waiting on somebody's dashboard.
 *
 * Nothing was emailed: the invite is a row the captain wrote, and this is
 * where the person it names finds it.
 */
export function InviteCard({ invite }: { invite: TeamInvite }) {
  const [state, accept] = useActionState(acceptInviteAction, emptyActionState);
  const team = invite.team;

  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <TeamAvatar
          name={team?.name ?? "Team"}
          logoUrl={team?.logo_url ?? null}
          size="sm"
        />
        <div className="min-w-0">
          <p className="truncate font-medium">
            {team ? team.name : "A team on the hub"}
          </p>
          {team ? (
            <p className="truncate text-xs text-fg-dim">
              {PROGRAM_LABELS[team.program]} #{team.team_number}
              {team.city ? ` · ${team.city}` : ""}
            </p>
          ) : null}
        </div>
      </div>

      <p className="mt-3 text-sm text-fg-muted">
        You have been invited to join. Once you accept, you can post for this
        team and you show up on its roster.
      </p>

      <div className="mt-4">
        <ErrorAlert message={state.error} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <form action={accept}>
          <input type="hidden" name="invite_id" value={invite.id} />
          <SubmitButton className="btn btn-primary btn-sm" pendingLabel="Joining...">
            Join the team
          </SubmitButton>
        </form>

        <form action={declineInviteAction}>
          <input type="hidden" name="invite_id" value={invite.id} />
          <SubmitButton className="btn btn-ghost btn-sm" pendingLabel="...">
            Not my team
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
