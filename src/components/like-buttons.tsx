"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";

import { togglePostLikeAction } from "@/lib/actions/community";
import { toggleEventLikeAction } from "@/lib/actions/events";
import { HeartIcon } from "./icons";

type LikeState = { liked: boolean; count: number };

function LikeControl({
  id,
  liked,
  count,
  canLike,
  toggle,
  loginHref,
  label,
  size = "sm",
}: {
  id: string;
  liked: boolean;
  count: number;
  canLike: boolean;
  toggle: (id: string) => Promise<void>;
  loginHref: string;
  label: string;
  size?: "sm" | "lg";
}) {
  const [state, flip] = useOptimistic<LikeState, null>(
    { liked, count },
    (current) => ({
      liked: !current.liked,
      count: Math.max(0, current.count + (current.liked ? -1 : 1)),
    }),
  );
  const [, startTransition] = useTransition();

  const shape =
    size === "lg"
      ? "gap-2 rounded-xl px-4 py-2.5 text-sm"
      : "gap-1.5 rounded-full px-2.5 py-1 text-xs";
  const iconSize = size === "lg" ? "size-4.5" : "size-3.5";

  if (!canLike) {
    return (
      <Link
        href={loginHref}
        title="Log in and join a team to like this"
        className={`inline-flex items-center border border-line bg-panel-2 font-medium text-fg-muted transition-colors hover:border-brand/40 hover:text-fg ${shape}`}
      >
        <HeartIcon className={iconSize} />
        {count}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={state.liked}
      aria-label={label}
      onClick={() =>
        startTransition(async () => {
          flip(null);
          await toggle(id);
        })
      }
      className={`inline-flex cursor-pointer items-center border font-medium transition-colors ${shape} ${
        state.liked
          ? "border-brand/50 bg-brand/15 text-brand-soft"
          : "border-line bg-panel-2 text-fg-muted hover:border-brand/40 hover:text-fg"
      }`}
    >
      <HeartIcon className={iconSize} filled={state.liked} />
      {state.count}
    </button>
  );
}

export function EventLikeButton(props: {
  id: string;
  liked: boolean;
  count: number;
  canLike: boolean;
  size?: "sm" | "lg";
}) {
  return (
    <LikeControl
      {...props}
      toggle={toggleEventLikeAction}
      loginHref="/login?next=/events"
      label="Like this event"
    />
  );
}

export function PostLikeButton(props: {
  id: string;
  liked: boolean;
  count: number;
  canLike: boolean;
  size?: "sm" | "lg";
}) {
  return (
    <LikeControl
      {...props}
      toggle={togglePostLikeAction}
      loginHref="/login?next=/community"
      label="Like this post"
    />
  );
}
