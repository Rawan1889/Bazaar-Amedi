-- Phase 32: delivery company logo. Safe to re-run.
alter table public.bazaar_fleets add column if not exists logo_url text;
