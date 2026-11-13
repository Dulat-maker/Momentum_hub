-- ===========================================================================
-- Cover images for events.
--
-- Run after the earlier migrations. Safe to run again.
--
-- Event cards are the main thing people look at on the hub and they are
-- currently all text. A cover is optional; cards without one keep the layout
-- they have.
--
-- Covers live under the hosting team's own id, the same shape the logo bucket
-- uses, so the write policies can check the folder.
-- ===========================================================================

alter table public.events
  add column if not exists cover_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-covers',
  'event-covers',
  true,
  4194304, -- 4 MB: a photo, not a logo
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "event covers are public" on storage.objects;
create policy "event covers are public"
  on storage.objects for select
  using (bucket_id = 'event-covers');

drop policy if exists "team uploads its own covers" on storage.objects;
create policy "team uploads its own covers"
  on storage.objects for insert
  with check (
    bucket_id = 'event-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "team replaces its own covers" on storage.objects;
create policy "team replaces its own covers"
  on storage.objects for update
  using (
    bucket_id = 'event-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'event-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "team deletes its own covers" on storage.objects;
create policy "team deletes its own covers"
  on storage.objects for delete
  using (
    bucket_id = 'event-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
