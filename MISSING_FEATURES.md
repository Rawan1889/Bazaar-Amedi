# Bazaar Amedi — Missing Features

Last reviewed: 2026-06-28

---

## 🔴 CRITICAL

### 1. Payment Gateway
- No online payment (no Stripe, no FIB, no Zain Cash)
- Everything is cash-on-delivery only
- Blocks monetization and trust

### 2. SMS / Phone Auth
- `phone-auth-actions.ts` and Phase 13 setup doc exist but are NOT wired up
- Email auth will block most target users in Amedi
- Needs Twilio or similar SMS OTP provider

### 3. ~~Driver Assignment Logic~~ ✅ DONE (Phase 20)
- Added `is_online` toggle to driver profile
- Online/offline screen (Option B — orders hidden when offline)
- `setDriverOnline()` server action
- Race-condition-safe `acceptOrder()` with friendly error message
- Push notifications now target **online drivers only** (`sendPushToOnlineDrivers`)
- Realtime subscription auto-refreshes driver panel when orders change
- Admin sees green/grey dot next to each driver's name

### 4. Real Payment Tracking / Cash Confirmation
- No mechanism for driver to confirm cash collected
- No cash reconciliation
- No driver cash float management

---

## 🟠 IMPORTANT UX

### 5. Search
- `search-actions.ts` and `search-bar.tsx` exist but no search results page
- No full-text search index on Supabase
- No typeahead/autocomplete

### 6. Order Cancellation by Customer
- No "cancel my order" button for customers
- Should be allowed during `pending` window before driver is assigned

### 7. ~~Product Variants are Half-Built~~ ✅ DONE (Phase 21)
- Added interactive Client-side `ProductVariantsSelector` to handle variant options
- Integrated selection with `AddToCartButton` and `CartItem` composite matches (so different variants of the same product can exist side-by-side in the cart)
- Auto-decrements correct variant stock in database upon checkout

### 8. No Closed-Shop Guard
- Items from a closed shop (`is_open: false`) can still be added to cart
- No UI warning about shop hours
- No block at checkout time

### 9. Driver Location Tracking is One-Way
- `driver-location-broadcaster.tsx` sends GPS coordinates
- `order-tracking-map.tsx` does NOT re-fetch or subscribe in real time
- Customer sees a static map, not live position

---

## 🟡 BUSINESS FEATURES

### 10. No Driver Rating System
- `bazaar_reviews` exists for shops only
- Drivers have no rating — trust issue for a delivery platform

### 11. No Refund / Dispute Flow
- No dispute, partial refund, or compensation mechanism
- Only admin-level hard cancel exists

### 12. Flash Sale Notifications to Followers
- Follower system (`bazaar_followers`) exists
- No push notification sent to followers when a new flash sale goes live

### 13. Coupon Analytics / Usage Reporting
- Coupons track `uses_count` and `max_uses`
- No UI showing best-performing coupons, total discount given, redemption rate

### 14. No Minimum Order Warning at Cart Level
- Zone minimum orders checked server-side at `placeOrder()`
- No warning shown to customer in cart/checkout UI BEFORE submission

---

## 🟢 TECHNICAL / INFRASTRUCTURE

### 15. No Rate Limiting
- Server actions have no throttling
- `placeOrder()` and coupon validation can be spammed

### 16. No Transactional Emails
- No order confirmation email
- No "your shop was approved" email
- Only push notifications (requires device permission)

### 17. Arabic RTL Layout Broken
- i18n supports Arabic strings
- No `dir="rtl"` switching in CSS or layout
- Arabic users get LTR layout with Arabic text

### 18. No Onboarding Completion Guard
- `/shop/onboarding/` exists
- Nothing prevents market admin from skipping to `/shop/products/` directly

### 19. Image Optimization
- Products use raw Supabase Storage URLs
- No `next/image` for lazy-loading, responsive sizes, or WebP
- Will hurt performance on mobile in Amedi's network conditions

### 20. No Admin Revenue Dashboard
- Super admin shows only counts (shops, orders, users)
- No platform-wide revenue chart, commission earnings summary, or financial reporting
