-- Burger Go Stamp Program Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Create stamp_users table
CREATE TABLE IF NOT EXISTS stamp_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone_full TEXT NOT NULL,
  phone_last4 TEXT NOT NULL,
  stamps INTEGER DEFAULT 0 CHECK (stamps >= 0),
  free_burger_available BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(phone_full)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_phone_last4 ON stamp_users(phone_last4);
CREATE INDEX IF NOT EXISTS idx_name ON stamp_users(name);
CREATE INDEX IF NOT EXISTS idx_phone_full ON stamp_users(phone_full);

-- Create stamp_history table (optional - for tracking stamp additions)
CREATE TABLE IF NOT EXISTS stamp_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES stamp_users(id) ON DELETE CASCADE,
  added_by TEXT DEFAULT 'employee',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for stamp_history
CREATE INDEX IF NOT EXISTS idx_stamp_history_user ON stamp_history(user_id);
CREATE INDEX IF NOT EXISTS idx_stamp_history_created ON stamp_history(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE stamp_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stamp_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stamp_users
-- Allow public read access
CREATE POLICY "Allow public read" ON stamp_users
  FOR SELECT USING (true);

-- Allow public insert (registration)
CREATE POLICY "Allow public insert" ON stamp_users
  FOR INSERT WITH CHECK (true);

-- Allow public update (for now - you may want to restrict this later with authentication)
CREATE POLICY "Allow public update" ON stamp_users
  FOR UPDATE USING (true);

-- RLS Policies for stamp_history
-- Allow public read access
CREATE POLICY "Allow public read history" ON stamp_history
  FOR SELECT USING (true);

-- Allow public insert (for logging stamp additions)
CREATE POLICY "Allow public insert history" ON stamp_history
  FOR INSERT WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_stamp_users_updated_at
  BEFORE UPDATE ON stamp_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
