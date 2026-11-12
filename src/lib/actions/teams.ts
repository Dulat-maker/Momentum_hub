"use server";

import { revalidatePath } from "next/cache";

import { type ActionState, failure } from "@/lib/action-state";
import { getCurrentTeam } from "@/lib/auth";
import { optionalInteger, optionalText, text } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";

const NOT_SIGNED_IN = "Log in with your team account to do that.";

export async function updateTeamAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const team = await getCurrentTeam();
  if (!team) return failure(NOT_SIGNED_IN);

  const name = text(formData, "name");
  const city = text(formData, "city");
  const rookieYear = optionalInteger(formData, "rookie_year");

  if (name.length < 2) return failure("Your team needs a name.");
  if (!city) return failure("Enter the city your team is based in.");
  if (rookieYear !== null && (rookieYear < 1990 || rookieYear > 2100)) {
    return failure("Rookie year looks wrong.");
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

  if (error) return failure(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/teams");
  revalidatePath(`/teams/${team.team_number}`);
  revalidatePath("/", "layout");

  return { error: null, success: "Team profile saved." };
}

export async function addMemberAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const team = await getCurrentTeam();
  if (!team) return failure(NOT_SIGNED_IN);

  const fullName = text(formData, "full_name");
  if (fullName.length < 2) return failure("Enter the member's name.");

  const supabase = await createClient();
  const { error } = await supabase.from("team_members").insert({
    team_id: team.id,
    full_name: fullName,
    role: optionalText(formData, "role"),
    grade: optionalText(formData, "grade"),
    sort_order: optionalInteger(formData, "sort_order") ?? 0,
  });

  if (error) return failure(error.message);

  revalidatePath("/dashboard");
  revalidatePath(`/teams/${team.team_number}`);

  return { error: null, success: `${fullName} added to the roster.` };
}

export async function removeMemberAction(formData: FormData): Promise<void> {
  const team = await getCurrentTeam();
  if (!team) return;

  const memberId = text(formData, "member_id");
  if (!memberId) return;

  const supabase = await createClient();
  await supabase
    .from("team_members")
    .delete()
    .eq("id", memberId)
    .eq("team_id", team.id);

  revalidatePath("/dashboard");
  revalidatePath(`/teams/${team.team_number}`);
}
