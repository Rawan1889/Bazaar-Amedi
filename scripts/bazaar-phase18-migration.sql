-- Bazaar Phase 18 Migration — Seller commission + payouts (Backlog B)
-- Run this in Supabase Dashboard > SQL Editor

-- Per-shop commission rate (percent the platform keeps per order).
alter table public.bazaar_shops
  add column if not exists commission_rate numeric not null default 10;

-- Payout (withdrawal) requests from shops to the platform.
create table if not exists public.bazaar_payouts (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.bazaar_shops(id) on delete cascade,
  amount integer not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'rejected')),
  note text,
  requested_at timestamptz default now(),
  paid_at timestamptz
);

create index if not exists bazaar_payouts_shop_id_idx on public.bazaar_payouts (shop_id);

alter table public.bazaar_payouts enable row level security;

-- Shop owners see + request their own payouts.
drop policy if exists "Owners read their payouts" on public.bazaar_payouts;
create policy "Owners read their payouts" on public.bazaar_payouts
  for select using (
    exists (select 1 from public.bazaar_shops s where s.id = shop_id and s.owner_id = auth.uid())
  );

drop policy if exists "Owners request payouts" on public.bazaar_payouts;
create policy "Owners request payouts" on public.bazaar_payouts
  for insert with check (
    exists (select 1 from public.bazaar_shops s where s.id = shop_id and s.owner_id = auth.uid())
  );

-- Super admin manages all payouts.
drop policy if exists "Super admin manages payouts" on public.bazaar_payouts;
create policy "Super admin manages payouts" on public.bazaar_payouts
  for all using (
    exists (select 1 from public.bazaar_profiles where id = auth.uid() and role = 'super_admin')
  );
