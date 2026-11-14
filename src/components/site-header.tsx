import Link from "next/link";

import { signOutAction } from "@/lib/actions/auth";
import { getCurrentProfile, getCurrentTeam } from "@/lib/auth";
import { canHostEvents } from "@/lib/types";

import { LogOutIcon, LogoMark, PlusIcon } from "./icons";
import { NavLink } from "./nav-link";
import { TeamAvatar } from "./team-avatar";

const LINKS = [
  { href: "/events", label: "Events" },
  { href: "/teams", label: "Teams" },
  { href: "/community", label: "Community" },
  { href: "/search", label: "Search" },
];

export async function SiteHeader() {
  // Signed in is about the person now. They may well have no team yet -
  // that is the normal state between registering and joining one.
  const [profile, team] = await Promise.all([
    getCurrentProfile(),
    getCurrentTeam(),
  ]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <LogoMark className="h-11 w-auto" />
          <span className="font-display text-base font-semibold tracking-tight">
            MOMENTUM<span className="text-brand-mid"> hub</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <NavLink key={link.href} href={link.href}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {profile ? (
            <>
              {canHostEvents(team) ? (
                <Link
                  href="/events/new"
                  className="btn btn-outline btn-sm hidden sm:inline-flex"
                >
                  <PlusIcon className="size-4" />
                  Add event
                </Link>
              ) : null}
              <Link
                href="/dashboard"
                className="flex max-w-50 items-center gap-2 rounded-xl border border-line px-2 py-1.5 transition-colors hover:bg-panel-2"
              >
                <TeamAvatar
                  name={team?.name ?? profile.full_name}
                  logoUrl={team?.logo_url ?? null}
                  size="sm"
                />
                <span className="hidden min-w-0 text-sm lg:block">
                  {team ? (
                    <>
                      <span className="text-fg-dim">#{team.team_number}</span>{" "}
                      <span className="truncate">{team.name}</span>
                    </>
                  ) : (
                    <span className="truncate">{profile.full_name}</span>
                  )}
                </span>
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="btn btn-ghost btn-sm"
                  title="Log out"
                  aria-label="Log out"
                >
                  <LogOutIcon className="size-4" />
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">
                Log in
              </Link>
              <Link href="/signup" className="btn btn-primary btn-sm">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-line px-3 py-2 md:hidden">
        {LINKS.map((link) => (
          <NavLink key={link.href} href={link.href}>
            {link.label}
          </NavLink>
        ))}
        {canHostEvents(team) ? (
          <NavLink href="/events/new">Add event</NavLink>
        ) : null}
      </nav>
    </header>
  );
}
