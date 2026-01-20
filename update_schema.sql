-- Run this command in your Supabase Dashboard > SQL Editor
-- Add the 'subcategory' column if it doesn't exist
ALTER TABLE receipts
ADD COLUMN IF NOT EXISTS subcategory text;
-- Optional: You might want to backfill existing records or set default
-- UPDATE receipts SET subcategory = transactionType WHERE subcategory IS NULL;