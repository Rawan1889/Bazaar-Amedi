-- Bazaar Phase 17 Migration — Scheduled popup offer banner (Gap 10)
-- Run this in Supabase Dashboard > SQL Editor

create table if not exists public.bazaar_promo_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text,
  link_url text,
  link_label text,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

alter table public.bazaar_promo_banners enable row level security;

drop policy if exists "Banners are publicly viewable" on public.bazaar_promo_banners;
create policy "Banners are publicly viewable" on public.bazaar_promo_banners
  for select using (true);

drop policy if exists "Super admin manages banners" on public.bazaar_promo_banners;
create policy "Super admin manages banners" on public.bazaar_promo_banners
  for all using (
    exists (select 1 from public.bazaar_profiles where id = auth.uid() and role = 'super_admin')
  );
