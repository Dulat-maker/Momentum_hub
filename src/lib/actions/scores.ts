"use server";

import { revalidatePath } from "next/cache";

import {
  type ActionState,
  failure,
  formValues,
  success,
} from "@/lib/action-state";
import { getCurrentUser } from "@/lib/auth";
import { describeQueryError } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { text } from "@/lib/form";

const NOT_SCOREKEEPER =
  "Only the people keeping score at this event can change the board.";

/**
 * Whether the signed-in person may enter scores here.
 *
 * Asked of the database rather than worked out here, because the same
 * question decides whether the write is allowed at all - two answers that
 * could drift apart would be one too many.
 */
async function canScore(eventId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const supabase = await createClient();
  const { data } = await supabase.rpc("can_score", { p_event: eventId });

  return data === true;
}

/**
 * Takes a list of names, one per line, so a host can paste the teams that
 * turned up in one go instead of adding them one at a time.
 */
export async function addParticipantsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const eventId = text(formData, "event_id");
  const keep = { values: formValues(formData) };

  if (!eventId) return failure("Missing event id.", keep);
  if (!(await canScore(eventId))) return failure(NOT_SCOREKEEPER, keep);

  const names = [
    ...new Set(
      text(formData, "names")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    ),
  ];

  if (names.length === 0) {
    return failure("Write at least one team name.", {
      ...keep,
      field: "names",
    });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("event_participants").upsert(
    names.map((name) => ({ event_id: eventId, name })),
    // A name already on the board is left alone rather than reset to no
    // scores - pasting the list twice must not wipe the morning's results.
    { onConflict: "event_id,name", ignoreDuplicates: true },
  );

  if (error) {
    return failure(describeQueryError(error) ?? error.message, keep);
  }

  revalidatePath(`/events/${eventId}`);

  return success(
    `${names.length} ${names.length === 1 ? "team" : "teams"} on the board.`,
  );
}

/** Saves the whole table at once: one pass of the scorer's sheet. */
export async function saveScoresAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const eventId = text(formData, "event_id");

  if (!eventId) return failure("Missing event id.");
  if (!(await canScore(eventId))) return failure(NOT_SCOREKEEPER);

  const supabase = await createClient();

  // Inputs come in as score-<participant id>-<round>.
  const byParticipant = new Map<string, Record<string, number | null>>();

  for (const [key, value] of formData.entries()) {
    const match = /^score-(.+)-([123])$/.exec(key);
    if (!match || typeof value !== "string") continue;

    const [, participantId, round] = match;
    const trimmed = value.trim();
    const parsed = trimmed === "" ? null : Number(trimmed);

    if (parsed !== null && (!Number.isFinite(parsed) || parsed < 0)) {
      return failure("Scores cannot be negative.");
    }

    const row = byParticipant.get(participantId) ?? {};
    row[`round_${round}`] = parsed === null ? null : Math.trunc(parsed);
    byParticipant.set(participantId, row);
  }

  for (const [participantId, rounds] of byParticipant) {
    const { error } = await supabase
      .from("event_participants")
      .update(rounds)
      .eq("id", participantId)
      .eq("event_id", eventId);

    if (error) {
      return failure(describeQueryError(error) ?? error.message);
    }
  }

  revalidatePath(`/events/${eventId}`);

  return success("Scores saved.");
}

export async function removeParticipantAction(
  formData: FormData,
): Promise<void> {
  const eventId = text(formData, "event_id");
  const participantId = text(formData, "participant_id");

  if (!eventId || !participantId) return;
  if (!(await canScore(eventId))) return;

  const supabase = await createClient();
  await supabase
    .from("event_participants")
    .delete()
    .eq("id", participantId)
    .eq("event_id", eventId);

  revalidatePath(`/events/${eventId}`);
}

/**
 * Puts somebody in charge of the board for one event.
 *
 * Scores come off the field rather than from the teams playing, so this is
 * its own small circle: a referee or two, named by the host's captain. The
 * lookup by email happens inside the database function, which will only do it
 * for that captain.
 */
export async function addScorekeeperAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const eventId = text(formData, "event_id");
  const email = text(formData, "email").toLowerCase();
  const keep = { values: formValues(formData) };

  if (!eventId) return failure("Missing event id.", keep);
  if (!email.includes("@")) {
    return failure("Enter the email they signed up with.", {
      ...keep,
      field: "email",
    });
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("add_scorekeeper", {
    p_event: eventId,
    p_email: email,
  });

  if (error) {
    if (/nobody on the hub/i.test(error.message)) {
      return failure(
        `Nobody on the hub uses ${email}. They need an account here first.`,
        { ...keep, field: "email" },
      );
    }
    if (/host captain/i.test(error.message)) {
      return failure("Only the host's captain can appoint scorekeepers.", keep);
    }

    return failure(describeQueryError(error) ?? error.message, keep);
  }

  revalidatePath(`/events/${eventId}`);

  return success(`${email} can enter scores now.`);
}

export async function removeScorekeeperAction(
  formData: FormData,
): Promise<void> {
  const eventId = text(formData, "event_id");
  const profileId = text(formData, "profile_id");

  if (!eventId || !profileId) return;

  const supabase = await createClient();
  await supabase
    .from("event_scorekeepers")
    .delete()
    .eq("event_id", eventId)
    .eq("profile_id", profileId);

  revalidatePath(`/events/${eventId}`);
}
