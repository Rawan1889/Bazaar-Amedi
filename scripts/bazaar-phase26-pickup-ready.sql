-- =========================================================
-- Bazaar Phase 26 — Allow 'ready' on bazaar_order_items.pickup_status
-- =========================================================
-- The multi-shop pickup gate needs an intermediate 'ready' state per item
-- (shop packed but driver hasn't collected yet). The original check
-- constraint only allowed 'pending' and 'picked_up', which silently
-- rejected UPDATEs from markShopOrderReady.

alter table public.bazaar_order_items
  drop constraint if exists bazaar_order_items_pickup_status_check;

alter table public.bazaar_order_items
  add constraint bazaar_order_items_pickup_status_check
  check (pickup_status in ('pending', 'ready', 'picked_up'));
