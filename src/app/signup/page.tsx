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

export const metadata: Metadata = { title: "Register your team" };

const PERKS = [
  {
    icon: CalendarIcon,
    title: "Publish your events",
    body: "Scrimmages, workshops, outreach days - add them once and every team in the country sees them.",
  },
  {
    icon: UsersIcon,
    title: "A profile for your team",
    body: "Your number, city, story and roster in one place, so other teams and mentors can find you.",
  },
  {
    icon: MessageIcon,
    title: "Talk to other teams",
    body: "Ask for help with code or CAD, look for an alliance partner, show off what you built.",
  },
  {
    icon: TrophyIcon,
    title: "Feedback that counts",
    body: "Likes and reviews on events tell you what actually worked - useful evidence for judging too.",
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
        <p className="eyebrow">One account per team</p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
          Put your team on the hub
        </h1>
        <p className="mt-4 max-w-md text-fg-muted">
          Register once with your team number. Everyone who knows the login can
          post events, reply in the community and keep the roster up to date.
        </p>

        <ul className="mt-9 space-y-6">
          {PERKS.map((perk) => (
            <li key={perk.title} className="flex gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-panel text-brand">
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
          <h2 className="text-xl font-semibold">Create your team account</h2>
          <p className="mt-1.5 mb-6 text-sm text-fg-muted">
            Takes a minute. You can fill in the rest of the profile later.
          </p>
          <SignupForm />
        </div>

        <p className="mt-6 text-center text-sm text-fg-muted">
          Your team is already registered?{" "}
          <Link
            href="/login"
            className="text-brand underline decoration-brand/40 underline-offset-4 hover:decoration-brand"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
