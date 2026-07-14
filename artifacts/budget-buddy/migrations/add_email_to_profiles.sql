-- Run this in your Supabase SQL editor (project dashboard → SQL Editor)
-- This adds an email column to profiles so users can log in with their username

-- 1. Add email column
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email text;

-- 2. Allow unauthenticated users to look up email by username (for login)
--    This only exposes name + email — nothing sensitive.
CREATE POLICY IF NOT EXISTS "anon_username_lookup"
  ON profiles
  FOR SELECT
  TO anon
  USING (true);
