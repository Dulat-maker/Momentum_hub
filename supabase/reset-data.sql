-- ===========================================================================
-- Clears the test data out of the hub.
--
-- THIS CANNOT BE UNDONE. It is not a migration - it is a one-off clean-up of
-- the accounts that were registered while the hub was being built. Run it in
-- the Supabase SQL editor.
--
-- It names those four accounts rather than emptying the table, so it stays
-- safe to run after the real teams have started registering. The one-liner
-- for a full wipe is at the bottom.
--
-- Deleting the account is enough: teams.id references auth.users on delete
-- cascade and the rest of the hub hangs off teams, so the events, posts,
-- comments, likes, scoreboards and rosters go with it. Anyone still logged in
-- on one of these accounts is signed out on their next page load.
-- ===========================================================================

delete from auth.users u
 where exists (
   select 1 from public.teams t
    where t.id = u.id
      and (
           (t.program = 'ftc' and t.team_number in (6767, 676767, 414123))
        or (t.program = 'fll' and t.team_number = 414123)
      )
 );

-- Half-finished sign-ups from the same testing: an account whose team row
-- never arrived cannot log in to anything useful anyway.
delete from auth.users u
 where not exists (select 1 from public.teams t where t.id = u.id);

-- Uploads live in storage, which the cascade does not reach, so a logo or
-- cover outlives the team that owned it. They cannot be removed from here:
-- Supabase refuses a direct delete from storage.objects ("Direct deletion from
-- storage tables is not allowed") and an orphan has to go through the Storage
-- tab in the dashboard, or the Storage API.
--
-- Each file sits in a folder named after its team, so a folder with no team
-- behind it is an orphan. Run this on its own to see whether there are any -
-- both buckets were empty when this was written, so most likely not:
--
--   select o.bucket_id, o.name
--     from storage.objects o
--    where o.bucket_id in ('team-logos', 'event-covers')
--      and not exists (
--        select 1 from public.teams t
--         where t.id::text = (storage.foldername(o.name))[1]
--      );

-- What is left. The six teams coming to the scrimmage are not accounts yet,
-- so nothing of theirs is touched by any of the above.
select program, team_number, name, city from public.teams order by created_at;

select
  (select count(*) from auth.users)    as accounts,
  (select count(*) from public.teams)  as teams,
  (select count(*) from public.events) as events,
  (select count(*) from public.posts)  as posts;

-- To empty the hub completely instead, including accounts registered later:
--   delete from auth.users;
