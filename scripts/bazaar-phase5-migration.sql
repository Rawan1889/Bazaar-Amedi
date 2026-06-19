-- Bazaar Phase 5 Migration
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Coupons table
CREATE TABLE IF NOT EXISTS bazaar_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES bazaar_shops(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value INTEGER NOT NULL CHECK (discount_value > 0),
  min_order INTEGER DEFAULT 0,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(code, shop_id)
);

-- 2. RLS policies for coupons
ALTER TABLE bazaar_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active coupons"
ON bazaar_coupons FOR SELECT TO public
USING (true);

CREATE POLICY "Shop owners can manage their coupons"
ON bazaar_coupons FOR INSERT TO authenticated
WITH CHECK (
  shop_id IN (SELECT id FROM bazaar_shops WHERE owner_id = auth.uid())
);

CREATE POLICY "Shop owners can update their coupons"
ON bazaar_coupons FOR UPDATE TO authenticated
USING (
  shop_id IN (SELECT id FROM bazaar_shops WHERE owner_id = auth.uid())
);

CREATE POLICY "Shop owners can delete their coupons"
ON bazaar_coupons FOR DELETE TO authenticated
USING (
  shop_id IN (SELECT id FROM bazaar_shops WHERE owner_id = auth.uid())
);

-- 3. Add coupon_id to orders for tracking
ALTER TABLE bazaar_orders ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES bazaar_coupons(id);
ALTER TABLE bazaar_orders ADD COLUMN IF NOT EXISTS discount INTEGER DEFAULT 0;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_bazaar_coupons_shop_id ON bazaar_coupons(shop_id);
CREATE INDEX IF NOT EXISTS idx_bazaar_coupons_code ON bazaar_coupons(code);
