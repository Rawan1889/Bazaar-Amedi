-- =========================================================
-- Bazaar Phase 30 — Lock down profiles, shops, messages, reviews,
-- notifications, payouts and image uploads
-- =========================================================
-- The anon key is public, so every RLS rule is reachable straight through
-- Supabase's REST API. These rules allowed:
--   * any user to make themselves super_admin / approve / un-suspend themselves
--   * anyone (even signed-out) to insert profile rows with any role
--   * anyone to read every user's phone number
--   * shop owners to approve their own shop and set their commission to 0
--   * chat participants to rewrite other people's messages / fake their role
--   * anyone to insert notifications for any user (phishing links)
--   * shop owners to insert payouts with any amount/status
--   * reviews from people who never ordered from the shop
--   * uploads into other users' storage folders
--
-- Legitimate writes all go through server actions (service role) or keep
-- working under the rules below. Run AFTER phase 29. Safe to re-run.

-- ---------- helpers (security definer: no RLS recursion) ----------
create or replace function public.bazaar_is_super_admin(uid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.bazaar_profiles where id = uid and role = 'super_admin')
$$;

-- Server actions (service role), direct SQL (no JWT) and super admins.
create or replace function public.bazaar_is_trusted_actor()
returns boolean language sql security definer set search_path = public stable as $$
  select coalesce(auth.jwt() ->> 'role', 'service_role') = 'service_role'
      or public.bazaar_is_super_admin(auth.uid())
$$;

create or replace function public.bazaar_customer_received_from_shop(uid uuid, shop uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.bazaar_order_items oi
    join public.bazaar_orders o on o.id = oi.order_id
    where o.customer_id = uid and o.status = 'delivered' and oi.shop_id = shop
  )
$$;

-- ---------- profiles ----------
drop policy if exists "Service role can insert profiles" on public.bazaar_profiles;
drop policy if exists "Public profiles are viewable" on public.bazaar_profiles;

drop policy if exists "Users read own profile" on public.bazaar_profiles;
create policy "Users read own profile" on public.bazaar_profiles
  for select using (id = auth.uid());

drop policy if exists "Super admin reads all profiles" on public.bazaar_profiles;
create policy "Super admin reads all profiles" on public.bazaar_profiles
  for select using (public.bazaar_is_super_admin(auth.uid()));

create or replace function public.bazaar_guard_profile()
returns trigger language plpgsql as $$
begin
  if public.bazaar_is_trusted_actor() then return new; end if;
  if new.id is distinct from old.id
     or new.role is distinct from old.role
     or new.is_approved is distinct from old.is_approved
     or new.is_suspended is distinct from old.is_suspended then
    raise exception 'Role, approval and suspension can only be changed by an admin.' using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists bazaar_guard_profile on public.bazaar_profiles;
create trigger bazaar_guard_profile before update on public.bazaar_profiles
  for each row execute function public.bazaar_guard_profile();

-- ---------- shops ----------
create or replace function public.bazaar_guard_shop()
returns trigger language plpgsql as $$
begin
  if public.bazaar_is_trusted_actor() then return new; end if;
  if tg_op = 'INSERT' then
    new.is_approved := false;
    new.commission_rate := 10;  -- column default; only an admin may change it
    return new;
  end if;
  if new.owner_id is distinct from old.owner_id
     or new.is_approved is distinct from old.is_approved
     or new.commission_rate is distinct from old.commission_rate then
    raise exception 'Approval and commission can only be changed by an admin.' using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists bazaar_guard_shop on public.bazaar_shops;
create trigger bazaar_guard_shop before insert or update on public.bazaar_shops
  for each row execute function public.bazaar_guard_shop();

-- ---------- order chat + support messages ----------
-- Role shown next to a message comes from the sender's profile, not the client.
create or replace function public.bazaar_stamp_sender_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.jwt() ->> 'role', 'service_role') <> 'service_role' then
    new.sender_role := (select role from public.bazaar_profiles where id = auth.uid());
  end if;
  return new;
end $$;

drop trigger if exists bazaar_stamp_sender_role on public.bazaar_messages;
create trigger bazaar_stamp_sender_role before insert on public.bazaar_messages
  for each row execute function public.bazaar_stamp_sender_role();

drop trigger if exists bazaar_stamp_sender_role on public.bazaar_support_messages;
create trigger bazaar_stamp_sender_role before insert on public.bazaar_support_messages
  for each row execute function public.bazaar_stamp_sender_role();

-- Participants may mark messages read, but not rewrite them.
create or replace function public.bazaar_guard_message()
returns trigger language plpgsql as $$
begin
  if public.bazaar_is_trusted_actor() then return new; end if;
  if new.body is distinct from old.body
     or new.sender_id is distinct from old.sender_id
     or new.sender_role is distinct from old.sender_role
     or new.order_id is distinct from old.order_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Messages cannot be edited.' using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists bazaar_guard_message on public.bazaar_messages;
create trigger bazaar_guard_message before update on public.bazaar_messages
  for each row execute function public.bazaar_guard_message();

-- ---------- notifications ----------
-- Only the server creates notifications (service role bypasses RLS).
drop policy if exists "Service role inserts notifications" on public.bazaar_notifications;

-- ---------- payouts ----------
-- requestPayout() validates the amount and inserts with the service role.
drop policy if exists "Owners request payouts" on public.bazaar_payouts;

-- ---------- reviews ----------
drop policy if exists "Authenticated users can insert reviews" on public.bazaar_reviews;
drop policy if exists "Customers review shops they received orders from" on public.bazaar_reviews;
create policy "Customers review shops they received orders from" on public.bazaar_reviews
  for insert to authenticated
  with check (auth.uid() = customer_id and public.bazaar_customer_received_from_shop(auth.uid(), shop_id));

drop policy if exists "Users can update own reviews" on public.bazaar_reviews;
create policy "Users can update own reviews" on public.bazaar_reviews
  for update to authenticated
  using (auth.uid() = customer_id)
  with check (auth.uid() = customer_id and public.bazaar_customer_received_from_shop(auth.uid(), shop_id));

-- ---------- image uploads ----------
-- Paths are products/<uid>/… and shops/<uid>/…, so the 2nd folder is the owner.
drop policy if exists "Authenticated users upload bazaar images" on storage.objects;
drop policy if exists "Users upload into their own folder" on storage.objects;
create policy "Users upload into their own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'bazaar-images' and (storage.foldername(name))[2] = auth.uid()::text);

update storage.buckets
   set file_size_limit = 5242880,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
 where id = 'bazaar-images';
