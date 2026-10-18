create table public.asnb_projects (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 title text not null check(length(title) between 1 and 100),
 project jsonb not null check(jsonb_typeof(project)='object' and octet_length(project::text)<=300000),
 revision integer not null default 1,
 editors uuid[] not null default '{}' check(cardinality(editors)<=20),
 viewers uuid[] not null default '{}' check(cardinality(viewers)<=20),
 updated_at timestamptz not null default now()
);
create index asnb_projects_owner_idx on public.asnb_projects(owner_id);
create index asnb_projects_editors_idx on public.asnb_projects using gin(editors);
create index asnb_projects_viewers_idx on public.asnb_projects using gin(viewers);
alter table public.asnb_projects enable row level security;
revoke all on public.asnb_projects from anon,authenticated;
grant select,insert,delete on public.asnb_projects to authenticated;
grant update(title,project,editors,viewers) on public.asnb_projects to authenticated;
create policy "Project members read drafts" on public.asnb_projects for select to authenticated using(owner_id=(select auth.uid()) or editors @> array[(select auth.uid())] or viewers @> array[(select auth.uid())]);
create policy "Owners create drafts" on public.asnb_projects for insert to authenticated with check(owner_id=(select auth.uid()) and cardinality(editors)=0 and cardinality(viewers)=0);
create policy "Editors save drafts" on public.asnb_projects for update to authenticated using(owner_id=(select auth.uid()) or editors @> array[(select auth.uid())]) with check(owner_id=(select auth.uid()) or editors @> array[(select auth.uid())]);
create policy "Owners remove drafts" on public.asnb_projects for delete to authenticated using(owner_id=(select auth.uid()));
create table public.asnb_project_versions (
 project_id uuid not null references public.asnb_projects(id) on delete cascade,
 revision integer not null,
 project jsonb not null,
 author_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(project_id,revision)
);
create index asnb_project_versions_author_idx on public.asnb_project_versions(author_id);
alter table public.asnb_project_versions enable row level security;
revoke all on public.asnb_project_versions from anon,authenticated;
grant select,insert,delete on public.asnb_project_versions to authenticated;
create policy "Project members read versions" on public.asnb_project_versions for select to authenticated using(exists(select 1 from public.asnb_projects p where p.id=project_id));
create policy "Only save trigger records versions" on public.asnb_project_versions for insert to authenticated with check(pg_trigger_depth()>0 and author_id=(select auth.uid()) and exists(select 1 from public.asnb_projects p where p.id=project_id));
create policy "Only save trigger trims versions" on public.asnb_project_versions for delete to authenticated using(pg_trigger_depth()>0 and exists(select 1 from public.asnb_projects p where p.id=project_id));
create function public.asnb_project_guard() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if tg_op='INSERT' then new.revision:=1;new.updated_at:=now();
 else
  if new.owner_id<>old.owner_id or new.id<>old.id then raise exception 'Project identity cannot change';end if;
  if (new.editors is distinct from old.editors or new.viewers is distinct from old.viewers) and auth.uid() is distinct from old.owner_id then raise exception 'Only the owner can share a project';end if;
  new.revision:=old.revision+1;new.updated_at:=now();
 end if;
 return new;
end $$;
create function public.asnb_record_project_version() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 insert into public.asnb_project_versions(project_id,revision,project,author_id) values(new.id,new.revision,new.project,auth.uid());
 delete from public.asnb_project_versions where project_id=new.id and revision<=new.revision-20;
 return new;
end $$;
revoke all on function public.asnb_project_guard() from public,anon,authenticated;
revoke all on function public.asnb_record_project_version() from public,anon,authenticated;
create trigger asnb_project_guard before insert or update on public.asnb_projects for each row execute function public.asnb_project_guard();
create trigger asnb_record_project_version after insert or update on public.asnb_projects for each row execute function public.asnb_record_project_version();
