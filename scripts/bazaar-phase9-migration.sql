-- Bazaar Phase 9 Migration — Saved addresses + map pin (Gap 2)
-- Run this in Supabase Dashboard > SQL Editor

-- =====================================================================
-- 1. Customer address book
--    Each customer can save multiple delivery addresses with a map pin.
-- =====================================================================
create table if not exists public.bazaar_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.bazaar_profiles(id) on delete cascade,
  label text not null default 'Home',        -- Home / Work / etc.
  address_text text not null,                -- house / landmark description
  neighborhood text,
  lat double precision,
  lng double precision,
  is_default boolean not null default false,
  created_at timestamptz default now()
);

create index if not exists bazaar_addresses_customer_id_idx
  on public.bazaar_addresses (customer_id);

alter table public.bazaar_addresses enable row level security;

-- =====================================================================
-- 2. Link orders to a saved address + store the delivery pin coordinates
--    (coords also power live order tracking in Gap 3).
--    Must run BEFORE the driver address policy below, which references
--    bazaar_orders.address_id.
-- =====================================================================
alter table public.bazaar_orders
  add column if not exists address_id uuid references public.bazaar_addresses(id) on delete set null,
  add column if not exists delivery_lat double precision,
  add column if not exists delivery_lng double precision;

-- =====================================================================
-- 3. Address RLS policies
-- =====================================================================
drop policy if exists "Customers manage their addresses" on public.bazaar_addresses;
create policy "Customers manage their addresses" on public.bazaar_addresses
  for all using (customer_id = auth.uid()) with check (customer_id = auth.uid());

-- Drivers need to read the destination address of orders assigned to them.
drop policy if exists "Drivers read addresses on their orders" on public.bazaar_addresses;
create policy "Drivers read addresses on their orders" on public.bazaar_addresses
  for select using (
    exists (
      select 1 from public.bazaar_orders o
      where o.address_id = bazaar_addresses.id and o.driver_id = auth.uid()
    )
  );
