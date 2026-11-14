import type { Metadata } from "next";
import Link from "next/link";

import {
  CalendarIcon,
  MessageIcon,
  TrophyIcon,
  UsersIcon,
} from "@/components/icons";
import { SetupNotice } from "@/components/setup-notice";
import { isSupabaseConfigured } from "@/lib/supabase/config";

import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Create an account" };

const PERKS = [
  {
    icon: UsersIcon,
    title: "Your own login",
    body: "No shared team password. You sign in as yourself, and what you post has your name on it.",
  },
  {
    icon: CalendarIcon,
    title: "Everything your team is doing",
    body: "Scrimmages, workshops and outreach days in one calendar, with your team marked down for the ones you are going to.",
  },
  {
    icon: MessageIcon,
    title: "Talk to other teams",
    body: "Ask for help with code or CAD, look for an alliance partner, show off what you built.",
  },
  {
    icon: TrophyIcon,
    title: "Scores while they happen",
    body: "Robot game runs go up on the board at the event, so you can see where you stand without waiting for a spreadsheet.",
  },
];

export default function SignupPage() {
  if (!isSupabaseConfigured) {
    return (
      <div className="px-4 py-16 sm:px-6">
        <SetupNotice />
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_minmax(0,460px)] lg:gap-16 lg:py-20">
      <div className="lg:pt-6">
        <p className="eyebrow">An account of your own</p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
          Join the hub
        </h1>
        <p className="mt-4 max-w-md text-fg-muted">
          Name, email, password - that is the whole thing. Once you are in,
          either register your team or take up the invitation your captain
          sent you.
        </p>

        <ul className="mt-9 space-y-6">
          {PERKS.map((perk) => (
            <li key={perk.title} className="flex gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-panel text-brand-mid">
                <perk.icon className="size-5" />
              </span>
              <div>
                <p className="font-medium">{perk.title}</p>
                <p className="mt-1 text-sm text-fg-muted">{perk.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="card p-6 sm:p-8">
          <h2 className="text-xl font-semibold">Create your account</h2>
          <p className="mt-1.5 mb-6 text-sm text-fg-muted">
            Takes a minute. The team comes next.
          </p>
          <SignupForm />
        </div>

        <p className="mt-6 text-center text-sm text-fg-muted">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-brand-mid underline decoration-brand-mid/40 underline-offset-4 hover:decoration-brand-mid"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
