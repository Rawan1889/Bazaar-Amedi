-- Phase 28: archive products that can't be deleted because past orders reference them.
-- Archived products disappear for customers; owners/admins keep access via their ALL policies.
alter table public.bazaar_products add column if not exists archived_at timestamptz;

drop policy if exists "Products are publicly viewable" on public.bazaar_products;
drop policy if exists "Public read products" on public.bazaar_products;
create policy "Public read active products" on public.bazaar_products
  for select using (archived_at is null);
