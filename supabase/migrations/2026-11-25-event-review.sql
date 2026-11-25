-- ===========================================================================
-- Events go through review before they appear.
--
-- Run after the earlier migrations. Safe to run again.
--
-- The calendar was closed: one flagged team posted, everybody else sent their
-- event to Momentum by other means. Now any captain can put one up, and it
-- waits for a moderator to let it through. That keeps the calendar something
-- teams can trust without making Momentum the typist.
--
-- The gate is in the database, not the pages: the select policy hides what is
-- not approved, and a trigger stops anyone but a moderator moving an event
-- between states. A page that forgets to filter cannot leak a draft.
-- ===========================================================================

do $enum$ begin
  create type public.event_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null;
end $enum$;

alter table public.events
  add column if not exists status public.event_status not null default 'pending';

alter table public.events
  add column if not exists reviewed_by uuid references public.profiles (id)
    on delete set null;

alter table public.events
  add column if not exists reviewed_at timestamptz;

-- Why it was turned down, so the team can fix it instead of guessing.
alter table public.events
  add column if not exists review_note text;

create index if not exists events_status_idx on public.events (status, starts_at);

-- Everything that was already on the hub was there because somebody meant it
-- to be. This only catches the rows that predate the column.
update public.events set status = 'approved'
 where status = 'pending' and reviewed_at is null and created_at < now();

-- ------------------------------------------------------------ moderator ----
alter table public.profiles
  add column if not exists is_moderator boolean not null default false;

create or replace function public.is_moderator()
returns boolean language sql stable security definer set search_path = public
as $fn$
  select exists (
    select 1 from public.profiles p
     where p.id = auth.uid() and p.is_moderator
  );
$fn$;

-- Momentum's captain reviews. Run the same update for anybody else who
-- should, or set it to false to take the job away.
update public.profiles p
   set is_moderator = true
 where exists (
   select 1
     from public.team_members m
     join public.teams t on t.id = m.team_id
    where m.profile_id = p.id
      and m.role = 'captain'
      and t.program = 'ftc'
      and t.team_number = 38157
 );

-- ------------------------------------------------------------- the gate ----
-- Who may submit is one question; what state the submission lands in is
-- another, and it is not up to the submitter.
create or replace function public.set_event_status()
returns trigger language plpgsql security definer set search_path = public
as $fn$
begin
  -- A moderator putting one up has already made the decision. The column has
  -- a default, so there is nothing to coalesce here: it is set outright.
  if public.is_moderator() then
    new.status      := 'approved';
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
    return new;
  end if;

  -- A team that publishes without review keeps doing so; everyone else waits.
  if exists (
    select 1 from public.teams t
     where t.id = new.team_id and t.can_host_events
  ) then
    new.status := 'approved';
  else
    new.status := 'pending';
  end if;

  new.reviewed_by := null;
  new.reviewed_at := null;
  new.review_note := null;

  return new;
end;
$fn$;

drop trigger if exists on_event_submitted on public.events;
create trigger on_event_submitted
  before insert on public.events
  for each row execute function public.set_event_status();

create or replace function public.guard_event_status()
returns trigger language plpgsql security definer set search_path = public
as $fn$
begin
  if new.status is distinct from old.status and not public.is_moderator() then
    raise exception 'only a moderator decides whether an event is listed'
      using errcode = '42501';
  end if;

  return new;
end;
$fn$;

drop trigger if exists on_event_status_change on public.events;
create trigger on_event_status_change
  before update on public.events
  for each row execute function public.guard_event_status();

-- ------------------------------------------------------------- policies ----
-- An event nobody approved is visible to the team that wrote it and to the
-- people reviewing it, and to nobody else.
drop policy if exists "events readable by everyone" on public.events;
create policy "events readable by everyone"
  on public.events for select
  using (
    status = 'approved'
    or public.is_team_member(team_id)
    or public.is_moderator()
  );

-- Any captain can put one forward now. The trigger decides where it lands.
drop policy if exists "host adds events" on public.events;
drop policy if exists "captain submits an event" on public.events;
create policy "captain submits an event"
  on public.events for insert
  with check (public.is_team_captain(team_id) or public.is_moderator());

drop policy if exists "team updates own events" on public.events;
create policy "team updates own events"
  on public.events for update
  using (public.is_team_member(team_id))
  with check (public.is_team_member(team_id));

drop policy if exists "moderator reviews events" on public.events;
create policy "moderator reviews events"
  on public.events for update
  using (public.is_moderator()) with check (public.is_moderator());

drop policy if exists "team deletes own events" on public.events;
create policy "team deletes own events"
  on public.events for delete
  using (public.is_team_member(team_id) or public.is_moderator());

select
  (select count(*) from public.events where status = 'approved') as approved,
  (select count(*) from public.events where status = 'pending')  as pending,
  (select count(*) from public.profiles where is_moderator)      as moderators;
