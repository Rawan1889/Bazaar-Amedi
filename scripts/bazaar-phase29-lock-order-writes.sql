-- =========================================================
-- Bazaar Phase 29 — Lock down direct order writes
-- =========================================================
-- The anon key is public, so these policies let any signed-in user write to
-- orders straight through Supabase's REST API, bypassing placeOrder():
--   * customers could INSERT an order with any total / delivery_fee / status
--   * customers could INSERT order items with any unit_price
--   * drivers could UPDATE any column (total, customer_id…) on assigned orders
--
-- All legitimate writes now go through server actions that validate first and
-- use the service-role client, so these policies are no longer needed.
-- Read (SELECT) policies are unchanged — realtime and order pages still work.
--
-- Safe to re-run.

drop policy if exists "Customers create orders" on public.bazaar_orders;
drop policy if exists "Customers insert order items" on public.bazaar_order_items;
drop policy if exists "Drivers update assigned orders" on public.bazaar_orders;
