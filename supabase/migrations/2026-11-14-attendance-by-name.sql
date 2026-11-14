-- ===========================================================================
-- The host can mark who came, for teams with no account.
--
-- Run after the earlier migrations. Safe to run again.
--
-- Attendance assumed every team was on the hub: the row was (event, team) and
-- nothing else. At a scrimmage most teams are not, and will not sign up on
-- the day, so the count sat at zero while the hall was full. A row can now
-- name a team instead of pointing at one - which is how the scoreboard
-- already works, and for the same reason.
--
-- A team with an account still marks itself; the host can mark anybody.
-- ===========================================================================

alter table public.event_attendance
  add column if not exists id uuid not null default gen_random_uuid();

alter table public.event_attendance
  add column if not exists name text;

alter table public.event_attendance
  add column if not exists added_by uuid references public.profiles (id)
    on delete set null;

-- The old key was the pair, which cannot hold a row with no team.
alter table public.event_attendance drop constraint if exists event_attendance_pkey;
alter table public.event_attendance alter column team_id drop not null;

do $pk$ begin
  alter table public.event_attendance add primary key (id);
exception when invalid_table_definition then null;
end $pk$;

alter table public.event_attendance
  drop constraint if exists event_attendance_named;
alter table public.event_attendance
  add constraint event_attendance_named
  check (team_id is not null or char_length(trim(coalesce(name, ''))) > 0);

-- A team appears once either way.
create unique index if not exists event_attendance_one_per_team
  on public.event_attendance (event_id, team_id)
  where team_id is not null;

create unique index if not exists event_attendance_one_per_name
  on public.event_attendance (event_id, lower(trim(name)))
  where team_id is null;

-- ---------------------------------------------------------------------------
drop policy if exists "team manages own attendance" on public.event_attendance;

drop policy if exists "team marks itself" on public.event_attendance;
create policy "team marks itself"
  on public.event_attendance for all
  using (team_id is not null and public.is_team_member(team_id))
  with check (team_id is not null and public.is_team_member(team_id));

-- The host runs the register on the day, for everyone in the hall.
drop policy if exists "host marks who came" on public.event_attendance;
create policy "host marks who came"
  on public.event_attendance for all
  using (
    exists (
      select 1 from public.events e
       where e.id = event_id and public.is_team_member(e.team_id)
    )
  )
  with check (
    exists (
      select 1 from public.events e
       where e.id = event_id and public.is_team_member(e.team_id)
    )
  );

select count(*) as attendance_rows from public.event_attendance;
