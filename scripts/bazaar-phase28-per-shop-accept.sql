-- =========================================================
-- Bazaar Phase 28 — Per-shop accept state
-- =========================================================
-- Fix: on a multi-shop order, when one shop hits Accept the whole order flipped
-- to 'confirmed' and the other shop's Accept button vanished — they were shown
-- as if they'd already accepted.
--
-- Fix: track acceptance per-shop on bazaar_order_items.pickup_status.
-- Lifecycle per shop's items: pending → accepted → ready → picked_up
-- The order-level status still moves to 'confirmed' when the FIRST shop
-- accepts (so the customer sees "being prepared"), and to 'ready' when EVERY
-- shop's items are ready.
--
-- Safe to re-run.

alter table public.bazaar_order_items
  drop constraint if exists bazaar_order_items_pickup_status_check;

alter table public.bazaar_order_items
  add constraint bazaar_order_items_pickup_status_check
  check (pickup_status in ('pending', 'accepted', 'ready', 'picked_up'));
