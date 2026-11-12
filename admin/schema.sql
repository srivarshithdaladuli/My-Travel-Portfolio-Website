-- Srivarshith personal CRM
-- Run this entire file in Supabase SQL Editor.
-- 1) Create your Auth user in Supabase Dashboard first (disable public sign-ups).
-- 2) After creating the user, copy their Auth user UUID.
-- 3) Replace the UUID below and run the INSERT statement at the end.

create extension if not exists pgcrypto;

create table if not exists public.crm_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.crm_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('contacts','opportunities','projects','tasks','finance','notes')),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_records_user_type_updated_idx
  on public.crm_records(user_id, type, updated_at desc);

create or replace function public.crm_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists crm_records_updated_at on public.crm_records;
create trigger crm_records_updated_at
before update on public.crm_records
for each row execute function public.crm_set_updated_at();

alter table public.crm_admins enable row level security;
alter table public.crm_records enable row level security;

revoke all on public.crm_admins from anon, authenticated;
revoke all on public.crm_records from anon, authenticated;
grant select on public.crm_admins to authenticated;
grant select, insert, update, delete on public.crm_records to authenticated;

drop policy if exists "CRM admin can read own membership" on public.crm_admins;
create policy "CRM admin can read own membership"
on public.crm_admins for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "CRM admins can read own records" on public.crm_records;
create policy "CRM admins can read own records"
on public.crm_records for select to authenticated
using (exists (select 1 from public.crm_admins a where a.user_id = (select auth.uid())) and user_id = (select auth.uid()));

drop policy if exists "CRM admins can create own records" on public.crm_records;
create policy "CRM admins can create own records"
on public.crm_records for insert to authenticated
with check (exists (select 1 from public.crm_admins a where a.user_id = (select auth.uid())) and user_id = (select auth.uid()));

drop policy if exists "CRM admins can update own records" on public.crm_records;
create policy "CRM admins can update own records"
on public.crm_records for update to authenticated
using (exists (select 1 from public.crm_admins a where a.user_id = (select auth.uid())) and user_id = (select auth.uid()))
with check (exists (select 1 from public.crm_admins a where a.user_id = (select auth.uid())) and user_id = (select auth.uid()));

drop policy if exists "CRM admins can delete own records" on public.crm_records;
create policy "CRM admins can delete own records"
on public.crm_records for delete to authenticated
using (exists (select 1 from public.crm_admins a where a.user_id = (select auth.uid())) and user_id = (select auth.uid()));

-- After creating your Auth user, replace the UUID and run:
-- insert into public.crm_admins (user_id)
-- values ('00000000-0000-0000-0000-000000000000');
