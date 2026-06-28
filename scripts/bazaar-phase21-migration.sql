-- =========================================================
-- Bazaar Phase 21 — Fix order-items created_at + shop RLS
-- Run once in Supabase Dashboard > SQL Editor
-- =========================================================

-- 1. Add created_at to bazaar_order_items (it was missing from the original schema).
--    Existing rows get the current timestamp as a safe default.
alter table public.bazaar_order_items
  add column if not exists created_at timestamptz not null default now();

-- 2. Allow shop owners to SELECT bazaar_orders that contain their items.
--    Without this, the RLS on bazaar_orders blocks the shop owner and the
--    embedded join silently returns null, making orders invisible.
drop policy if exists "Shop owners see relevant orders" on public.bazaar_orders;
create policy "Shop owners see relevant orders" on public.bazaar_orders
  for select using (
    exists (
      select 1
      from   public.bazaar_order_items oi
      join   public.bazaar_shops       s  on s.id = oi.shop_id
      where  oi.order_id = bazaar_orders.id
        and  s.owner_id  = auth.uid()
    )
  );

-- 3. (Optional safety) make sure bazaar_order_items is in the realtime publication
--    so the ShopOrdersRefresher gets INSERT events reliably.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname    = 'supabase_realtime'
      and schemaname = 'public'
      and tablename  = 'bazaar_order_items'
  ) then
    alter publication supabase_realtime add table public.bazaar_order_items;
  end if;
end $$;
