-- ============================================
-- BAZAAR AMEDI — Full Database Schema
-- ============================================

-- 1. Profiles
create table if not exists public.bazaar_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('customer', 'market_admin', 'driver', 'super_admin')),
  full_name text not null,
  phone text not null,
  avatar_url text,
  neighborhood text,
  created_at timestamptz default now()
);

alter table public.bazaar_profiles enable row level security;

create policy "Public profiles are viewable" on public.bazaar_profiles
  for select using (true);
create policy "Users can update own profile" on public.bazaar_profiles
  for update using (auth.uid() = id);
create policy "Service role can insert profiles" on public.bazaar_profiles
  for insert with check (true);

-- 2. Categories
create table if not exists public.bazaar_categories (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_ku text,
  name_ar text,
  slug text unique not null,
  icon text,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.bazaar_categories enable row level security;
create policy "Categories are public" on public.bazaar_categories for select using (true);
create policy "Super admin manages categories" on public.bazaar_categories
  for all using (
    exists (select 1 from public.bazaar_profiles where id = auth.uid() and role = 'super_admin')
  );

insert into public.bazaar_categories (name_en, name_ku, name_ar, slug, icon, sort_order) values
  ('Grocery & Essentials', 'خواردنەوە و پێداویستییەکان', 'بقالة ومستلزمات', 'grocery', 'shopping-bag', 1),
  ('Butcher & Meat', 'قەسابخانە و گۆشت', 'لحوم وقصابة', 'butcher', 'beef', 2),
  ('Fresh Produce', 'سەوزە و مێوە', 'خضار وفواكه', 'produce', 'carrot', 3),
  ('Bakery & Bread', 'نانەوا و نان', 'مخبز وخبز', 'bakery', 'bread', 4),
  ('Dairy & Cheese', 'شیر و پەنیر', 'ألبان وأجبان', 'dairy', 'milk', 5),
  ('Spices & Dry Goods', 'بهارات و وشکاوەکان', 'بهارات وحبوب', 'spices', 'pepper', 6),
  ('Household & Cleaning', 'کەرەستەی ماڵ', 'منزلية وتنظيف', 'household', 'spray', 7),
  ('Other', 'هیتر', 'أخرى', 'other', 'package', 8);

-- 3. Shops
create table if not exists public.bazaar_shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.bazaar_profiles(id) on delete cascade,
  name text not null,
  slug text unique not null,
  description text,
  category_id uuid references public.bazaar_categories(id),
  phone text,
  address text,
  logo_url text,
  cover_url text,
  is_open boolean default true,
  opens_at time,
  closes_at time,
  is_approved boolean default false,
  created_at timestamptz default now()
);

alter table public.bazaar_shops enable row level security;
create policy "Shops are publicly viewable" on public.bazaar_shops
  for select using (true);
create policy "Owners manage their shop" on public.bazaar_shops
  for all using (owner_id = auth.uid());
create policy "Super admin manages all shops" on public.bazaar_shops
  for all using (
    exists (select 1 from public.bazaar_profiles where id = auth.uid() and role = 'super_admin')
  );

-- 4. Products
create table if not exists public.bazaar_products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.bazaar_shops(id) on delete cascade,
  category_id uuid references public.bazaar_categories(id),
  name_en text not null,
  name_ku text,
  name_ar text,
  description text,
  price integer not null,
  image_url text,
  unit text default 'piece',
  in_stock boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.bazaar_products enable row level security;
create policy "Products are publicly viewable" on public.bazaar_products
  for select using (true);
create policy "Shop owners manage their products" on public.bazaar_products
  for all using (
    exists (select 1 from public.bazaar_shops where id = shop_id and owner_id = auth.uid())
  );
create policy "Super admin manages all products" on public.bazaar_products
  for all using (
    exists (select 1 from public.bazaar_profiles where id = auth.uid() and role = 'super_admin')
  );

-- 5. Flash Sales
create table if not exists public.bazaar_flash_sales (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.bazaar_products(id) on delete cascade,
  sale_price integer not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.bazaar_flash_sales enable row level security;
create policy "Flash sales are public" on public.bazaar_flash_sales
  for select using (true);
create policy "Shop owners manage their flash sales" on public.bazaar_flash_sales
  for all using (
    exists (
      select 1 from public.bazaar_products p
      join public.bazaar_shops s on s.id = p.shop_id
      where p.id = product_id and s.owner_id = auth.uid()
    )
  );

-- 6. Orders (multi-shop support)
create table if not exists public.bazaar_orders (
  id uuid primary key default gen_random_uuid(),
  order_number serial,
  customer_id uuid not null references public.bazaar_profiles(id),
  driver_id uuid references public.bazaar_profiles(id),
  status text not null default 'pending' check (
    status in ('pending', 'confirmed', 'picking_up', 'delivering', 'delivered', 'cancelled')
  ),
  delivery_address text not null,
  delivery_fee integer not null default 2500,
  total integer not null default 0,
  note text,
  created_at timestamptz default now(),
  delivered_at timestamptz
);

alter table public.bazaar_orders enable row level security;
create policy "Customers see their orders" on public.bazaar_orders
  for select using (customer_id = auth.uid());
create policy "Drivers see assigned orders" on public.bazaar_orders
  for select using (driver_id = auth.uid());
create policy "Drivers update assigned orders" on public.bazaar_orders
  for update using (driver_id = auth.uid());
create policy "Customers create orders" on public.bazaar_orders
  for insert with check (customer_id = auth.uid());
create policy "Super admin sees all orders" on public.bazaar_orders
  for all using (
    exists (select 1 from public.bazaar_profiles where id = auth.uid() and role = 'super_admin')
  );

-- 7. Order Items (each references source shop)
create table if not exists public.bazaar_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.bazaar_orders(id) on delete cascade,
  product_id uuid not null references public.bazaar_products(id),
  shop_id uuid not null references public.bazaar_shops(id),
  product_name text not null,
  quantity integer not null default 1,
  unit_price integer not null,
  pickup_status text not null default 'pending' check (
    pickup_status in ('pending', 'ready', 'picked_up')
  )
);

alter table public.bazaar_order_items enable row level security;
create policy "Order items follow order access" on public.bazaar_order_items
  for select using (
    exists (
      select 1 from public.bazaar_orders o
      where o.id = order_id and (o.customer_id = auth.uid() or o.driver_id = auth.uid())
    )
  );
create policy "Shop owners see their items" on public.bazaar_order_items
  for select using (
    exists (select 1 from public.bazaar_shops where id = shop_id and owner_id = auth.uid())
  );
create policy "Customers insert order items" on public.bazaar_order_items
  for insert with check (
    exists (select 1 from public.bazaar_orders where id = order_id and customer_id = auth.uid())
  );
create policy "Super admin sees all items" on public.bazaar_order_items
  for all using (
    exists (select 1 from public.bazaar_profiles where id = auth.uid() and role = 'super_admin')
  );

-- 8. Storage bucket for images
insert into storage.buckets (id, name, public) values ('bazaar-images', 'bazaar-images', true)
on conflict (id) do nothing;

create policy "Anyone can view bazaar images" on storage.objects
  for select using (bucket_id = 'bazaar-images');
create policy "Authenticated users upload bazaar images" on storage.objects
  for insert with check (bucket_id = 'bazaar-images' and auth.role() = 'authenticated');
create policy "Users can update own bazaar images" on storage.objects
  for update using (bucket_id = 'bazaar-images' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can delete own bazaar images" on storage.objects
  for delete using (bucket_id = 'bazaar-images' and auth.uid()::text = (storage.foldername(name))[1]);
