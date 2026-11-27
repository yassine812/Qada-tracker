-- Account-owned onboarding and progress snapshot for cross-device restore.
-- The browser can access only the authenticated user's own row.
create table if not exists public.account_backups (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.account_backups enable row level security;

drop policy if exists "Users can read their own account backup" on public.account_backups;
create policy "Users can read their own account backup"
  on public.account_backups for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own account backup" on public.account_backups;
create policy "Users can create their own account backup"
  on public.account_backups for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own account backup" on public.account_backups;
create policy "Users can update their own account backup"
  on public.account_backups for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.account_backups from anon;
grant select, insert, update on public.account_backups to authenticated;
-- The account API authenticates the user's JWT and may use the server's
-- publishable client. Keep service_role access available for maintenance and
-- deployments that still use the server-only fallback client.
grant select, insert, update on public.account_backups to service_role;
