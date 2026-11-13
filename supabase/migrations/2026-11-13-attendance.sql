-- ===========================================================================
-- "We are coming" for events.
--
-- Run after 2026-11-13-programs.sql. Safe to run again.
--
-- A like says a team finds an event interesting. That is not the number a
-- host needs when booking a hall or counting fields, so attendance is kept
-- separately: one row per team per event, and the team can take it back.
-- ===========================================================================

create table if not exists public.event_attendance (
  event_id   uuid not null references public.events (id) on delete cascade,
  team_id    uuid not null references public.teams  (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, team_id)
);

create index if not exists event_attendance_team_idx
  on public.event_attendance (team_id);

create index if not exists event_attendance_event_idx
  on public.event_attendance (event_id);

alter table public.event_attendance enable row level security;

-- Who is coming is public: that is the point of showing it.
drop policy if exists "attendance readable by everyone" on public.event_attendance;
create policy "attendance readable by everyone"
  on public.event_attendance for select using (true);

drop policy if exists "team manages own attendance" on public.event_attendance;
create policy "team manages own attendance"
  on public.event_attendance for all
  using (auth.uid() = team_id) with check (auth.uid() = team_id);
