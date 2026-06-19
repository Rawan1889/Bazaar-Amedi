-- Phase 7: Push Notifications & Admin Onboarding
-- Run this in your Supabase SQL editor

-- Push notification subscriptions
CREATE TABLE IF NOT EXISTS bazaar_push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES bazaar_profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Notifications log (for in-app + push history)
CREATE TABLE IF NOT EXISTS bazaar_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES bazaar_profiles(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'new_order', 'order_status', 'shop_approved', 'new_follower', 'welcome'
  title text NOT NULL,
  body text NOT NULL,
  data jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Shop onboarding progress tracking
ALTER TABLE bazaar_shops
  ADD COLUMN IF NOT EXISTS onboarding_step int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- RLS policies
ALTER TABLE bazaar_push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bazaar_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push subscriptions"
  ON bazaar_push_subscriptions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users read own notifications"
  ON bazaar_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON bazaar_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can insert notifications for any user
CREATE POLICY "Service role inserts notifications"
  ON bazaar_notifications FOR INSERT
  WITH CHECK (true);

-- Index for fast notification queries
CREATE INDEX IF NOT EXISTS idx_bazaar_notifications_user_unread
  ON bazaar_notifications(user_id, is_read) WHERE NOT is_read;

CREATE INDEX IF NOT EXISTS idx_bazaar_push_subs_user
  ON bazaar_push_subscriptions(user_id);
