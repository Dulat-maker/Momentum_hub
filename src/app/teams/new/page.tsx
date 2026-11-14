import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentTeam, requireProfile } from "@/lib/auth";

import { CreateTeamForm } from "./create-team-form";

export const metadata: Metadata = { title: "Register your team" };

export default async function NewTeamPage() {
  await requireProfile("/teams/new");

  // One team per person, so somebody who already has one has nothing to do
  // here. Their team is on the dashboard.
  if (await getCurrentTeam()) redirect("/dashboard");

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-14 sm:px-6 sm:py-20">
      <Link
        href="/dashboard"
        className="text-sm text-fg-muted transition-colors hover:text-fg"
      >
        &larr; Back
      </Link>

      <div className="mt-5">
        <p className="eyebrow">Captains only</p>
        <h1 className="mt-2 text-3xl font-semibold">Register your team</h1>
        <p className="mt-3 text-fg-muted">
          Do this once, for the whole team. You become its captain, and from
          the dashboard you can invite everyone else by the email they signed
          up with.
        </p>
        <p className="mt-3 text-sm text-fg-dim">
          Already on the hub? Then you want an invitation from your captain,
          not a second entry for the same team.
        </p>
      </div>

      <div className="card mt-8 p-6 sm:p-8">
        <CreateTeamForm />
      </div>
    </div>
  );
}
