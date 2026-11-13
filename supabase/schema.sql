-- ===========================================================================
-- Momentum Hub - database schema for Supabase (PostgreSQL)
--
-- How to use:
--   1. Create a project at https://supabase.com
--   2. Open the SQL Editor, paste this whole file, press Run.
--   3. Copy Project Settings -> API -> URL + anon key into .env.local
--
-- Safe to re-run: everything is guarded with "if not exists" / "if exists".
-- ===========================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- enums ----
do $block$ begin
  create type public.event_format as enum ('in_person', 'online', 'hybrid');
exception when duplicate_object then null; end $block$;

do $block$ begin
  create type public.event_kind as enum (
    'competition', 'scrimmage', 'workshop', 'outreach', 'meetup', 'other'
  );
exception when duplicate_object then null; end $block$;

do $block$ begin
  create type public.post_category as enum (
    'general', 'help', 'showcase', 'announcement', 'looking_for'
  );
exception when duplicate_object then null; end $block$;

-- Which FIRST programme a team competes in, and who an event is aimed at.
do $block$ begin
  create type public.program as enum ('ftc', 'fll');
exception when duplicate_object then null; end $block$;

do $block$ begin
  create type public.event_audience as enum ('ftc', 'fll', 'all');
exception when duplicate_object then null; end $block$;

-- ---------------------------------------------------------------- teams ----
-- One row per account. The primary key IS the auth user id, so "a team" and
-- "an account" are the same thing - exactly one login per team.
create table if not exists public.teams (
  id            uuid primary key references auth.users (id) on delete cascade,
  program       public.program not null default 'ftc',
  team_number   integer not null check (team_number > 0),
  name          text    not null check (char_length(trim(name)) > 0),
  city          text    not null default '',
  country       text    not null default 'Kazakhstan',
  organization  text,
  about         text,
  logo_url      text,
  website       text,
  instagram     text,
  contact_email text,
  rookie_year   integer check (rookie_year is null or rookie_year between 1990 and 2100),
  created_at    timestamptz not null default now()
);

-- FIRST reuses numbers across programmes, so 12345 can be both an FTC and an
-- FLL team. The pair is what identifies a team.
create unique index if not exists teams_program_number_key
  on public.teams (program, team_number);

create index if not exists teams_city_idx    on public.teams (city);
create index if not exists teams_program_idx on public.teams (program);

-- --------------------------------------------------------- team members ----
create table if not exists public.team_members (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams (id) on delete cascade,
  full_name  text not null check (char_length(trim(full_name)) > 0),
  role       text,
  grade      text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists team_members_team_idx on public.team_members (team_id, sort_order);

-- --------------------------------------------------------------- events ----
create table if not exists public.events (
  id               uuid primary key default gen_random_uuid(),
  team_id          uuid not null references public.teams (id) on delete cascade,
  title            text not null check (char_length(trim(title)) > 0),
  summary          text,
  description      text,
  city             text not null default '',
  country          text not null default 'Kazakhstan',
  venue            text,
  format           public.event_format   not null default 'in_person',
  kind             public.event_kind     not null default 'workshop',
  audience         public.event_audience not null default 'all',
  starts_at        timestamptz not null,
  ends_at          timestamptz,
  registration_url text,
  capacity         integer check (capacity is null or capacity > 0),
  cost             text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists events_starts_at_idx on public.events (starts_at);
create index if not exists events_team_idx      on public.events (team_id);
create index if not exists events_city_idx      on public.events (city);

-- ---------------------------------------------------------- event likes ----
create table if not exists public.event_likes (
  event_id   uuid not null references public.events (id) on delete cascade,
  team_id    uuid not null references public.teams  (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, team_id)
);

create index if not exists event_likes_team_idx on public.event_likes (team_id);

-- ------------------------------------------------------- event feedback ----
-- One review per team per event, editable by its author.
create table if not exists public.event_feedback (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events (id) on delete cascade,
  team_id    uuid not null references public.teams  (id) on delete cascade,
  rating     smallint check (rating is null or rating between 1 and 5),
  body       text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now(),
  unique (event_id, team_id)
);

create index if not exists event_feedback_event_idx on public.event_feedback (event_id);

-- ----------------------------------------------------- community: posts ----
create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams (id) on delete cascade,
  title      text not null check (char_length(trim(title)) > 0),
  body       text not null check (char_length(trim(body)) > 0),
  category   public.post_category not null default 'general',
  created_at timestamptz not null default now()
);

create index if not exists posts_created_idx  on public.posts (created_at desc);
create index if not exists posts_category_idx on public.posts (category);

create table if not exists public.post_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  team_id    uuid not null references public.teams (id) on delete cascade,
  body       text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists post_comments_post_idx on public.post_comments (post_id, created_at);

create table if not exists public.post_likes (
  post_id    uuid not null references public.posts (id) on delete cascade,
  team_id    uuid not null references public.teams (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, team_id)
);

-- ------------------------------------------- auto-create team on signup ----
-- The sign-up form passes team_number / team_name / city / country as user
-- metadata; this trigger turns that into the public team profile.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  parsed_number  integer;
  parsed_program public.program;
begin
  parsed_number := nullif(new.raw_user_meta_data ->> 'team_number', '')::integer;

  -- A user created outside the sign-up form (for example from the Supabase
  -- dashboard) carries no team number. Skip the profile instead of failing the
  -- whole insert; the app offers to fill it in on first login.
  if parsed_number is null or parsed_number <= 0 then
    return new;
  end if;

  begin
    parsed_program := coalesce(
      nullif(new.raw_user_meta_data ->> 'program', '')::public.program,
      'ftc'
    );
  exception when invalid_text_representation then
    parsed_program := 'ftc';
  end;

  insert into public.teams (id, team_number, name, city, country, program)
  values (
    new.id,
    parsed_number,
    coalesce(nullif(new.raw_user_meta_data ->> 'team_name', ''), 'Unnamed team'),
    coalesce(new.raw_user_meta_data ->> 'city', ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'country', ''), 'Kazakhstan'),
    parsed_program
  )
  on conflict (id) do nothing;

  return new;
end;
$fn$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --------------------------------------------- keep events.updated_at ------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $fn$
begin
  new.updated_at := now();
  return new;
end;
$fn$;

drop trigger if exists events_touch_updated_at on public.events;
create trigger events_touch_updated_at
  before update on public.events
  for each row execute function public.touch_updated_at();

-- =========================================================================
-- Row level security
--
-- Rule of thumb: everything is readable by everyone (the hub is a public
-- directory), and writable only by the team that owns the row.
-- =========================================================================

alter table public.teams          enable row level security;
alter table public.team_members   enable row level security;
alter table public.events         enable row level security;
alter table public.event_likes    enable row level security;
alter table public.event_feedback enable row level security;
alter table public.posts          enable row level security;
alter table public.post_comments  enable row level security;
alter table public.post_likes     enable row level security;

-- teams -------------------------------------------------------------------
drop policy if exists "teams readable by everyone" on public.teams;
create policy "teams readable by everyone"
  on public.teams for select using (true);

drop policy if exists "team inserts itself" on public.teams;
create policy "team inserts itself"
  on public.teams for insert with check (auth.uid() = id);

drop policy if exists "team updates itself" on public.teams;
create policy "team updates itself"
  on public.teams for update using (auth.uid() = id) with check (auth.uid() = id);

-- team_members ------------------------------------------------------------
drop policy if exists "members readable by everyone" on public.team_members;
create policy "members readable by everyone"
  on public.team_members for select using (true);

drop policy if exists "team manages own members" on public.team_members;
create policy "team manages own members"
  on public.team_members for all
  using (auth.uid() = team_id) with check (auth.uid() = team_id);

-- events ------------------------------------------------------------------
drop policy if exists "events readable by everyone" on public.events;
create policy "events readable by everyone"
  on public.events for select using (true);

drop policy if exists "team manages own events" on public.events;
create policy "team manages own events"
  on public.events for all
  using (auth.uid() = team_id) with check (auth.uid() = team_id);

-- event_likes -------------------------------------------------------------
drop policy if exists "likes readable by everyone" on public.event_likes;
create policy "likes readable by everyone"
  on public.event_likes for select using (true);

drop policy if exists "team manages own likes" on public.event_likes;
create policy "team manages own likes"
  on public.event_likes for all
  using (auth.uid() = team_id) with check (auth.uid() = team_id);

-- event_feedback ----------------------------------------------------------
drop policy if exists "feedback readable by everyone" on public.event_feedback;
create policy "feedback readable by everyone"
  on public.event_feedback for select using (true);

drop policy if exists "team manages own feedback" on public.event_feedback;
create policy "team manages own feedback"
  on public.event_feedback for all
  using (auth.uid() = team_id) with check (auth.uid() = team_id);

-- posts -------------------------------------------------------------------
drop policy if exists "posts readable by everyone" on public.posts;
create policy "posts readable by everyone"
  on public.posts for select using (true);

drop policy if exists "team manages own posts" on public.posts;
create policy "team manages own posts"
  on public.posts for all
  using (auth.uid() = team_id) with check (auth.uid() = team_id);

-- post_comments -----------------------------------------------------------
drop policy if exists "comments readable by everyone" on public.post_comments;
create policy "comments readable by everyone"
  on public.post_comments for select using (true);

drop policy if exists "team manages own comments" on public.post_comments;
create policy "team manages own comments"
  on public.post_comments for all
  using (auth.uid() = team_id) with check (auth.uid() = team_id);

-- post_likes --------------------------------------------------------------
drop policy if exists "post likes readable by everyone" on public.post_likes;
create policy "post likes readable by everyone"
  on public.post_likes for select using (true);

drop policy if exists "team manages own post likes" on public.post_likes;
create policy "team manages own post likes"
  on public.post_likes for all
  using (auth.uid() = team_id) with check (auth.uid() = team_id);
