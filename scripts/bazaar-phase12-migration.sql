-- Bazaar Phase 12 Migration — Delivery time slots (Gap 5)
-- Run this in Supabase Dashboard > SQL Editor

-- Customers can deliver ASAP (both null) or schedule a window.
--   scheduled_date  — the delivery day (null = ASAP)
--   scheduled_slot  — the window label, e.g. "12:00 – 14:00" (null = ASAP)
alter table public.bazaar_orders
  add column if not exists scheduled_date date,
  add column if not exists scheduled_slot text;
