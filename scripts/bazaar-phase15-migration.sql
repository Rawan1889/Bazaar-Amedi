-- Bazaar Phase 15 Migration — Self-pickup option (Gap 8)
-- Run this in Supabase Dashboard > SQL Editor

-- fulfillment_type: 'delivery' (driver brings it) or 'pickup' (customer collects
-- from the shop — no delivery fee, no driver assigned).
alter table public.bazaar_orders
  add column if not exists fulfillment_type text not null default 'delivery'
    check (fulfillment_type in ('delivery', 'pickup'));
