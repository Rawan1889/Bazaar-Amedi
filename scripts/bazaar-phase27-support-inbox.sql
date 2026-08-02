-- =========================================================
-- Bazaar Phase 27 — Support Inbox
-- =========================================================
-- Any signed-in user (customer / driver / market_admin) can open a support
-- thread with the platform. super_admin sees and replies to every thread.
--
-- Model: one row in bazaar_support_threads per conversation, many
-- bazaar_support_messages per thread. Realtime is enabled on messages so
-- both sides see replies live.
--
-- Safe to re-run.

create table if not exists public.bazaar_support_threads (
  id uuid primary key default gen_random_uuid(),
  opener_id uuid not null references public.bazaar_profiles(id) on delete cascade,
  opener_role text not null,
  subject text not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  last_message_at timestamptz default now(),
  unread_for_admin boolean default true,
  unread_for_opener boolean default false,
  created_at timestamptz default now()
);

create index if not exists bazaar_support_threads_opener_idx
  on public.bazaar_support_threads (opener_id, last_message_at desc);
create index if not exists bazaar_support_threads_status_idx
  on public.bazaar_support_threads (status, last_message_at desc);

create table if not exists public.bazaar_support_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.bazaar_support_threads(id) on delete cascade,
  sender_id uuid not null references public.bazaar_profiles(id),
  sender_role text not null,
  body text not null,
  created_at timestamptz default now()
);

create index if not exists bazaar_support_messages_thread_idx
  on public.bazaar_support_messages (thread_id, created_at);

alter table public.bazaar_support_threads enable row level security;
alter table public.bazaar_support_messages enable row level security;

-- Threads: opener sees their own; super_admin sees all.
drop policy if exists "Support threads read" on public.bazaar_support_threads;
create policy "Support threads read" on public.bazaar_support_threads
  for select using (
    opener_id = auth.uid()
    or exists (
      select 1 from public.bazaar_profiles p
      where p.id = auth.uid() and p.role = 'super_admin'
    )
  );

drop policy if exists "Support threads insert" on public.bazaar_support_threads;
create policy "Support threads insert" on public.bazaar_support_threads
  for insert with check (opener_id = auth.uid());

drop policy if exists "Support threads update" on public.bazaar_support_threads;
create policy "Support threads update" on public.bazaar_support_threads
  for update using (
    opener_id = auth.uid()
    or exists (
      select 1 from public.bazaar_profiles p
      where p.id = auth.uid() and p.role = 'super_admin'
    )
  );

-- Messages: participants read, participants insert.
drop policy if exists "Support messages read" on public.bazaar_support_messages;
create policy "Support messages read" on public.bazaar_support_messages
  for select using (
    exists (
      select 1 from public.bazaar_support_threads t
      where t.id = thread_id and (
        t.opener_id = auth.uid()
        or exists (
          select 1 from public.bazaar_profiles p
          where p.id = auth.uid() and p.role = 'super_admin'
        )
      )
    )
  );

drop policy if exists "Support messages insert" on public.bazaar_support_messages;
create policy "Support messages insert" on public.bazaar_support_messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.bazaar_support_threads t
      where t.id = thread_id and (
        t.opener_id = auth.uid()
        or exists (
          select 1 from public.bazaar_profiles p
          where p.id = auth.uid() and p.role = 'super_admin'
        )
      )
    )
  );

-- Realtime.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'bazaar_support_messages'
  ) then
    alter publication supabase_realtime add table public.bazaar_support_messages;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'bazaar_support_threads'
  ) then
    alter publication supabase_realtime add table public.bazaar_support_threads;
  end if;
end $$;
