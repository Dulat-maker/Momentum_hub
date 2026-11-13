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
  capacity,
  past,
}: {
  eventId: string;
  going: boolean;
  count: number;
  canRespond: boolean;
  capacity?: number | null;
  past?: boolean;
}) {
  const [state, flip] = useOptimistic<State, null>({ going, count }, (current) => ({
    going: !current.going,
    count: Math.max(0, current.count + (current.going ? -1 : 1)),
  }));
  const [, startTransition] = useTransition();

  if (past) {
    return (
      <span className="chip">
        <UsersIcon className="size-3.5" />
        {state.count} came
      </span>
    );
  }

  if (!canRespond) {
    return (
      <Link href={`/login?next=/events/${eventId}`} className="btn btn-outline">
        <UsersIcon className="size-4" />
        Log in to join
      </Link>
    );
  }

  const full =
    typeof capacity === "number" && !state.going && state.count >= capacity;

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
          We are going
        </>
      ) : (
        <>
          <UsersIcon className="size-4" />
          Count us in
        </>
      )}
    </button>
  );
}
