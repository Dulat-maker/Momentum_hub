-- ===========================================================================
-- Events go through review before they appear.
--
-- RUN THIS ONE STEP AT A TIME. The Supabase SQL editor runs everything you
-- paste as a single transaction, so one error anywhere rolls back all of it
-- and leaves no trace of which statement was at fault. Pasted step by step,
-- whatever fails says so while everything before it stays.
--
-- Every step is safe to run twice.
--
-- What it does: the calendar was closed, so one flagged team posted and
-- everybody else asked Momentum to type their event in. After this, any
-- captain can put one up and it waits for a moderator. The gate is in the
-- database - the select policy hides what is not approved, and a trigger
-- refuses a status change from anyone else - so a page that forgets to
-- filter cannot leak a draft and a crafted request cannot approve itself.
-- ===========================================================================


-- STEP 1 ---------------------------------------------------- the states --
do $enum$ begin
  create type public.event_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null;
end $enum$;


-- STEP 2 --------------------------------------------------- the columns --
alter table public.events
  add column if not exists status public.event_status not null default 'pending';

alter table public.events
  add column if not exists reviewed_by uuid references public.profiles (id)
    on delete set null;

alter table public.events
  add column if not exists reviewed_at timestamptz;

alter table public.events
  add column if not exists review_note text;

create index if not exists events_status_idx on public.events (status, starts_at);


-- STEP 3 ------------------------------------- what was already on the hub --
-- It is there because somebody meant it to be.
update public.events
   set status = 'approved'
 where status = 'pending' and reviewed_at is null;


-- STEP 4 ------------------------------------------------- the moderators --
alter table public.profiles
  add column if not exists is_moderator boolean not null default false;


-- STEP 5 ------------------------------------------------------------------
create or replace function public.is_moderator()
returns boolean language sql stable security definer set search_path = public
as $fn$
  select exists (
    select 1 from public.profiles p
     where p.id = auth.uid() and p.is_moderator
  );
$fn$;


-- STEP 6 ---------------------------------------------- who does the job --
-- Momentum's captain. Run it again for anybody else who should, or set it
-- to false to take the job away.
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


-- STEP 7 ------------------------------------- where a submission lands --
-- Who may submit is one question; what state it lands in is another, and
-- that one is not up to the submitter.
create or replace function public.set_event_status()
returns trigger language plpgsql security definer set search_path = public
as $fn$
begin
  if public.is_moderator() then
    new.status      := 'approved';
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
    return new;
  end if;

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


-- STEP 8 ------------------------------------------------------------------
drop trigger if exists on_event_submitted on public.events;
create trigger on_event_submitted
  before insert on public.events
  for each row execute function public.set_event_status();


-- STEP 9 ------------------------------------------ nobody lists their own --
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


-- STEP 10 -----------------------------------------------------------------
drop trigger if exists on_event_status_change on public.events;
create trigger on_event_status_change
  before update on public.events
  for each row execute function public.guard_event_status();


-- STEP 11 ------------------------------------------------- who sees what --
-- An unapproved event is visible to the team that wrote it and to the
-- people reviewing it, and to nobody else.
drop policy if exists "events readable by everyone" on public.events;
create policy "events readable by everyone"
  on public.events for select
  using (
    status = 'approved'
    or public.is_team_member(team_id)
    or public.is_moderator()
  );


-- STEP 12 ------------------------------------------------ who may submit --
drop policy if exists "host adds events" on public.events;
drop policy if exists "captain submits an event" on public.events;
create policy "captain submits an event"
  on public.events for insert
  with check (public.is_team_captain(team_id) or public.is_moderator());


-- STEP 13 ------------------------------------------------- who may edit --
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


-- STEP 14 ------------------------------------------------------- check it --
select
  (select count(*) from public.events where status = 'approved') as approved,
  (select count(*) from public.events where status = 'pending')  as pending,
  (select count(*) from public.profiles where is_moderator)      as moderators;
