import Link from "next/link";

import { LogoMark } from "./icons";

export function SiteFooter() {
  return (
    <footer className="mt-6 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <LogoMark className="size-7" />
            <span className="font-display text-sm font-semibold">
              MOMENTUM<span className="text-brand-mid"> hub</span>
            </span>
          </div>
          <p className="mt-3 text-sm text-fg-muted">
            A shared home base for FTC teams: one account per team, every event
            in one list, and a place to actually talk to each other.
          </p>
        </div>

        <div className="flex gap-12 text-sm">
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-wider text-fg-dim uppercase">
              Hub
            </p>
            <Link href="/events" className="block text-fg-muted hover:text-fg">
              Events
            </Link>
            <Link href="/teams" className="block text-fg-muted hover:text-fg">
              Teams
            </Link>
            <Link href="/community" className="block text-fg-muted hover:text-fg">
              Community
            </Link>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-wider text-fg-dim uppercase">
              Your team
            </p>
            <Link href="/signup" className="block text-fg-muted hover:text-fg">
              Register
            </Link>
            <Link href="/login" className="block text-fg-muted hover:text-fg">
              Log in
            </Link>
            <Link href="/dashboard" className="block text-fg-muted hover:text-fg">
              Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-line px-4 py-5 text-center text-xs text-fg-dim sm:px-6">
        Built by an FTC team, for FTC teams. Not affiliated with FIRST.
      </div>
    </footer>
  );
}
