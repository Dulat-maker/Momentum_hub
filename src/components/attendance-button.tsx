"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";

import { toggleAttendanceAction } from "@/lib/actions/events";

import { CheckIcon, UsersIcon } from "./icons";

type State = { going: boolean; count: number };

export function AttendanceButton({
  eventId,
  going,
  count,
  canRespond,
  signedIn,
  capacity,
  past,
}: {
  eventId: string;
  going: boolean;
  count: number;
  /** On a team, so there is somebody to put the mark under. */
  canRespond: boolean;
  signedIn?: boolean;
  capacity?: number | null;
  /** The event has started. It can still be marked - that is the point. */
  past?: boolean;
}) {
  const [state, flip] = useOptimistic<State, null>({ going, count }, (current) => ({
    going: !current.going,
    count: Math.max(0, current.count + (current.going ? -1 : 1)),
  }));
  const [, startTransition] = useTransition();

  if (!canRespond) {
    // Attendance is a team saying it was there, so somebody signed in without
    // a team has nothing to put their mark under yet.
    return signedIn ? (
      <Link href="/dashboard" className="btn btn-outline">
        <UsersIcon className="size-4" />
        Join a team to mark it down
      </Link>
    ) : (
      <Link href={`/login?next=/events/${eventId}`} className="btn btn-outline">
        <UsersIcon className="size-4" />
        Log in to mark your team down
      </Link>
    );
  }

  // Capacity limits who signs up beforehand. Once the day comes, a team that
  // turned up turned up, whatever the spots said.
  const full =
    !past &&
    typeof capacity === "number" &&
    !state.going &&
    state.count >= capacity;

  if (full) {
    return (
      <span
        className="btn btn-outline cursor-not-allowed opacity-60"
        title="Every spot has been taken"
      >
        No spots left
      </span>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={state.going}
      onClick={() =>
        startTransition(async () => {
          flip(null);
          await toggleAttendanceAction(eventId);
        })
      }
      className={`btn ${state.going ? "btn-primary" : "btn-outline"}`}
    >
      {state.going ? (
        <>
          <CheckIcon className="size-4" />
          {past ? "We were here" : "We are going"}
        </>
      ) : (
        <>
          <UsersIcon className="size-4" />
          {past ? "Mark us as here" : "Count us in"}
        </>
      )}
    </button>
  );
}
