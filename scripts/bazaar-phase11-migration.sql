-- Bazaar Phase 11 Migration — Delivery zones + configurable fees (Gap 4)
-- Run this in Supabase Dashboard > SQL Editor

-- =====================================================================
-- 1. Delivery zones — admin-managed areas with their own fee, minimum
--    order value, and optional free-delivery threshold.
-- =====================================================================
create table if not exists public.bazaar_delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  fee integer not null default 2500,
  min_order integer not null default 0,            -- min subtotal to order into this zone
  free_delivery_threshold integer,                 -- subtotal at/above which fee is waived (null = never)
  is_active boolean not null default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.bazaar_delivery_zones enable row level security;

drop policy if exists "Zones are publicly viewable" on public.bazaar_delivery_zones;
create policy "Zones are publicly viewable" on public.bazaar_delivery_zones
  for select using (true);

drop policy if exists "Super admin manages zones" on public.bazaar_delivery_zones;
create policy "Super admin manages zones" on public.bazaar_delivery_zones
  for all using (
    exists (select 1 from public.bazaar_profiles where id = auth.uid() and role = 'super_admin')
  );

-- Seed a default zone so existing checkout keeps working (flat 2500 IQD).
insert into public.bazaar_delivery_zones (name, fee, sort_order)
select 'Amedi — city center', 2500, 0
where not exists (select 1 from public.bazaar_delivery_zones);

-- =====================================================================
-- 2. Link zones to addresses (remembered per address) and orders.
-- =====================================================================
alter table public.bazaar_addresses
  add column if not exists zone_id uuid references public.bazaar_delivery_zones(id) on delete set null;

alter table public.bazaar_orders
  add column if not exists zone_id uuid references public.bazaar_delivery_zones(id) on delete set null;
