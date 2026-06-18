-- Cognify Password Manager - Database Schema
-- Run this in your Supabase SQL Editor

-- Create passwords table
CREATE TABLE IF NOT EXISTS passwords (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  website_name TEXT NOT NULL,
  website_url TEXT, 
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  notes TEXT,
  category TEXT DEFAULT 'Personal',
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE passwords ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own passwords
CREATE POLICY "Users can view their own passwords"
  ON passwords
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own passwords
CREATE POLICY "Users can insert their own passwords"
  ON passwords
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own passwords
CREATE POLICY "Users can update their own passwords"
  ON passwords
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy: Users can delete their own passwords
CREATE POLICY "Users can delete their own passwords"
  ON passwords
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_passwords_user_id ON passwords(user_id);
CREATE INDEX IF NOT EXISTS idx_passwords_created_at ON passwords(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_passwords_is_favorite ON passwords(is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX IF NOT EXISTS idx_passwords_website_name ON passwords(website_name);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_passwords_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER passwords_updated_at_trigger
  BEFORE UPDATE ON passwords
  FOR EACH ROW
  EXECUTE FUNCTION update_passwords_updated_at();

-- Grant necessary permissions
GRANT ALL ON passwords TO authenticated;
GRANT ALL ON passwords TO service_role;
