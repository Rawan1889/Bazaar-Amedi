-- Bazaar Phase 8 Migration — Schema drift fixes (Gap 1)
-- Run this in Supabase Dashboard > SQL Editor
--
-- The app code already references these tables/columns, but no prior migration
-- created them. This brings the database in sync with the code so a fresh
-- deploy (or anyone re-running the schema) doesn't break product variants,
-- driver approval, user suspension, or flash-sale stock limits.

-- =====================================================================
-- 1. Product variants (amount / unit / price / stock per product)
--    Referenced by: lib/bazaar/shop-actions.ts, order-actions.ts,
--    flash-sale-actions.ts, browse/search pages.
-- =====================================================================
create table if not exists public.bazaar_product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.bazaar_products(id) on delete cascade,
  amount numeric not null default 1,
  unit text not null default 'piece',
  price integer not null,
  stock_qty integer,            -- null = unlimited / not tracked
  in_stock boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

create index if not exists bazaar_product_variants_product_id_idx
  on public.bazaar_product_variants (product_id);

alter table public.bazaar_product_variants enable row level security;

-- Public can read variants (storefront pricing)
drop policy if exists "Variants are publicly viewable" on public.bazaar_product_variants;
create policy "Variants are publicly viewable" on public.bazaar_product_variants
  for select using (true);

-- Shop owners manage variants for their own products
drop policy if exists "Shop owners manage their variants" on public.bazaar_product_variants;
create policy "Shop owners manage their variants" on public.bazaar_product_variants
  for all using (
    exists (
      select 1 from public.bazaar_products p
      join public.bazaar_shops s on s.id = p.shop_id
      where p.id = product_id and s.owner_id = auth.uid()
    )
  );

-- Super admin full access
drop policy if exists "Super admin manages variants" on public.bazaar_product_variants;
create policy "Super admin manages variants" on public.bazaar_product_variants
  for all using (
    exists (select 1 from public.bazaar_profiles where id = auth.uid() and role = 'super_admin')
  );

-- =====================================================================
-- 2. Driver approval + user suspension flags on profiles
--    Referenced by: lib/bazaar/auth.ts, admin-actions.ts, driver/page.tsx,
--    admin/users/user-list.tsx.
-- =====================================================================
alter table public.bazaar_profiles
  add column if not exists is_approved boolean not null default false,
  add column if not exists is_suspended boolean not null default false;

-- Existing customers / market owners / admins should be treated as approved.
-- Only drivers gate on approval, so default the non-driver rows to true and
-- leave drivers to be approved explicitly by an admin.
update public.bazaar_profiles
  set is_approved = true
  where role <> 'driver' and is_approved = false;

-- =====================================================================
-- 3. Flash-sale stock limit + variant link
--    Referenced by: lib/bazaar/flash-sale-actions.ts, order-actions.ts.
-- =====================================================================
alter table public.bazaar_flash_sales
  add column if not exists quantity integer,       -- null = no stock cap
  add column if not exists variant_id uuid references public.bazaar_product_variants(id) on delete set null;
