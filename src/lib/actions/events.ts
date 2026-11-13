"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { type ActionState, failure, formValues } from "@/lib/action-state";
import { getCurrentTeam } from "@/lib/auth";
import { localInputToIso } from "@/lib/datetime";
import { optionalInteger, optionalText, text } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";
import { isEventAudience, isEventFormat, isEventKind } from "@/lib/types";

const NOT_SIGNED_IN = "Log in with your team account to do that.";

type EventPayload = {
  title: string;
  summary: string | null;
  description: string | null;
  city: string;
  country: string;
  venue: string | null;
  format: string;
  kind: string;
  audience: string;
  starts_at: string;
  ends_at: string | null;
  registration_url: string | null;
  capacity: number | null;
  cost: string | null;
};

function readEventPayload(
  formData: FormData,
): { error: string; field: string } | { payload: EventPayload } {
  const title = text(formData, "title");
  const city = text(formData, "city");
  const format = text(formData, "format");
  const kind = text(formData, "kind");
  const audience = text(formData, "audience");
  const startsAt = localInputToIso(text(formData, "starts_at"));
  const endsAtRaw = text(formData, "ends_at");
  const endsAt = endsAtRaw ? localInputToIso(endsAtRaw) : null;

  if (title.length < 3) {
    return { error: "Give the event a title.", field: "title" };
  }
  if (!isEventFormat(format)) {
    return { error: "Pick how the event runs.", field: "format" };
  }
  if (!isEventKind(kind)) {
    return { error: "Pick the kind of event.", field: "kind" };
  }
  if (!isEventAudience(audience)) {
    return { error: "Pick who the event is for.", field: "audience" };
  }
  if (!startsAt) {
    return {
      error: "Pick the date and time the event starts.",
      field: "starts_at",
    };
  }
  if (format !== "online" && !city) {
    return {
      error: "Enter the city, so teams know where to go.",
      field: "city",
    };
  }
  if (endsAtRaw && !endsAt) {
    return { error: "The end time is not a valid date.", field: "ends_at" };
  }
  if (endsAt && endsAt <= startsAt) {
    return {
      error: "The event cannot end before it starts.",
      field: "ends_at",
    };
  }

  return {
    payload: {
      title,
      summary: optionalText(formData, "summary"),
      description: optionalText(formData, "description"),
      city,
      country: text(formData, "country") || "Kazakhstan",
      venue: optionalText(formData, "venue"),
      format,
      kind,
      audience,
      starts_at: startsAt,
      ends_at: endsAt,
      registration_url: optionalText(formData, "registration_url"),
      capacity: optionalInteger(formData, "capacity"),
      cost: optionalText(formData, "cost"),
    },
  };
}

export async function createEventAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const team = await getCurrentTeam();
  if (!team) return failure(NOT_SIGNED_IN, { values: formValues(formData) });

  const parsed = readEventPayload(formData);
  if ("error" in parsed) {
    return failure(parsed.error, {
      field: parsed.field,
      values: formValues(formData),
    });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .insert({ ...parsed.payload, team_id: team.id })
    .select("id")
    .single();

  if (error) return failure(error.message, { values: formValues(formData) });

  revalidatePath("/events");
  revalidatePath("/dashboard");
  revalidatePath("/");
  redirect(`/events/${data.id}`);
}

export async function updateEventAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const team = await getCurrentTeam();
  if (!team) return failure(NOT_SIGNED_IN, { values: formValues(formData) });

  const eventId = text(formData, "event_id");
  if (!eventId) return failure("Missing event id.");

  const parsed = readEventPayload(formData);
  if ("error" in parsed) {
    return failure(parsed.error, {
      field: parsed.field,
      values: formValues(formData),
    });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update(parsed.payload)
    .eq("id", eventId)
    .eq("team_id", team.id);

  if (error) return failure(error.message);

  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/dashboard");
  redirect(`/events/${eventId}`);
}

export async function deleteEventAction(formData: FormData): Promise<void> {
  const team = await getCurrentTeam();
  if (!team) redirect("/login");

  const eventId = text(formData, "event_id");
  if (!eventId) redirect("/dashboard");

  const supabase = await createClient();
  await supabase.from("events").delete().eq("id", eventId).eq("team_id", team.id);

  revalidatePath("/events");
  revalidatePath("/dashboard");
  revalidatePath("/");
  redirect("/dashboard?deleted=event");
}

export async function toggleEventLikeAction(eventId: string): Promise<void> {
  const team = await getCurrentTeam();
  if (!team) return;

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("event_likes")
    .select("event_id")
    .eq("event_id", eventId)
    .eq("team_id", team.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("event_likes")
      .delete()
      .eq("event_id", eventId)
      .eq("team_id", team.id);
  } else {
    await supabase
      .from("event_likes")
      .insert({ event_id: eventId, team_id: team.id });
  }

  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/");
}

/** "We are coming" - separate from a like, and the team can take it back. */
export async function toggleAttendanceAction(eventId: string): Promise<void> {
  const team = await getCurrentTeam();
  if (!team) return;

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("event_attendance")
    .select("event_id")
    .eq("event_id", eventId)
    .eq("team_id", team.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("event_attendance")
      .delete()
      .eq("event_id", eventId)
      .eq("team_id", team.id);
  } else {
    await supabase
      .from("event_attendance")
      .insert({ event_id: eventId, team_id: team.id });
  }

  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/dashboard");
}

export async function saveFeedbackAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const team = await getCurrentTeam();
  if (!team) return failure(NOT_SIGNED_IN);

  const eventId = text(formData, "event_id");
  const body = text(formData, "body");
  const ratingRaw = optionalInteger(formData, "rating");
  const rating =
    ratingRaw && ratingRaw >= 1 && ratingRaw <= 5 ? ratingRaw : null;

  if (!eventId) return failure("Missing event id.");
  if (body.length < 3) return failure("Write a sentence or two of feedback.");

  const supabase = await createClient();
  const { error } = await supabase.from("event_feedback").upsert(
    { event_id: eventId, team_id: team.id, rating, body },
    { onConflict: "event_id,team_id" },
  );

  if (error) return failure(error.message);

  revalidatePath(`/events/${eventId}`);
  return { error: null, success: "Thanks - your feedback is live." };
}

export async function deleteFeedbackAction(formData: FormData): Promise<void> {
  const team = await getCurrentTeam();
  if (!team) return;

  const feedbackId = text(formData, "feedback_id");
  const eventId = text(formData, "event_id");
  if (!feedbackId) return;

  const supabase = await createClient();
  await supabase
    .from("event_feedback")
    .delete()
    .eq("id", feedbackId)
    .eq("team_id", team.id);

  if (eventId) revalidatePath(`/events/${eventId}`);
}
