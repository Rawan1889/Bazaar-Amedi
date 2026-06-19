-- Bazaar Phase 4 Migration
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Reviews table
CREATE TABLE IF NOT EXISTS bazaar_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES bazaar_profiles(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES bazaar_shops(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, shop_id)
);

-- 2. RLS policies for reviews
ALTER TABLE bazaar_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
ON bazaar_reviews FOR SELECT TO public
USING (true);

CREATE POLICY "Authenticated users can insert reviews"
ON bazaar_reviews FOR INSERT TO authenticated
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can update own reviews"
ON bazaar_reviews FOR UPDATE TO authenticated
USING (auth.uid() = customer_id)
WITH CHECK (auth.uid() = customer_id);

-- 3. Index for faster shop review lookups
CREATE INDEX IF NOT EXISTS idx_bazaar_reviews_shop_id ON bazaar_reviews(shop_id);
CREATE INDEX IF NOT EXISTS idx_bazaar_reviews_customer_id ON bazaar_reviews(customer_id);
