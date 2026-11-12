import Link from "next/link";

import { signOutAction } from "@/lib/actions/auth";
import { getCurrentTeam } from "@/lib/auth";

import { LogOutIcon, PlusIcon } from "./icons";
import { NavLink } from "./nav-link";
import { TeamAvatar } from "./team-avatar";

const LINKS = [
  { href: "/events", label: "Events" },
  { href: "/teams", label: "Teams" },
  { href: "/community", label: "Community" },
];

export async function SiteHeader() {
  const team = await getCurrentTeam();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        {/* The cradle lockup already carries the wordmark, so only "hub" is
            set next to it. The wordmark sits along the bottom of the image,
            so the row is aligned to the bottom rather than centred - that is
            what puts "hub" on the same line as "momentum". */}
        <Link href="/" className="flex shrink-0 items-end gap-2">
          <img
            src="/logo-cradle.png"
            alt="Momentum"
            className="h-9 w-auto object-contain"
          />
          <span className="font-display pb-px text-base leading-none font-semibold tracking-tight text-brand-mid">
            hub
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
          {team ? (
            <>
              <Link
                href="/events/new"
                className="btn btn-outline btn-sm hidden sm:inline-flex"
              >
                <PlusIcon className="size-4" />
                Add event
              </Link>
              <Link
                href="/dashboard"
                className="flex max-w-50 items-center gap-2 rounded-xl border border-line px-2 py-1.5 transition-colors hover:bg-panel-2"
              >
                <TeamAvatar name={team.name} logoUrl={team.logo_url} size="sm" />
                <span className="hidden min-w-0 text-sm lg:block">
                  <span className="text-fg-dim">#{team.team_number}</span>{" "}
                  <span className="truncate">{team.name}</span>
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
                Register team
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
        {team ? (
          <NavLink href="/events/new">Add event</NavLink>
        ) : null}
      </nav>
    </header>
  );
}
