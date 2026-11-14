"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { type ActionState, failure, formValues } from "@/lib/action-state";
import {
  getCurrentMembership,
  getCurrentProfile,
  getCurrentUser,
} from "@/lib/auth";
import { optionalInteger, optionalText, text } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";
import { PROGRAM_LABELS, isProgram, teamHref } from "@/lib/types";

const NOT_SIGNED_IN = "Log in to do that.";
const NOT_THE_CAPTAIN = "Only the captain can do that.";

/**
 * Registers a team and makes the caller its captain.
 *
 * Both happen inside one database function: a team with no captain, or a
 * captain row pointing at a team that failed to insert, would be a mess to
 * unpick by hand.
 */
export async function createTeamAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const profile = await getCurrentProfile();
  if (!profile) return failure(NOT_SIGNED_IN, { values: formValues(formData) });

  const programRaw = text(formData, "program");
  const program = isProgram(programRaw) ? programRaw : "ftc";
  const teamNumber = Number(text(formData, "team_number"));
  const name = text(formData, "name");
  const city = text(formData, "city");
  const country = text(formData, "country") || "Kazakhstan";

  const keep = { values: formValues(formData) };

  if (!Number.isInteger(teamNumber) || teamNumber <= 0) {
    return failure("Enter your team number, for example 12345.", {
      ...keep,
      field: "team_number",
    });
  }
  if (name.length < 2) {
    return failure("Enter your team name.", { ...keep, field: "name" });
  }
  if (!city) {
    return failure("Enter the city your team is based in.", {
      ...keep,
      field: "city",
    });
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_team", {
    p_program: program,
    p_team_number: teamNumber,
    p_name: name,
    p_city: city,
    p_country: country,
  });

  if (error) {
    if (/already on a team/i.test(error.message)) {
      return failure(
        "You are already on a team. Leave it first if you are starting another one.",
        keep,
      );
    }
    if (/duplicate key|unique/i.test(error.message)) {
      return failure(
        `${PROGRAM_LABELS[program]} team ${teamNumber} is already on the hub. Ask its captain for an invitation instead.`,
        { ...keep, field: "team_number" },
      );
    }

    return failure(error.message, keep);
  }

  revalidatePath("/", "layout");
  revalidatePath("/teams");
  redirect("/dashboard");
}

export async function updateTeamAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const membership = await getCurrentMembership();
  if (!membership) return failure(NOT_SIGNED_IN, { values: formValues(formData) });
  if (membership.role !== "captain") {
    return failure(NOT_THE_CAPTAIN, { values: formValues(formData) });
  }

  const team = membership.team;
  const name = text(formData, "name");
  const city = text(formData, "city");
  const rookieYear = optionalInteger(formData, "rookie_year");

  const keep = { values: formValues(formData) };

  if (name.length < 2) {
    return failure("Your team needs a name.", { ...keep, field: "name" });
  }
  if (!city) {
    return failure("Enter the city your team is based in.", {
      ...keep,
      field: "city",
    });
  }
  if (rookieYear !== null && (rookieYear < 1990 || rookieYear > 2100)) {
    return failure("Rookie year looks wrong.", {
      ...keep,
      field: "rookie_year",
    });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("teams")
    .update({
      name,
      city,
      country: text(formData, "country") || "Kazakhstan",
      organization: optionalText(formData, "organization"),
      about: optionalText(formData, "about"),
      logo_url: optionalText(formData, "logo_url"),
      website: optionalText(formData, "website"),
      instagram: optionalText(formData, "instagram"),
      contact_email: optionalText(formData, "contact_email"),
      rookie_year: rookieYear,
    })
    .eq("id", team.id);

  if (error) return failure(error.message, keep);

  revalidatePath("/dashboard");
  revalidatePath("/teams");
  revalidatePath(teamHref(team));
  revalidatePath("/", "layout");

  return { error: null, success: "Team profile saved." };
}

/**
 * Invites somebody by email.
 *
 * Nothing is sent anywhere: the invitation shows up on their dashboard the
 * next time they log in, and one addressed to somebody who has not signed up
 * yet simply waits for them. That keeps the whole thing working without mail
 * delivery, which on a free Supabase project is two messages an hour.
 */
export async function inviteMemberAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const membership = await getCurrentMembership();
  if (!membership) return failure(NOT_SIGNED_IN, { values: formValues(formData) });
  if (membership.role !== "captain") {
    return failure(NOT_THE_CAPTAIN, { values: formValues(formData) });
  }

  const profile = await getCurrentProfile();
  const email = text(formData, "email").toLowerCase();
  const keep = { values: formValues(formData) };

  if (!email.includes("@")) {
    return failure("Enter the email they signed up with.", {
      ...keep,
      field: "email",
    });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("team_invites").insert({
    team_id: membership.team.id,
    email,
    invited_by: profile?.id ?? null,
  });

  if (error) {
    if (/duplicate key|unique/i.test(error.message)) {
      return failure(`${email} has already been invited.`, {
        ...keep,
        field: "email",
      });
    }

    return failure(error.message, keep);
  }

  revalidatePath("/dashboard");

  return {
    error: null,
    success: `Invited ${email}. It is waiting for them on their dashboard.`,
  };
}

export async function cancelInviteAction(formData: FormData): Promise<void> {
  const membership = await getCurrentMembership();
  if (!membership || membership.role !== "captain") return;

  const inviteId = text(formData, "invite_id");
  if (!inviteId) return;

  const supabase = await createClient();
  await supabase
    .from("team_invites")
    .delete()
    .eq("id", inviteId)
    .eq("team_id", membership.team.id);

  revalidatePath("/dashboard");
}

export async function acceptInviteAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return failure(NOT_SIGNED_IN);

  const inviteId = text(formData, "invite_id");
  if (!inviteId) return failure("That invitation is gone.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_invite", {
    p_invite: inviteId,
  });

  if (error) {
    if (/already on a team/i.test(error.message)) {
      return failure("You are already on a team.");
    }
    if (/not open to you/i.test(error.message)) {
      return failure("That invitation is not open any more.");
    }

    return failure(error.message);
  }

  revalidatePath("/", "layout");
  revalidatePath("/teams");
  redirect("/dashboard");
}

export async function declineInviteAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user?.email) return;

  const inviteId = text(formData, "invite_id");
  if (!inviteId) return;

  const supabase = await createClient();
  await supabase
    .from("team_invites")
    .update({ status: "declined" })
    .eq("id", inviteId);

  revalidatePath("/dashboard");
}

export async function removeMemberAction(formData: FormData): Promise<void> {
  const membership = await getCurrentMembership();
  if (!membership || membership.role !== "captain") return;

  const profileId = text(formData, "profile_id");
  if (!profileId || profileId === membership.team.created_by) return;

  const supabase = await createClient();
  await supabase
    .from("team_members")
    .delete()
    .eq("team_id", membership.team.id)
    .eq("profile_id", profileId);

  revalidatePath("/dashboard");
  revalidatePath(teamHref(membership.team));
}

export async function leaveTeamAction(): Promise<void> {
  const membership = await getCurrentMembership();
  const profile = await getCurrentProfile();
  if (!membership || !profile) return;

  const team = membership.team;
  const supabase = await createClient();

  await supabase
    .from("team_members")
    .delete()
    .eq("team_id", team.id)
    .eq("profile_id", profile.id);

  revalidatePath("/", "layout");
  revalidatePath(teamHref(team));
  redirect("/dashboard");
}

/** Kept for the public roster: "Programmer", "Driver", "Mentor". */
export async function setMemberTitleAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const membership = await getCurrentMembership();
  const profile = await getCurrentProfile();
  if (!membership || !profile) return failure(NOT_SIGNED_IN);

  const title = optionalText(formData, "title");
  const supabase = await createClient();

  const { error } = await supabase
    .from("team_members")
    .update({ title })
    .eq("team_id", membership.team.id)
    .eq("profile_id", profile.id);

  if (error) return failure(error.message);

  revalidatePath("/dashboard");
  revalidatePath(teamHref(membership.team));

  return { error: null, success: "Saved." };
}
