-- Private Realtime topics scoped to existing public game slugs.
create policy "asnb published room read" on realtime.messages for select to anon, authenticated using (
 extension in ('broadcast','presence') and exists (
 select 1 from public.asnb_games g where g.published and
 (select realtime.topic()) ~ '^asnb:game:[a-z0-9-]+:[a-zA-Z0-9_-]{1,32}$' and
 g.slug = split_part((select realtime.topic()),':',3))
);
create policy "asnb published room send" on realtime.messages for insert to anon, authenticated with check (
 extension in ('broadcast','presence') and exists (
 select 1 from public.asnb_games g where g.published and
 (select realtime.topic()) ~ '^asnb:game:[a-z0-9-]+:[a-zA-Z0-9_-]{1,32}$' and
 g.slug = split_part((select realtime.topic()),':',3))
);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('asnb-audio','asnb-audio',true,10485760,array['audio/mpeg','audio/mp3']);
create policy "asnb audio upload own folder" on storage.objects for insert to authenticated with check (
 bucket_id='asnb-audio' and (storage.foldername(name))[1]=(select auth.uid())::text
);

-- Self-contained GLB model uploads (public assets, creator-owned paths).
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('asnb-models','asnb-models',true,20971520,array['model/gltf-binary']);
create policy "asnb model upload own folder" on storage.objects for insert to authenticated with check (
 bucket_id='asnb-models' and (storage.foldername(name))[1]=(select auth.uid())::text
);
