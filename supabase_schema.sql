-- ==========================================
-- SUPABASE SCHEMA SETUP FOR CRM
-- ==========================================

-- 1. Create custom enum types
CREATE TYPE user_role AS ENUM ('user', 'super_admin');
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'max', 'business');

-- 2. Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'user',
  tier subscription_tier DEFAULT 'free',
  trial_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin');

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin');

-- 3. Trigger to create a profile automatically on signup with 14-day Pro trial
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, tier, trial_end_date)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    'pro', -- 14 day trial starts as Pro
    NOW() + INTERVAL '14 days'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id), -- Nullable for easy testing when auth isn't fully set up yet
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  country TEXT,
  company TEXT,
  lead_source TEXT DEFAULT 'website',
  message TEXT,
  notes TEXT,
  status TEXT DEFAULT 'Active',
  value NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- If you don't enforce authentication heavily right now, you might want these policies.
-- Change user_id checking according to your auth logic.
CREATE POLICY "Enable all for authenticated users or anonymous for testing" ON clients FOR ALL USING (true) WITH CHECK (true);

-- 5. Create deals table
CREATE TABLE IF NOT EXISTS deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id), -- Nullable for easy testing
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT,
  value NUMERIC DEFAULT 0,
  stage TEXT NOT NULL DEFAULT 'new-lead',
  assigned_to TEXT,
  follow_up_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users or anonymous for testing" ON deals FOR ALL USING (true) WITH CHECK (true);

-- Note: Run this whole file in the Supabase SQL Editor.
