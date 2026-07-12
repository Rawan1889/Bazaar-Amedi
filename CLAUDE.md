# Bazaar-Amedi — Project Context

Hyperlocal multi-vendor marketplace for Amedi, Kurdistan. Customers browse products across many local shops, drivers deliver, shop owners fulfill.

Deployed at https://bazaar-amedi.vercel.app.

## Stack

- **Framework:** Next.js 15 (App Router), React 19, Tailwind 4
- **Backend:** Supabase (project ref `fgmobiwwosbneigzshxu`) — auth, Postgres, RLS, Realtime, Storage
- **Deploy:** Vercel — project id `prj_1Uu0fQewV1enDMiToO7Nna2zu6Fn`, team `team_w78NMPh36z49Ml42JrAP2uV4`. Every commit to `main` deploys.
- **Maps:** Leaflet + OpenStreetMap
- **Payments:** Cash on delivery only (payment gateway deliberately deferred until real restaurant testing)

## Roles

Every user has one of four roles on `bazaar_profiles.role`:
- `customer` — browses, orders
- `market_admin` — shop owner (one shop per owner)
- `driver` — delivers orders
- `super_admin` — platform ops

`is_approved` gates shop visibility and driver availability. `is_suspended` disables any user.

## Data Model (key tables)

- `bazaar_profiles` — auth users mirror + role/approval/online status + address/zone
- `bazaar_shops` — one per market_admin; has `commission_rate`, `neighborhood`, `zone_id`
- `bazaar_products` + `bazaar_product_variants`
- `bazaar_categories` — site-wide; products can belong to one
- `bazaar_orders` + `bazaar_order_items` — one order can span multiple shops, bundled to one driver
- `bazaar_delivery_zones` — admin-defined zones with per-zone fee, min order, free threshold
- `bazaar_messages` — order-scoped chat (customer ↔ shop ↔ driver)
- `bazaar_payouts` — shop payout requests, super_admin approves
- Flash sales, coupons, banners, reviews, favorites, followers, saved addresses — all exist

Order status flow: `pending → confirmed → ready → picking_up → delivering → delivered` (or `cancelled`).

## Security Model

100% Supabase RLS. Never do LIMIT 1 tenant checks in JS. Use `is_tenant_member()` helper where available.

- `createBazaarServer()` = anon key + cookies (respects RLS as the logged-in user)
- `createBazaarAdmin()` = service role, bypasses RLS — only in server actions after explicit auth check

## Server-Action Patterns

- One file per domain in `lib/bazaar/*-actions.ts` — all with `'use server'`
- Always `revalidatePath()` **every** affected route when order status changes: `/orders`, `/orders/[id]`, `/shop/orders`, `/driver`
- Do NOT use PostgREST FK hints like `bazaar_profiles!bazaar_orders_customer_id_fkey` — they silently return empty when the FK name drifts. Use simple joins: `bazaar_profiles(full_name, phone)` and let PostgREST auto-detect.
- Realtime is enabled on `bazaar_orders`, `bazaar_order_items`, `bazaar_messages`

## Layout Conventions

- Each role has its own nav — `customer-nav.tsx` + `mobile-nav.tsx`, `shop/sidebar.tsx`, `driver-nav.tsx`
- Mobile bottom-nav pages need `pb-20 md:pb-0` on the outer container
- Warm bazaar palette — green `#2D8A5E`, terra `#C4654A`, saffron `#E8A838`, charcoal `#1E1C19`, cream backgrounds
- Fonts: DM Sans (body/headline), DM Mono (labels/mono data)

## Standing Rules (user preferences)

- **Push after every task** — commit + push to `main`; Vercel deploys automatically
- **End each session with a bullet-point summary** of what was completed
- **Never move or replace one project with another** without explicit confirmation
- **Only edit inside `Bazaar-Amedi/`** for Bazaar work — ask first if unsure which folder
- **Payment integration deferred** until after real restaurant testing
- **Kurdish + Arabic i18n needed** — extend the existing `lib/i18n.ts` system, don't build a new one

## Migrations

All schema is under `scripts/`. Migrations run manually in Supabase SQL Editor (no automated pipeline). Combined phase-18–23 migration is at `scripts/bazaar-phase18-23-combined.sql`.

## Known Gotchas

- Supabase free tier auto-pauses projects after ~1 week of inactivity → causes `ENOTFOUND` on Vercel. Restore via dashboard.
- Phone OTP (`app/components/phone-login.tsx`) is coded but needs Twilio configured in Supabase Auth to actually send SMS.
- Driver online status resets automatically when the auth session is deleted (trigger `on_driver_session_end`).
