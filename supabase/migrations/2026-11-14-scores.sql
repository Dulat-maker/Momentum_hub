-- ===========================================================================
-- Robot game scores for an event.
--
-- Run after the earlier migrations. Safe to run again.
--
-- Three rounds with the best one counting, which is how the Robot Game is
-- scored. Rounds are columns rather than rows because there are always
-- exactly three of them: a separate table would buy flexibility nobody asked
-- for and make the leaderboard a join.
--
-- Participants are free text. Most teams at a scrimmage have no account on
-- the hub, and the scoreboard should not wait for them to make one; team_id
-- links a participant to a hub team where there is one.
-- ===========================================================================

create table if not exists public.event_participants (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events (id) on delete cascade,
  team_id    uuid references public.teams (id) on delete set null,
  name       text not null check (char_length(trim(name)) > 0),
  round_1    integer check (round_1 is null or round_1 >= 0),
  round_2    integer check (round_2 is null or round_2 >= 0),
  round_3    integer check (round_3 is null or round_3 >= 0),
  created_at timestamptz not null default now(),
  unique (event_id, name)
);

create index if not exists event_participants_event_idx
  on public.event_participants (event_id);

alter table public.event_participants enable row level security;

-- Anyone can read: a leaderboard nobody can see is pointless.
drop policy if exists "scores readable by everyone" on public.event_participants;
create policy "scores readable by everyone"
  on public.event_participants for select using (true);

-- Only the team hosting the event keeps the scores, not every team that
-- happens to be taking part.
drop policy if exists "host manages the scoreboard" on public.event_participants;
create policy "host manages the scoreboard"
  on public.event_participants for all
  using (
    exists (
      select 1 from public.events e
      where e.id = event_participants.event_id
        and e.team_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_participants.event_id
        and e.team_id = auth.uid()
    )
  );
