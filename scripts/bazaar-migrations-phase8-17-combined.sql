-- =====================================================================
-- Bazaar Amedi — Combined migrations (Phases 8–17)
-- Run this ONCE in Supabase Dashboard > SQL Editor on the Bazaar project.
-- Every statement is idempotent (IF NOT EXISTS), so re-running is safe.
-- Order matters; do not rearrange.
-- =====================================================================


-- ============================ PHASE 8 ================================
-- Schema drift fixes: product variants, profile flags, flash-sale cols.

create table if not exists public.bazaar_product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.bazaar_products(id) on delete cascade,
  amount numeric not null default 1,
  unit text not null default 'piece',
  price integer not null,
  stock_qty integer,
  in_stock boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

create index if not exists bazaar_product_variants_product_id_idx
  on public.bazaar_product_variants (product_id);

alter table public.bazaar_product_variants enable row level security;

drop policy if exists "Variants are publicly viewable" on public.bazaar_product_variants;
create policy "Variants are publicly viewable" on public.bazaar_product_variants
  for select using (true);

drop policy if exists "Shop owners manage their variants" on public.bazaar_product_variants;
create policy "Shop owners manage their variants" on public.bazaar_product_variants
  for all using (
    exists (
      select 1 from public.bazaar_products p
      join public.bazaar_shops s on s.id = p.shop_id
      where p.id = product_id and s.owner_id = auth.uid()
    )
  );

drop policy if exists "Super admin manages variants" on public.bazaar_product_variants;
create policy "Super admin manages variants" on public.bazaar_product_variants
  for all using (
    exists (select 1 from public.bazaar_profiles where id = auth.uid() and role = 'super_admin')
  );

alter table public.bazaar_profiles
  add column if not exists is_approved boolean not null default false,
  add column if not exists is_suspended boolean not null default false;

update public.bazaar_profiles
  set is_approved = true
  where role <> 'driver' and is_approved = false;

alter table public.bazaar_flash_sales
  add column if not exists quantity integer,
  add column if not exists variant_id uuid references public.bazaar_product_variants(id) on delete set null;


-- ============================ PHASE 9 ================================
-- Saved addresses + map pin.

create table if not exists public.bazaar_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.bazaar_profiles(id) on delete cascade,
  label text not null default 'Home',
  address_text text not null,
  neighborhood text,
  lat double precision,
  lng double precision,
  is_default boolean not null default false,
  created_at timestamptz default now()
);

create index if not exists bazaar_addresses_customer_id_idx
  on public.bazaar_addresses (customer_id);

alter table public.bazaar_addresses enable row level security;

-- order columns must exist before the driver address policy references them
alter table public.bazaar_orders
  add column if not exists address_id uuid references public.bazaar_addresses(id) on delete set null,
  add column if not exists delivery_lat double precision,
  add column if not exists delivery_lng double precision;

drop policy if exists "Customers manage their addresses" on public.bazaar_addresses;
create policy "Customers manage their addresses" on public.bazaar_addresses
  for all using (customer_id = auth.uid()) with check (customer_id = auth.uid());

drop policy if exists "Drivers read addresses on their orders" on public.bazaar_addresses;
create policy "Drivers read addresses on their orders" on public.bazaar_addresses
  for select using (
    exists (
      select 1 from public.bazaar_orders o
      where o.address_id = bazaar_addresses.id and o.driver_id = auth.uid()
    )
  );


-- ============================ PHASE 10 ===============================
-- Live order tracking (driver position on the order).

alter table public.bazaar_orders
  add column if not exists driver_lat double precision,
  add column if not exists driver_lng double precision,
  add column if not exists driver_location_updated_at timestamptz;


-- ============================ PHASE 11 ===============================
-- Delivery zones + configurable fees.

create table if not exists public.bazaar_delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  fee integer not null default 2500,
  min_order integer not null default 0,
  free_delivery_threshold integer,
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

insert into public.bazaar_delivery_zones (name, fee, sort_order)
select 'Amedi — city center', 2500, 0
where not exists (select 1 from public.bazaar_delivery_zones);

alter table public.bazaar_addresses
  add column if not exists zone_id uuid references public.bazaar_delivery_zones(id) on delete set null;

alter table public.bazaar_orders
  add column if not exists zone_id uuid references public.bazaar_delivery_zones(id) on delete set null;


-- ============================ PHASE 12 ===============================
-- Delivery time slots.

alter table public.bazaar_orders
  add column if not exists scheduled_date date,
  add column if not exists scheduled_slot text;


-- ============================ PHASE 14 ===============================
-- Delivery OTP + driver cash collection.

alter table public.bazaar_orders
  add column if not exists delivery_code text,
  add column if not exists cash_remitted boolean not null default false;


-- ============================ PHASE 15 ===============================
-- Self-pickup option.

alter table public.bazaar_orders
  add column if not exists fulfillment_type text not null default 'delivery'
    check (fulfillment_type in ('delivery', 'pickup'));


-- ============================ PHASE 16 ===============================
-- Multi-image product gallery.

create table if not exists public.bazaar_product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.bazaar_products(id) on delete cascade,
  url text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

create index if not exists bazaar_product_images_product_id_idx
  on public.bazaar_product_images (product_id);

alter table public.bazaar_product_images enable row level security;

drop policy if exists "Product images are public" on public.bazaar_product_images;
create policy "Product images are public" on public.bazaar_product_images
  for select using (true);

drop policy if exists "Shop owners manage their product images" on public.bazaar_product_images;
create policy "Shop owners manage their product images" on public.bazaar_product_images
  for all using (
    exists (
      select 1 from public.bazaar_products p
      join public.bazaar_shops s on s.id = p.shop_id
      where p.id = product_id and s.owner_id = auth.uid()
    )
  );


-- ============================ PHASE 17 ===============================
-- Scheduled popup offer banner.

create table if not exists public.bazaar_promo_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text,
  link_url text,
  link_label text,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

alter table public.bazaar_promo_banners enable row level security;

drop policy if exists "Banners are publicly viewable" on public.bazaar_promo_banners;
create policy "Banners are publicly viewable" on public.bazaar_promo_banners
  for select using (true);

drop policy if exists "Super admin manages banners" on public.bazaar_promo_banners;
create policy "Super admin manages banners" on public.bazaar_promo_banners
  for all using (
    exists (select 1 from public.bazaar_profiles where id = auth.uid() and role = 'super_admin')
  );

-- =====================================================================
-- Done. Verify in Table Editor: bazaar_product_variants, bazaar_addresses,
-- bazaar_delivery_zones, bazaar_product_images, bazaar_promo_banners should
-- now exist, and bazaar_orders should have the new columns.
-- =====================================================================
