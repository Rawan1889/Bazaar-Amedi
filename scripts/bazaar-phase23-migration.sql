-- Bazaar Phase 23 — Add neighborhood and zone selection to profiles and shops
-- Run in Supabase Dashboard > SQL Editor

-- 1. Add zone_id to public.bazaar_profiles
alter table public.bazaar_profiles
  add column if not exists zone_id uuid references public.bazaar_delivery_zones(id) on delete set null;

-- 2. Add neighborhood and zone_id to public.bazaar_shops
alter table public.bazaar_shops
  add column if not exists neighborhood text,
  add column if not exists zone_id uuid references public.bazaar_delivery_zones(id) on delete set null;
