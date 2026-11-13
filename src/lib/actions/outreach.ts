"use server";

import { revalidatePath } from "next/cache";

import {
  type ActionState,
  failure,
  formValues,
  success,
} from "@/lib/action-state";
import { getCurrentTeam } from "@/lib/auth";
import { optionalInteger, optionalNumber, optionalText, text } from "@/lib/form";
import { describeQueryError } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { teamHref } from "@/lib/types";

const NOT_SIGNED_IN = "Log in with your team account to do that.";

export async function addOutreachAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const team = await getCurrentTeam();
  if (!team) return failure(NOT_SIGNED_IN, { values: formValues(formData) });

  const title = text(formData, "title");
  const happenedOn = text(formData, "happened_on");
  const peopleReached = optionalInteger(formData, "people_reached");
  const hours = optionalNumber(formData, "hours");

  const keep = { values: formValues(formData) };

  if (title.length < 3) {
    return failure("Say what the team did.", { ...keep, field: "title" });
  }
  // A plain date, no time: these are logged after the fact.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(happenedOn)) {
    return failure("Pick the date it happened.", {
      ...keep,
      field: "happened_on",
    });
  }
  if (peopleReached !== null && peopleReached < 0) {
    return failure("People reached cannot be negative.", {
      ...keep,
      field: "people_reached",
    });
  }
  if (hours !== null && (hours < 0 || hours > 10000)) {
    return failure("That number of hours looks wrong.", {
      ...keep,
      field: "hours",
    });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("outreach_entries").insert({
    team_id: team.id,
    happened_on: happenedOn,
    title,
    description: optionalText(formData, "description"),
    people_reached: peopleReached,
    hours,
    link: optionalText(formData, "link"),
  });

  // Until the migration runs this is "relation does not exist", which says
  // nothing useful to whoever is filling the form in.
  if (error) {
    return failure(describeQueryError(error) ?? error.message, keep);
  }

  revalidatePath("/dashboard");
  revalidatePath(teamHref(team));

  return success("Added to the outreach log.");
}

export async function removeOutreachAction(formData: FormData): Promise<void> {
  const team = await getCurrentTeam();
  if (!team) return;

  const entryId = text(formData, "entry_id");
  if (!entryId) return;

  const supabase = await createClient();
  await supabase
    .from("outreach_entries")
    .delete()
    .eq("id", entryId)
    .eq("team_id", team.id);

  revalidatePath("/dashboard");
  revalidatePath(teamHref(team));
}
