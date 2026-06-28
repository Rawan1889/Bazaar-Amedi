-- =========================================================
-- Bazaar Phase 22 — Add 'ready' to order status constraint
-- Run once in Supabase Dashboard > SQL Editor
-- =========================================================

-- The original schema omitted 'ready' from the status check.
-- markShopOrderReady() sets status='ready', which violates the constraint
-- and silently fails — the "Mark ready for pickup" button does nothing.

-- Drop the old constraint (Postgres auto-names it <table>_<col>_check).
alter table public.bazaar_orders
  drop constraint if exists bazaar_orders_status_check;

-- Re-add with 'ready' included.
alter table public.bazaar_orders
  add constraint bazaar_orders_status_check
  check (status in (
    'pending',
    'confirmed',
    'ready',
    'picking_up',
    'delivering',
    'delivered',
    'cancelled'
  ));
