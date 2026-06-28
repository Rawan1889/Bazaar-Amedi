-- Bazaar Phase 20 — Driver online/offline status
-- Run in Supabase Dashboard > SQL Editor

alter table public.bazaar_profiles
  add column if not exists is_online boolean not null default false;

-- Fast lookup: find all online drivers for push targeting
create index if not exists bazaar_profiles_online_drivers_idx
  on public.bazaar_profiles (is_online)
  where role = 'driver' and is_online = true;

-- Auto-reset online flag when driver logs out (safety net).
-- Drivers should go offline manually, but this ensures stale sessions don't
-- keep them "online" forever.  Done via a DB function + trigger.
create or replace function public.bazaar_reset_driver_online()
returns trigger language plpgsql security definer as $$
begin
  -- When a driver's session is deleted (sign out), mark them offline.
  update public.bazaar_profiles
  set is_online = false
  where id = old.user_id
    and role = 'driver';
  return old;
end;
$$;

-- Only create the trigger if it doesn't already exist.
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
