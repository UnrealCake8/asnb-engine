create table public.asnb_games (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) between 3 and 100),
 title text not null check (length(title) between 1 and 100),
 project jsonb not null check (jsonb_typeof(project) = 'object' and octet_length(project::text) <= 300000),
 published boolean not null default true,
 created_at timestamptz not null default now()
);
create index asnb_games_owner_idx on public.asnb_games(owner_id);
alter table public.asnb_games enable row level security;
revoke all on public.asnb_games from anon, authenticated;
grant select on public.asnb_games to anon, authenticated;
grant insert, delete on public.asnb_games to authenticated;
create policy "Published games are readable" on public.asnb_games for select to anon, authenticated using (published or owner_id = (select auth.uid()));
create policy "Creators publish their own games" on public.asnb_games for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "Creators remove their own games" on public.asnb_games for delete to authenticated using (owner_id = (select auth.uid()));
