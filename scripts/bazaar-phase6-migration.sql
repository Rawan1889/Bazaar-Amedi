-- Bazaar Phase 6 Migration
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Followers table
CREATE TABLE IF NOT EXISTS bazaar_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES bazaar_profiles(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES bazaar_shops(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_id, shop_id)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_followers_customer ON bazaar_followers(customer_id);
CREATE INDEX IF NOT EXISTS idx_followers_shop ON bazaar_followers(shop_id);

-- 3. RLS
ALTER TABLE bazaar_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view follower counts"
  ON bazaar_followers FOR SELECT
  USING (true);

CREATE POLICY "Customers can follow/unfollow"
  ON bazaar_followers FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can unfollow"
  ON bazaar_followers FOR DELETE
  USING (auth.uid() = customer_id);

-- 4. Add delivered_at to orders if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bazaar_orders' AND column_name = 'delivered_at'
  ) THEN
    ALTER TABLE bazaar_orders ADD COLUMN delivered_at TIMESTAMPTZ;
  END IF;
END $$;
