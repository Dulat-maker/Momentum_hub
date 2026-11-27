-- ===========================================================================
-- The roster can hold people who have no account.
--
-- Run after the earlier migrations. Safe to run again.
--
-- Membership was built out of accounts, which is right for permission - only
-- a real login should post as the team. It is wrong for a roster: a team of
-- fourteen showed one name, because thirteen of them have no reason to sign
-- up and never will.
--
-- So a row can now be a person the captain typed in - name, role, photo, a
-- line about them - with no profile behind it. A row with a profile still
-- carries the permission; a row without one carries only the face.
-- ===========================================================================

alter table public.team_members
  add column if not exists id uuid not null default gen_random_uuid();

alter table public.team_members
  add column if not exists full_name text;

alter table public.team_members
  add column if not exists bio text;

alter table public.team_members
  add column if not exists photo_url text;

-- The old key was (team_id, profile_id), which cannot hold a row with no
-- profile. Dropping by name and re-adding is safe to repeat: the new key
-- takes the same name.
alter table public.team_members drop constraint if exists team_members_pkey;
alter table public.team_members alter column profile_id drop not null;
alter table public.team_members add primary key (id);

-- Still one team per person, and one row per person per team - but only for
-- the rows that name a person the hub knows.
drop index if exists public.team_members_one_team;
create unique index if not exists team_members_one_team
  on public.team_members (profile_id)
  where profile_id is not null;

create unique index if not exists team_members_one_row_per_profile
  on public.team_members (team_id, profile_id)
  where profile_id is not null;

alter table public.team_members drop constraint if exists team_members_named;
alter table public.team_members add constraint team_members_named
  check (
    profile_id is not null
    or char_length(trim(coalesce(full_name, ''))) > 0
  );

-- Joining still goes through create_team() and accept_invite(). This is only
-- for the people the captain writes down, which is why it insists on a row
-- with nobody attached.
drop policy if exists "captain writes the roster" on public.team_members;
create policy "captain writes the roster"
  on public.team_members for insert
  with check (public.is_team_captain(team_id) and profile_id is null);

select count(*) as roster_rows from public.team_members;
