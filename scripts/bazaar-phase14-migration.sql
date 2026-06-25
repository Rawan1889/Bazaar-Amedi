-- Bazaar Phase 14 Migration — Delivery OTP + driver cash collection (Gap 7)
-- Run this in Supabase Dashboard > SQL Editor

-- delivery_code  — 4-digit handoff code shown to the customer; the driver must
--                  enter it to mark the order delivered.
-- cash_remitted  — COD cash for this order has been handed in by the driver
--                  (admin settles it). Used to compute each driver's cash-to-remit.
alter table public.bazaar_orders
  add column if not exists delivery_code text,
  add column if not exists cash_remitted boolean not null default false;
