-- ===========================================================================
-- The calendar is curated for now.
--
-- Run after the earlier migrations, and after reset-data.sql if you are
-- clearing the hub. Safe to run again.
--
-- Teams no longer put their own events on the hub: a team has to be marked as
-- a host first. The flag lives on the team row rather than in the code so
-- opening it back up - for one team or for everyone - is a line of SQL and not
-- a deploy.
-- ===========================================================================

alter table public.teams
  add column if not exists can_host_events boolean not null default false;

-- The old policy covered insert, update and delete together. Only insert
-- needs the flag: a team that already has an event keeps being able to fix or
-- withdraw it, so clearing the flag later cannot strand an event with nobody
-- able to touch it.
drop policy if exists "team manages own events" on public.events;

drop policy if exists "host adds events" on public.events;
create policy "host adds events"
  on public.events for insert
  with check (
    auth.uid() = team_id
    and exists (
      select 1 from public.teams t
      where t.id = auth.uid() and t.can_host_events
    )
  );

drop policy if exists "team updates own events" on public.events;
create policy "team updates own events"
  on public.events for update
  using (auth.uid() = team_id) with check (auth.uid() = team_id);

drop policy if exists "team deletes own events" on public.events;
create policy "team deletes own events"
  on public.events for delete
  using (auth.uid() = team_id);

-- Let Momentum host. The account has to exist for this to match anything, so
-- run this line again after registering it - and for any other team that
-- should be able to post events. Change the number if the account uses a
-- different one.
update public.teams
   set can_host_events = true
 where program = 'ftc' and team_number = 38157;

select program, team_number, name, can_host_events from public.teams;
