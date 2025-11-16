-- Create waitlist_entries table
CREATE TABLE IF NOT EXISTS waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role_interest TEXT NOT NULL,
  message TEXT,
  referrer TEXT,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'promoted', 'removed')),
  confirm_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create promotions audit table
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waitlist_id UUID NOT NULL REFERENCES waitlist_entries(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id),
  promoted_to TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist_entries(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist_entries(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_confirm_token ON waitlist_entries(confirm_token);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_promotions_waitlist_id ON promotions(waitlist_id);

-- Enable Row Level Security
ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Policies for waitlist_entries
-- Allow anyone to insert (public signup)
CREATE POLICY "Anyone can insert waitlist entries"
  ON waitlist_entries FOR INSERT
  WITH CHECK (true);

-- Allow users to view their own entry by email
CREATE POLICY "Users can view their own entry"
  ON waitlist_entries FOR SELECT
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Allow admins to view all entries
CREATE POLICY "Admins can view all entries"
  ON waitlist_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow admins to update entries
CREATE POLICY "Admins can update entries"
  ON waitlist_entries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policies for promotions
-- Only admins can insert promotions
CREATE POLICY "Only admins can insert promotions"
  ON promotions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can view promotions
CREATE POLICY "Only admins can view promotions"
  ON promotions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_waitlist_entries_updated_at
  BEFORE UPDATE ON waitlist_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comment on tables
COMMENT ON TABLE waitlist_entries IS 'Stores waitlist signup entries with confirmation tracking';
COMMENT ON TABLE promotions IS 'Audit log for user promotions from waitlist to testers/admins';
