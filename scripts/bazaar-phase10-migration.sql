-- Bazaar Phase 10 Migration — Live order tracking (Gap 3)
-- Run this in Supabase Dashboard > SQL Editor

-- Driver's live position while delivering. The customer's order-detail page
-- subscribes to realtime updates on bazaar_orders and moves the driver marker
-- as these columns change. bazaar_orders is already in the supabase_realtime
-- publication (added in phase 3), so no extra realtime setup is needed.
alter table public.bazaar_orders
  add column if not exists driver_lat double precision,
  add column if not exists driver_lng double precision,
  add column if not exists driver_location_updated_at timestamptz;
