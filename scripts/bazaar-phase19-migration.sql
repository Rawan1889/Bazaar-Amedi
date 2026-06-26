-- Bazaar Phase 19 Migration — In-app chat per order (Backlog C)
-- Run this in Supabase Dashboard > SQL Editor

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

-- A user is a participant of an order if they're the customer, the assigned
-- driver, or own a shop with items in that order.
-- (Defined as a helper expression inline in each policy.)

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

-- Participants may mark messages read.
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

-- Enable realtime for live chat (idempotent — skip if already added).
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
