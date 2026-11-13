-- ===========================================================================
-- Somewhere to put team logos.
--
-- Run after the earlier migrations. Safe to run again.
--
-- Until now a logo had to be hosted somewhere else and pasted in as a URL,
-- which in practice meant almost nobody had one. This adds a public bucket
-- teams upload into directly.
--
-- Files live under the team's own id:  <team id>/logo-<timestamp>.<ext>
-- which is what the write policies check, so one team cannot overwrite
-- another's logo.
-- ===========================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'team-logos',
  'team-logos',
  true,
  2097152, -- 2 MB; a logo has no business being larger
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Anyone can look: logos show on public team pages and event cards.
drop policy if exists "team logos are public" on storage.objects;
create policy "team logos are public"
  on storage.objects for select
  using (bucket_id = 'team-logos');

-- Writing is limited to the folder named after the team's own id.
drop policy if exists "team uploads its own logo" on storage.objects;
create policy "team uploads its own logo"
  on storage.objects for insert
  with check (
    bucket_id = 'team-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "team replaces its own logo" on storage.objects;
create policy "team replaces its own logo"
  on storage.objects for update
  using (
    bucket_id = 'team-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'team-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "team deletes its own logo" on storage.objects;
create policy "team deletes its own logo"
  on storage.objects for delete
  using (
    bucket_id = 'team-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
