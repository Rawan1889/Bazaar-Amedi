-- Bazaar Phase 3 Migration
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Enable realtime for order notifications
ALTER PUBLICATION supabase_realtime ADD TABLE bazaar_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE bazaar_order_items;

-- 2. Make bazaar-images bucket public (for product/shop images)
UPDATE storage.buckets
SET public = true
WHERE name = 'bazaar-images';

-- 3. Storage policies for bazaar-images bucket
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload bazaar images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'bazaar-images');

-- Allow public read access
CREATE POLICY "Public can view bazaar images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'bazaar-images');

-- Delete policy already exists from initial schema — skipped
