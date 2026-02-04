-- Add customer_phone column to service_orders table
ALTER TABLE service_orders
ADD COLUMN IF NOT EXISTS customer_phone text;

-- Ensure RLS policies allow access (usually existing policies cover all columns, but good to verify)
-- If you have specific column-level security, you might need to update it.
-- Assuming standard policies:
-- CREATE POLICY "Enable access to all users" ON service_orders FOR ALL USING (true);
