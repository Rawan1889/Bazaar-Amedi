-- =========================================================
-- Bazaar Phase 25 — Drop unused delivery_code column
-- =========================================================
-- The delivery_code column (Phase 14) was never wired to any UI.
-- Drop it to keep the schema clean.

alter table public.bazaar_orders
  drop column if exists delivery_code;
