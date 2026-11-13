-- ===========================================================================
-- An outreach log for each team.
--
-- Run after the earlier migrations. Safe to run again.
--
-- FTC and FLL teams have to show what they did for the community, and most
-- of them keep it in a spreadsheet that nobody else ever sees. Keeping it
-- here means the record builds up as the season goes, and the team's own
-- page is what a judge can be pointed at.
--
-- Public to read, like everything else on the hub: the point is to be seen.
-- ===========================================================================

create table if not exists public.outreach_entries (
  id             uuid primary key default gen_random_uuid(),
  team_id        uuid not null references public.teams (id) on delete cascade,
  happened_on    date not null,
  title          text not null check (char_length(trim(title)) > 0),
  description    text,
  -- Both optional: not every activity has a sensible number attached, and a
  -- made-up one is worse than none.
  people_reached integer check (people_reached is null or people_reached >= 0),
  hours          numeric(6,1) check (hours is null or hours >= 0),
  link           text,
  created_at     timestamptz not null default now()
);

create index if not exists outreach_team_idx
  on public.outreach_entries (team_id, happened_on desc);

alter table public.outreach_entries enable row level security;

drop policy if exists "outreach readable by everyone" on public.outreach_entries;
create policy "outreach readable by everyone"
  on public.outreach_entries for select using (true);

drop policy if exists "team manages own outreach" on public.outreach_entries;
create policy "team manages own outreach"
  on public.outreach_entries for all
  using (auth.uid() = team_id) with check (auth.uid() = team_id);
