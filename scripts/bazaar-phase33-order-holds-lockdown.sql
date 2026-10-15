-- =========================================================
-- Bazaar Phase 33 — Give back stock/coupons on cancel, and close
-- four holes found in the pre-launch audit
-- =========================================================
--   1. Order items remember the option and flash sale they used, so a
--      cancelled order hands its stock and sale units back.
--   2. Coupon codes could be listed by anyone through the public API.
--      Now only the shop that owns a coupon (and super admins) can read it;
--      checkout checks codes on the server.
--   3. Storage: an old upload rule let any signed-in user write anywhere in
--      the image bucket, and the update/delete rules checked the wrong
--      folder level. Uploads are now limited to <type>/<your id>/...
--   4. Any signed-in user could create a shop row. Now only shop owners.
--   5. A support ticket's opener could rewrite its role, flags or owner.
--
-- Run AFTER phase 32. Safe to re-run.

-- ---------- 1. order items: option + flash sale used ----------
alter table public.bazaar_order_items
  add column if not exists variant_id uuid references public.bazaar_product_variants(id) on delete set null,
  add column if not exists flash_sale_id uuid references public.bazaar_flash_sales(id) on delete set null;

-- ---------- 2. coupons: no public listing ----------
drop policy if exists "Anyone can view active coupons" on public.bazaar_coupons;

drop policy if exists "Shop owners read their coupons" on public.bazaar_coupons;
create policy "Shop owners read their coupons" on public.bazaar_coupons
  for select to authenticated
  using (shop_id in (select id from public.bazaar_shops where owner_id = auth.uid()));

drop policy if exists "Super admin reads coupons" on public.bazaar_coupons;
create policy "Super admin reads coupons" on public.bazaar_coupons
  for select to authenticated
  using (public.bazaar_is_super_admin(auth.uid()));

-- ---------- 3. storage: own folder only ----------
-- Paths are products/<uid>/..., shops/<uid>/..., fleets/<uid>/...
drop policy if exists "Authenticated users can upload bazaar images" on storage.objects;

drop policy if exists "Users can update own bazaar images" on storage.objects;
create policy "Users can update own bazaar images" on storage.objects
  for update to authenticated
  using (bucket_id = 'bazaar-images' and (storage.foldername(name))[2] = auth.uid()::text)
  with check (bucket_id = 'bazaar-images' and (storage.foldername(name))[2] = auth.uid()::text);

drop policy if exists "Users can delete own bazaar images" on storage.objects;
create policy "Users can delete own bazaar images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'bazaar-images' and (storage.foldername(name))[2] = auth.uid()::text);

-- ---------- 4. shops: only shop owners create one ----------
-- Replaces the old ALL rule, which also allowed any user to INSERT.
drop policy if exists "Owners manage their shop" on public.bazaar_shops;

drop policy if exists "Owners read their shop" on public.bazaar_shops;
create policy "Owners read their shop" on public.bazaar_shops
  for select using (owner_id = auth.uid());

drop policy if exists "Owners update their shop" on public.bazaar_shops;
create policy "Owners update their shop" on public.bazaar_shops
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "Owners delete their shop" on public.bazaar_shops;
create policy "Owners delete their shop" on public.bazaar_shops
  for delete using (owner_id = auth.uid());

drop policy if exists "Shop owners create their shop" on public.bazaar_shops;
create policy "Shop owners create their shop" on public.bazaar_shops
  for insert with check (
    owner_id = auth.uid()
    and exists (select 1 from public.bazaar_profiles where id = auth.uid() and role = 'market_admin')
  );

-- ---------- 5. support threads: opener may only close / mark read ----------
create or replace function public.bazaar_guard_support_thread()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.bazaar_is_trusted_actor() then return new; end if;
  if tg_op = 'INSERT' then
    -- Role comes from the opener's profile, not the request.
    new.opener_role := (select role from public.bazaar_profiles where id = auth.uid());
    new.status := 'open';
    new.unread_for_admin := true;
    new.unread_for_opener := false;
    return new;
  end if;
  if new.opener_id is distinct from old.opener_id
     or new.opener_role is distinct from old.opener_role
     or new.subject is distinct from old.subject
     or new.unread_for_admin is distinct from old.unread_for_admin
     or new.created_at is distinct from old.created_at
     or (new.status is distinct from old.status and new.status <> 'closed') then
    raise exception 'You can only close your own ticket.' using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists bazaar_guard_support_thread on public.bazaar_support_threads;
create trigger bazaar_guard_support_thread before insert or update on public.bazaar_support_threads
  for each row execute function public.bazaar_guard_support_thread();
