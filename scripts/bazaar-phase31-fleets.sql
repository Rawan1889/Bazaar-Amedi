-- Phase 31: delivery companies (fleets).
-- A fleet_manager owns one fleet. Drivers are either independent (fleet_id null)
-- or linked to a fleet; linked drivers can't accept orders themselves — their
-- fleet manager assigns orders to them. All writes go through server actions
-- (service role), so the only RLS needed is read access for the owner.
-- Safe to re-run.

alter table public.bazaar_profiles drop constraint if exists bazaar_profiles_role_check;
alter table public.bazaar_profiles add constraint bazaar_profiles_role_check
  check (role in ('customer', 'market_admin', 'driver', 'super_admin', 'fleet_manager'));

create table if not exists public.bazaar_fleets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.bazaar_profiles(id) on delete cascade,
  name text not null,
  phone text,
  created_at timestamptz not null default now()
);

alter table public.bazaar_fleets enable row level security;
drop policy if exists "Fleet owner reads own fleet" on public.bazaar_fleets;
create policy "Fleet owner reads own fleet" on public.bazaar_fleets
  for select using (owner_id = auth.uid());

alter table public.bazaar_profiles
  add column if not exists fleet_id uuid references public.bazaar_fleets(id) on delete set null;
create index if not exists bazaar_profiles_fleet_id_idx on public.bazaar_profiles(fleet_id);

-- Which company handled an order (for settlement reports).
alter table public.bazaar_orders
  add column if not exists fleet_id uuid references public.bazaar_fleets(id) on delete set null;

-- Users must not move themselves into or out of a fleet.
create or replace function public.bazaar_guard_profile()
returns trigger language plpgsql as $$
begin
  if public.bazaar_is_trusted_actor() then return new; end if;
  if new.id is distinct from old.id
     or new.role is distinct from old.role
     or new.is_approved is distinct from old.is_approved
     or new.is_suspended is distinct from old.is_suspended
     or new.fleet_id is distinct from old.fleet_id then
    raise exception 'Role, approval, suspension and company can only be changed by an admin.' using errcode = '42501';
  end if;
  return new;
end $$;
