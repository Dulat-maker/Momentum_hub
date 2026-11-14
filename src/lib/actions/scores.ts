"use server";

import { revalidatePath } from "next/cache";

import {
  type ActionState,
  failure,
  formValues,
  success,
} from "@/lib/action-state";
import { getCurrentTeam } from "@/lib/auth";
import { describeQueryError } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { text } from "@/lib/form";

const NOT_HOST = "Only the team hosting this event keeps its scoreboard.";

/** Whether the signed-in team owns this event. */
async function hostsEvent(eventId: string): Promise<boolean> {
  const team = await getCurrentTeam();
  if (!team) return false;

  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("id")
    .eq("id", eventId)
    .eq("team_id", team.id)
    .maybeSingle();

  return Boolean(data);
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
  if (!(await hostsEvent(eventId))) return failure(NOT_HOST, keep);

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
  if (!(await hostsEvent(eventId))) return failure(NOT_HOST);

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
  if (!(await hostsEvent(eventId))) return;

  const supabase = await createClient();
  await supabase
    .from("event_participants")
    .delete()
    .eq("id", participantId)
    .eq("event_id", eventId);

  revalidatePath(`/events/${eventId}`);
}
