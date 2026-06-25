-- Bazaar Phase 16 Migration — Multi-image product gallery (Gap 9)
-- Run this in Supabase Dashboard > SQL Editor

-- Extra product photos beyond the primary image_url. The product detail page
-- shows image_url first, then these in sort_order.
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
