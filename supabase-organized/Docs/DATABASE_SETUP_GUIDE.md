# 🚀 Quick Database Setup Guide

## **FASTEST METHOD: Manual SQL in Dashboard** (2 minutes)

### **Step 1: Open Supabase Dashboard**
1. Go to: https://app.supabase.com/project/lgfrnuzuyammbqxcqgyo
2. Log in with your Supabase account

### **Step 2: Open SQL Editor**
1. Click **SQL Editor** in the left sidebar (icon looks like `</>`)
2. Click **New Query** button

### **Step 3: Copy & Paste Migration SQL**

Copy the entire SQL below and paste it into the SQL Editor:

```sql
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
-- Allow admins to insert promotion records
CREATE POLICY "Admins can insert promotions"
  ON promotions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow admins to view all promotions
CREATE POLICY "Admins can view all promotions"
  ON promotions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_waitlist_entries_updated_at
  BEFORE UPDATE ON waitlist_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### **Step 4: Run the Query**
1. Click the **Run** button (or press `Ctrl+Enter`)
2. You should see: **Success. No rows returned**

### **Step 5: Verify Tables Created**
1. Click **Table Editor** in the left sidebar
2. You should see two new tables:
   - ✅ `waitlist_entries`
   - ✅ `promotions`

---

## **🧪 Test the Form Now!**

1. **Go back to your app**: http://localhost:8081/waitlist
2. **Fill the form:**
   - Email: `yourname@example.com`
   - Role: Select any option
   - Check consent checkbox ✓
3. **Click "Join Waitlist"**
4. **Expected results:**
   - ✅ Success toast: "🎉 Welcome to the Waitlist!"
   - ✅ Success modal opens
   - ✅ Form resets

5. **Verify in Supabase:**
   - Go to Table Editor → `waitlist_entries`
   - Your entry should appear there!

---

## **🎉 That's It!**

Your database is now set up and the waitlist form is **fully functional**!

**Total Time:** ~2 minutes ⏱️

---

## **📊 What Was Created:**

### **waitlist_entries table:**
- `id` - Unique UUID for each entry
- `name` - User's name (optional)
- `email` - Email address (unique, required)
- `phone` - Phone number (optional)
- `role_interest` - Selected role (required)
- `message` - User's message (optional)
- `referrer` - How they heard about us
- `source` - Which page they signed up from
- `status` - pending/confirmed/promoted/removed
- `confirm_token` - For email confirmation
- `created_at` - When they signed up
- `updated_at` - Last update timestamp

### **Security Features:**
- ✅ Row Level Security enabled
- ✅ Anyone can insert entries (public signup)
- ✅ Users can view their own entry
- ✅ Admins can view/update all entries
- ✅ Email uniqueness enforced (no duplicates)

### **Performance:**
- ✅ Indexes on email, status, token, created_at
- ✅ Auto-update trigger for timestamps
- ✅ Efficient queries for admin panel

---

## **Alternative: Use SQL File Directly**

If you prefer, you can also:
1. Open `supabase/migrations/20241116000001_create_waitlist_tables.sql`
2. Copy entire contents
3. Paste into Supabase SQL Editor
4. Run

Both methods do the same thing!

---

**Quick Link:** https://app.supabase.com/project/lgfrnuzuyammbqxcqgyo/editor

**Ready to test!** 🚀
