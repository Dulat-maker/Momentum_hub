-- ===========================================================================
-- Open the hub to FLL teams as well as FTC.
--
-- Run this once in the Supabase SQL editor on a project that already has
-- schema.sql applied. Safe to run again: every step is guarded.
--
-- What changes:
--   * teams gain a programme (ftc / fll). Existing rows become ftc.
--   * team numbers stop being globally unique - FIRST hands out the same
--     numbers in different programmes, so uniqueness is per programme.
--   * events gain an audience, so an FLL workshop is not listed as something
--     an FTC team should turn up to.
-- ===========================================================================

do $block$ begin
  create type public.program as enum ('ftc', 'fll');
exception when duplicate_object then null; end $block$;

do $block$ begin
  create type public.event_audience as enum ('ftc', 'fll', 'all');
exception when duplicate_object then null; end $block$;

-- ---------------------------------------------------------------- teams ----
alter table public.teams
  add column if not exists program public.program not null default 'ftc';

-- A number alone no longer identifies a team.
alter table public.teams drop constraint if exists teams_team_number_key;

create unique index if not exists teams_program_number_key
  on public.teams (program, team_number);

create index if not exists teams_program_idx on public.teams (program);

-- --------------------------------------------------------------- events ----
alter table public.events
  add column if not exists audience public.event_audience not null default 'all';

create index if not exists events_audience_idx on public.events (audience);

-- ------------------------------------------- sign-up trigger, updated ------
-- Carries the programme chosen on the sign-up form into the profile row.
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
