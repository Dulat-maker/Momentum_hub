-- ===========================================================================
-- People and teams become separate things.
--
-- Run after the earlier migrations. Safe to run again.
--
-- Until now an account WAS a team: teams.id was the auth user's id and every
-- policy read "auth.uid() = team_id". That makes a team a shared login - ten
-- people either pass one password around or register ten teams.
--
-- Now a person signs up for themselves (name, email, password) and a team is
-- something they create or are invited into. Permission comes from membership
-- instead of from owning the login. Teams keep the ids they already have, so
-- everything pointing at teams (id) keeps pointing at the same team.
-- ===========================================================================

-- ------------------------------------------------------------- people ------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null check (char_length(trim(full_name)) > 0),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- --------------------------------------------- a team is not a login any ---
alter table public.teams drop constraint if exists teams_id_fkey;
alter table public.teams alter column id set default gen_random_uuid();
alter table public.teams
  add column if not exists created_by uuid references public.profiles (id)
    on delete set null;

-- --------------------------------------------------------- membership ------
do $enum$ begin
  create type public.team_role as enum ('captain', 'member');
exception when duplicate_object then null;
end $enum$;

-- team_members used to be a hand-written list of names. Membership is the
-- roster now: the people on it are the people who can act for the team. Only
-- the old shape is dropped, so this stays safe to run twice.
do $old$ begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name = 'team_members'
       and column_name = 'full_name'
  ) then
    drop table public.team_members cascade;
  end if;
end $old$;

create table if not exists public.team_members (
  team_id    uuid not null references public.teams (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role       public.team_role not null default 'member',
  title      text,
  sort_order integer not null default 0,
  joined_at  timestamptz not null default now(),
  primary key (team_id, profile_id)
);

-- One team per person for now: it keeps "your team" unambiguous everywhere in
-- the app, and nobody here is on two.
create unique index if not exists team_members_one_team
  on public.team_members (profile_id);

alter table public.team_members enable row level security;

-- ------------------------------------------------------------ invites ------
do $enum$ begin
  create type public.invite_status as enum ('pending', 'accepted', 'declined');
exception when duplicate_object then null;
end $enum$;

-- Invites are by email and are answered in the app, so none of this needs
-- mail to be set up. An invite sent before the person signs up waits for them.
create table if not exists public.team_invites (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams (id) on delete cascade,
  email      text not null check (position('@' in email) > 1),
  invited_by uuid references public.profiles (id) on delete set null,
  status     public.invite_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (team_id, email)
);

create index if not exists team_invites_email_idx
  on public.team_invites (lower(email));

alter table public.team_invites enable row level security;

-- ------------------------------------------------------- scorekeepers ------
-- Robot game scores come off the field, not from the teams playing them, so
-- entering them is its own job: the host appoints a couple of people and only
-- they (and the host's captain) can touch the board.
create table if not exists public.event_scorekeepers (
  event_id   uuid not null references public.events (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  added_by   uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (event_id, profile_id)
);

alter table public.event_scorekeepers enable row level security;

-- ------------------------------------------------------------ helpers ------
-- security definer: these are called from the policies on the very tables
-- they read, which would otherwise recurse.
create or replace function public.is_team_member(t uuid)
returns boolean language sql stable security definer set search_path = public
as $fn$
  select exists (
    select 1 from public.team_members m
     where m.team_id = t and m.profile_id = auth.uid()
  );
$fn$;

create or replace function public.is_team_captain(t uuid)
returns boolean language sql stable security definer set search_path = public
as $fn$
  select exists (
    select 1 from public.team_members m
     where m.team_id = t
       and m.profile_id = auth.uid()
       and m.role = 'captain'
  );
$fn$;

create or replace function public.my_team()
returns uuid language sql stable security definer set search_path = public
as $fn$
  select m.team_id from public.team_members m
   where m.profile_id = auth.uid()
   limit 1;
$fn$;

create or replace function public.can_score(p_event uuid)
returns boolean language sql stable security definer set search_path = public
as $fn$
  select exists (
    select 1 from public.event_scorekeepers s
     where s.event_id = p_event and s.profile_id = auth.uid()
  ) or exists (
    select 1 from public.events ev
     where ev.id = p_event and public.is_team_captain(ev.team_id)
  );
$fn$;

-- --------------------------------------------- a sign-up is now a person ----
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $fn$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      split_part(coalesce(new.email, 'someone@'), '@', 1)
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$fn$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------- creating and joining ----
-- Both sides of a team happen in one statement each: a team without its
-- captain, or an accepted invite with no membership, would be a mess to
-- unpick by hand.
create or replace function public.create_team(
  p_program     public.program,
  p_team_number integer,
  p_name        text,
  p_city        text,
  p_country     text
)
returns uuid language plpgsql security definer set search_path = public
as $fn$
declare
  v_team uuid;
begin
  if auth.uid() is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;

  if exists (select 1 from public.team_members m where m.profile_id = auth.uid())
  then
    raise exception 'already on a team' using errcode = '23505';
  end if;

  insert into public.teams (program, team_number, name, city, country, created_by)
  values (
    coalesce(p_program, 'ftc'),
    p_team_number,
    trim(p_name),
    coalesce(trim(p_city), ''),
    coalesce(nullif(trim(p_country), ''), 'Kazakhstan'),
    auth.uid()
  )
  returning id into v_team;

  insert into public.team_members (team_id, profile_id, role)
  values (v_team, auth.uid(), 'captain');

  return v_team;
end;
$fn$;

create or replace function public.accept_invite(p_invite uuid)
returns uuid language plpgsql security definer set search_path = public
as $fn$
declare
  v_team  uuid;
  v_email text;
begin
  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));

  if auth.uid() is null or v_email = '' then
    raise exception 'not signed in' using errcode = '28000';
  end if;

  select i.team_id into v_team
    from public.team_invites i
   where i.id = p_invite
     and i.status = 'pending'
     and lower(i.email) = v_email;

  if v_team is null then
    raise exception 'that invite is not open to you' using errcode = 'P0002';
  end if;

  if exists (select 1 from public.team_members m where m.profile_id = auth.uid())
  then
    raise exception 'already on a team' using errcode = '23505';
  end if;

  insert into public.team_members (team_id, profile_id, role)
  values (v_team, auth.uid(), 'member');

  update public.team_invites set status = 'accepted' where id = p_invite;

  return v_team;
end;
$fn$;

-- Appointing a scorekeeper means finding somebody by the address they signed
-- up with, and profiles deliberately carry no email - the table is public, and
-- a public list of everyone's address is a mailing list for whoever wants one.
-- So the lookup happens in here, where it is useless to anyone who is not
-- already the captain of the team hosting that event.
create or replace function public.add_scorekeeper(p_event uuid, p_email text)
returns void language plpgsql security definer set search_path = public
as $fn$
declare
  v_profile uuid;
begin
  if not exists (
    select 1 from public.events e
     where e.id = p_event and public.is_team_captain(e.team_id)
  ) then
    raise exception 'only the host captain can do that' using errcode = '42501';
  end if;

  select u.id into v_profile
    from auth.users u
   where lower(u.email) = lower(trim(p_email));

  if v_profile is null then
    raise exception 'nobody on the hub uses that address'
      using errcode = 'P0002';
  end if;

  insert into public.event_scorekeepers (event_id, profile_id, added_by)
  values (p_event, v_profile, auth.uid())
  on conflict do nothing;
end;
$fn$;

-- ------------------------------------------- carry the old accounts over ----
-- Everyone who signed up while a login was a team gets a person, and their
-- team - which kept its id, equal to that login - gets them as captain.
insert into public.profiles (id, full_name)
select u.id,
       coalesce(
         nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
         nullif(trim(u.raw_user_meta_data ->> 'team_name'), ''),
         split_part(coalesce(u.email, 'someone@'), '@', 1)
       )
  from auth.users u
on conflict (id) do nothing;

insert into public.team_members (team_id, profile_id, role)
select t.id, t.id, 'captain'
  from public.teams t
 where exists (select 1 from public.profiles p where p.id = t.id)
on conflict do nothing;

update public.teams t
   set created_by = t.id
 where t.created_by is null
   and exists (select 1 from public.profiles p where p.id = t.id);

-- ===========================================================================
-- Policies. Everything that used to read "auth.uid() = team_id" now asks
-- whether you are on that team.
-- ===========================================================================

-- profiles ------------------------------------------------------------------
drop policy if exists "profiles readable by everyone" on public.profiles;
create policy "profiles readable by everyone"
  on public.profiles for select using (true);

drop policy if exists "person edits themselves" on public.profiles;
create policy "person edits themselves"
  on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "person inserts themselves" on public.profiles;
create policy "person inserts themselves"
  on public.profiles for insert with check (id = auth.uid());

-- teams ----------------------------------------------------------------------
drop policy if exists "team inserts itself" on public.teams;
drop policy if exists "team updates itself" on public.teams;

-- Teams are created through public.create_team(), which also makes the caller
-- its captain, so there is no plain insert policy on purpose.
drop policy if exists "captain edits the team" on public.teams;
create policy "captain edits the team"
  on public.teams for update
  using (public.is_team_captain(id)) with check (public.is_team_captain(id));

drop policy if exists "captain closes the team" on public.teams;
create policy "captain closes the team"
  on public.teams for delete using (public.is_team_captain(id));

-- team_members ---------------------------------------------------------------
drop policy if exists "members readable by everyone" on public.team_members;
create policy "members readable by everyone"
  on public.team_members for select using (true);

-- Joining goes through create_team() or accept_invite(); nobody adds
-- themselves to a team by writing a row.
drop policy if exists "team manages own members" on public.team_members;

drop policy if exists "captain or self edits a membership" on public.team_members;
create policy "captain or self edits a membership"
  on public.team_members for update
  using (public.is_team_captain(team_id) or profile_id = auth.uid())
  with check (public.is_team_captain(team_id) or profile_id = auth.uid());

drop policy if exists "captain removes, anyone leaves" on public.team_members;
create policy "captain removes, anyone leaves"
  on public.team_members for delete
  using (public.is_team_captain(team_id) or profile_id = auth.uid());

-- team_invites ---------------------------------------------------------------
-- An invite is visible to the team that sent it and to the person it names.
drop policy if exists "invites visible to both sides" on public.team_invites;
create policy "invites visible to both sides"
  on public.team_invites for select
  using (
    public.is_team_member(team_id)
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

drop policy if exists "captain invites" on public.team_invites;
create policy "captain invites"
  on public.team_invites for insert
  with check (public.is_team_captain(team_id));

drop policy if exists "captain or invitee answers" on public.team_invites;
create policy "captain or invitee answers"
  on public.team_invites for update
  using (
    public.is_team_captain(team_id)
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  with check (
    public.is_team_captain(team_id)
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

drop policy if exists "captain withdraws an invite" on public.team_invites;
create policy "captain withdraws an invite"
  on public.team_invites for delete
  using (public.is_team_captain(team_id));

-- events ---------------------------------------------------------------------
drop policy if exists "host adds events" on public.events;
create policy "host adds events"
  on public.events for insert
  with check (
    public.is_team_member(team_id)
    and exists (
      select 1 from public.teams t
       where t.id = team_id and t.can_host_events
    )
  );

drop policy if exists "team updates own events" on public.events;
create policy "team updates own events"
  on public.events for update
  using (public.is_team_member(team_id))
  with check (public.is_team_member(team_id));

drop policy if exists "team deletes own events" on public.events;
create policy "team deletes own events"
  on public.events for delete
  using (public.is_team_member(team_id));

-- event_likes ----------------------------------------------------------------
drop policy if exists "team manages own likes" on public.event_likes;
create policy "team manages own likes"
  on public.event_likes for all
  using (public.is_team_member(team_id))
  with check (public.is_team_member(team_id));

-- event_attendance -----------------------------------------------------------
drop policy if exists "team manages own attendance" on public.event_attendance;
create policy "team manages own attendance"
  on public.event_attendance for all
  using (public.is_team_member(team_id))
  with check (public.is_team_member(team_id));

-- event_feedback -------------------------------------------------------------
drop policy if exists "team manages own feedback" on public.event_feedback;
create policy "team manages own feedback"
  on public.event_feedback for all
  using (public.is_team_member(team_id))
  with check (public.is_team_member(team_id));

-- event_participants ---------------------------------------------------------
-- The board is public; writing to it is the scorekeepers' job.
drop policy if exists "scores readable by everyone" on public.event_participants;
create policy "scores readable by everyone"
  on public.event_participants for select using (true);

drop policy if exists "host manages the scoreboard" on public.event_participants;
drop policy if exists "scorekeepers enter the runs" on public.event_participants;
create policy "scorekeepers enter the runs"
  on public.event_participants for all
  using (public.can_score(event_id))
  with check (public.can_score(event_id));

-- event_scorekeepers ---------------------------------------------------------
drop policy if exists "scorekeepers readable by everyone" on public.event_scorekeepers;
create policy "scorekeepers readable by everyone"
  on public.event_scorekeepers for select using (true);

drop policy if exists "host appoints scorekeepers" on public.event_scorekeepers;
create policy "host appoints scorekeepers"
  on public.event_scorekeepers for all
  using (
    exists (
      select 1 from public.events e
       where e.id = event_id and public.is_team_captain(e.team_id)
    )
  )
  with check (
    exists (
      select 1 from public.events e
       where e.id = event_id and public.is_team_captain(e.team_id)
    )
  );

-- posts ----------------------------------------------------------------------
drop policy if exists "team manages own posts" on public.posts;
create policy "team manages own posts"
  on public.posts for all
  using (public.is_team_member(team_id))
  with check (public.is_team_member(team_id));

drop policy if exists "team manages own comments" on public.post_comments;
create policy "team manages own comments"
  on public.post_comments for all
  using (public.is_team_member(team_id))
  with check (public.is_team_member(team_id));

drop policy if exists "team manages own post likes" on public.post_likes;
create policy "team manages own post likes"
  on public.post_likes for all
  using (public.is_team_member(team_id))
  with check (public.is_team_member(team_id));

-- outreach -------------------------------------------------------------------
drop policy if exists "team manages own outreach" on public.outreach_entries;
create policy "team manages own outreach"
  on public.outreach_entries for all
  using (public.is_team_member(team_id))
  with check (public.is_team_member(team_id));

-- storage --------------------------------------------------------------------
-- Uploads still live in a folder named after the team; what changed is who
-- counts as that team.
drop policy if exists "team uploads its own logo" on storage.objects;
create policy "team uploads its own logo"
  on storage.objects for insert
  with check (
    bucket_id = 'team-logos'
    and (storage.foldername(name))[1] = public.my_team()::text
  );

drop policy if exists "team replaces its own logo" on storage.objects;
create policy "team replaces its own logo"
  on storage.objects for update
  using (
    bucket_id = 'team-logos'
    and (storage.foldername(name))[1] = public.my_team()::text
  )
  with check (
    bucket_id = 'team-logos'
    and (storage.foldername(name))[1] = public.my_team()::text
  );

drop policy if exists "team deletes its own logo" on storage.objects;
create policy "team deletes its own logo"
  on storage.objects for delete
  using (
    bucket_id = 'team-logos'
    and (storage.foldername(name))[1] = public.my_team()::text
  );

drop policy if exists "team uploads its own covers" on storage.objects;
create policy "team uploads its own covers"
  on storage.objects for insert
  with check (
    bucket_id = 'event-covers'
    and (storage.foldername(name))[1] = public.my_team()::text
  );

drop policy if exists "team replaces its own covers" on storage.objects;
create policy "team replaces its own covers"
  on storage.objects for update
  using (
    bucket_id = 'event-covers'
    and (storage.foldername(name))[1] = public.my_team()::text
  )
  with check (
    bucket_id = 'event-covers'
    and (storage.foldername(name))[1] = public.my_team()::text
  );

drop policy if exists "team deletes its own covers" on storage.objects;
create policy "team deletes its own covers"
  on storage.objects for delete
  using (
    bucket_id = 'event-covers'
    and (storage.foldername(name))[1] = public.my_team()::text
  );

-- What the hub looks like now.
select
  (select count(*) from public.profiles)     as people,
  (select count(*) from public.teams)        as teams,
  (select count(*) from public.team_members) as memberships,
  (select count(*) from public.team_invites) as invites;
