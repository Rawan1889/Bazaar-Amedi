-- =========================================================
-- Bazaar Phases 18–23 Combined Migration
-- Paste this ONCE into Supabase Dashboard > SQL Editor
-- All statements are idempotent (safe to re-run)
-- =========================================================


-- ─── PHASE 18: Seller commission + payouts ──────────────

alter table public.bazaar_shops
  add column if not exists commission_rate numeric not null default 10;

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

drop policy if exists "Super admin manages payouts" on public.bazaar_payouts;
create policy "Super admin manages payouts" on public.bazaar_payouts
  for all using (
    exists (select 1 from public.bazaar_profiles where id = auth.uid() and role = 'super_admin')
  );


-- ─── PHASE 19: In-app chat ──────────────────────────────

create table if not exists public.bazaar_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.bazaar_orders(id) on delete cascade,
  sender_id uuid not null references public.bazaar_profiles(id),
  sender_role text not null,
  body text not null,
  created_at timestamptz default now(),
  read_at timestamptz
);

create index if not exists bazaar_messages_order_id_idx on public.bazaar_messages (order_id, created_at);

alter table public.bazaar_messages enable row level security;

drop policy if exists "Participants read order messages" on public.bazaar_messages;
create policy "Participants read order messages" on public.bazaar_messages
  for select using (
    exists (
      select 1 from public.bazaar_orders o
      where o.id = order_id and (
        o.customer_id = auth.uid()
        or o.driver_id = auth.uid()
        or exists (
          select 1 from public.bazaar_order_items oi
          join public.bazaar_shops s on s.id = oi.shop_id
          where oi.order_id = o.id and s.owner_id = auth.uid()
        )
      )
    )
  );

drop policy if exists "Participants send order messages" on public.bazaar_messages;
create policy "Participants send order messages" on public.bazaar_messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.bazaar_orders o
      where o.id = order_id and (
        o.customer_id = auth.uid()
        or o.driver_id = auth.uid()
        or exists (
          select 1 from public.bazaar_order_items oi
          join public.bazaar_shops s on s.id = oi.shop_id
          where oi.order_id = o.id and s.owner_id = auth.uid()
        )
      )
    )
  );

drop policy if exists "Participants update order messages" on public.bazaar_messages;
create policy "Participants update order messages" on public.bazaar_messages
  for update using (
    exists (
      select 1 from public.bazaar_orders o
      where o.id = order_id and (
        o.customer_id = auth.uid()
        or o.driver_id = auth.uid()
        or exists (
          select 1 from public.bazaar_order_items oi
          join public.bazaar_shops s on s.id = oi.shop_id
          where oi.order_id = o.id and s.owner_id = auth.uid()
        )
      )
    )
  );

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'bazaar_messages'
  ) then
    alter publication supabase_realtime add table public.bazaar_messages;
  end if;
end $$;


-- ─── PHASE 20: Driver online/offline status ─────────────

alter table public.bazaar_profiles
  add column if not exists is_online boolean not null default false;

create index if not exists bazaar_profiles_online_drivers_idx
  on public.bazaar_profiles (is_online)
  where role = 'driver' and is_online = true;

create or replace function public.bazaar_reset_driver_online()
returns trigger language plpgsql security definer as $$
begin
  update public.bazaar_profiles
  set is_online = false
  where id = old.user_id
    and role = 'driver';
  return old;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'on_driver_session_end'
  ) then
    create trigger on_driver_session_end
      after delete on auth.sessions
      for each row execute function public.bazaar_reset_driver_online();
  end if;
end $$;


-- ─── PHASE 21: Order items created_at + shop RLS ────────

alter table public.bazaar_order_items
  add column if not exists created_at timestamptz not null default now();

drop policy if exists "Shop owners see relevant orders" on public.bazaar_orders;
create policy "Shop owners see relevant orders" on public.bazaar_orders
  for select using (
    exists (
      select 1
      from   public.bazaar_order_items oi
      join   public.bazaar_shops       s  on s.id = oi.shop_id
      where  oi.order_id = bazaar_orders.id
        and  s.owner_id  = auth.uid()
    )
  );

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname    = 'supabase_realtime'
      and schemaname = 'public'
      and tablename  = 'bazaar_order_items'
  ) then
    alter publication supabase_realtime add table public.bazaar_order_items;
  end if;
end $$;


-- ─── PHASE 22: Add 'ready' to order status constraint ───

alter table public.bazaar_orders
  drop constraint if exists bazaar_orders_status_check;

alter table public.bazaar_orders
  add constraint bazaar_orders_status_check
  check (status in (
    'pending',
    'confirmed',
    'ready',
    'picking_up',
    'delivering',
    'delivered',
    'cancelled'
  ));


-- ─── PHASE 23: Neighborhood + zone on profiles/shops ────

alter table public.bazaar_profiles
  add column if not exists zone_id uuid references public.bazaar_delivery_zones(id) on delete set null;

alter table public.bazaar_shops
  add column if not exists neighborhood text,
  add column if not exists zone_id uuid references public.bazaar_delivery_zones(id) on delete set null;
