-- =========================================================
-- Bazaar Phase 24 — Fix infinite recursion on bazaar_orders RLS
-- Paste into Supabase SQL Editor and run.
-- =========================================================

-- The Phase 21 "Shop owners see relevant orders" policy triggered infinite
-- recursion because it queries bazaar_order_items, and bazaar_order_items has
-- its own RLS policy that queries bazaar_orders. We break the cycle with a
-- SECURITY DEFINER helper that runs with RLS suspended.

create or replace function public.bazaar_order_has_shop_owner(order_uuid uuid, user_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from   bazaar_order_items oi
    join   bazaar_shops       s on s.id = oi.shop_id
    where  oi.order_id = order_uuid
      and  s.owner_id  = user_uuid
  );
$$;

drop policy if exists "Shop owners see relevant orders" on public.bazaar_orders;
create policy "Shop owners see relevant orders" on public.bazaar_orders
  for select using (
    public.bazaar_order_has_shop_owner(id, auth.uid())
  );
