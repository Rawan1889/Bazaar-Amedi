-- =========================================================
-- Bazaar Phase 34 — Shop subscriptions and pausing
-- =========================================================
--   1. Every shop gets one free month from the day it signs up
--      (trial_ends_at). Shops that already exist get their free month
--      starting today, since they joined before subscriptions existed.
--   2. After the free month the shop pays monthly, in cash, priced by how
--      many products it lists (prices live in lib/bazaar/subscription.ts).
--      The admin records each payment, which moves paid_until forward.
--   3. The admin can pause a shop (is_paused). A paused shop is hidden from
--      customers and can't receive new orders. The owner can still sign in.
--   4. Only an admin can change any of these fields — a shop owner can't
--      extend their own trial or unpause themselves.
--
-- Run AFTER phase 33. Safe to re-run. The live site keeps working before
-- the new code is deployed (it ignores the new columns).

-- ---------- 1. shop subscription fields ----------
alter table public.bazaar_shops
  add column if not exists trial_ends_at timestamptz,
  add column if not exists paid_until timestamptz,
  add column if not exists is_paused boolean not null default false,
  add column if not exists paused_at timestamptz;

update public.bazaar_shops
  set trial_ends_at = now() + interval '1 month'
  where trial_ends_at is null;

alter table public.bazaar_shops alter column trial_ends_at set default (now() + interval '1 month');
alter table public.bazaar_shops alter column trial_ends_at set not null;

-- ---------- 2. payment history ----------
create table if not exists public.bazaar_subscription_payments (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.bazaar_shops(id) on delete cascade,
  amount integer not null check (amount >= 0),
  months integer not null default 1 check (months between 1 and 12),
  period_start timestamptz not null,
  period_end timestamptz not null,
  product_count integer,
  note text,
  recorded_by uuid references public.bazaar_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists bazaar_subscription_payments_shop_idx
  on public.bazaar_subscription_payments(shop_id, created_at desc);

-- Writes go through server actions (service role). Reads: the shop's owner
-- and super admins.
alter table public.bazaar_subscription_payments enable row level security;

drop policy if exists "Shop owners read their subscription payments" on public.bazaar_subscription_payments;
create policy "Shop owners read their subscription payments" on public.bazaar_subscription_payments
  for select to authenticated
  using (shop_id in (select id from public.bazaar_shops where owner_id = auth.uid()));

drop policy if exists "Super admins read subscription payments" on public.bazaar_subscription_payments;
create policy "Super admins read subscription payments" on public.bazaar_subscription_payments
  for select to authenticated
  using (public.bazaar_is_super_admin(auth.uid()));

-- ---------- 3. only an admin changes approval, commission or billing ----------
create or replace function public.bazaar_guard_shop()
returns trigger language plpgsql as $$
begin
  if public.bazaar_is_trusted_actor() then return new; end if;
  if tg_op = 'INSERT' then
    new.is_approved := false;
    new.commission_rate := 10;  -- column default; only an admin may change it
    new.trial_ends_at := now() + interval '1 month';
    new.paid_until := null;
    new.is_paused := false;
    new.paused_at := null;
    return new;
  end if;
  if new.owner_id is distinct from old.owner_id
     or new.is_approved is distinct from old.is_approved
     or new.commission_rate is distinct from old.commission_rate
     or new.trial_ends_at is distinct from old.trial_ends_at
     or new.paid_until is distinct from old.paid_until
     or new.is_paused is distinct from old.is_paused
     or new.paused_at is distinct from old.paused_at then
    raise exception 'Approval, commission and subscription can only be changed by an admin.' using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists bazaar_guard_shop on public.bazaar_shops;
create trigger bazaar_guard_shop before insert or update on public.bazaar_shops
  for each row execute function public.bazaar_guard_shop();
