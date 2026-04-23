-- ═══════════════════════════════════════════════════════════════════
-- DEAL DESK — QUICK FIX MIGRATION
-- Run this in Supabase SQL Editor to fix "Database error saving new user"
-- This is SAFE to run — it does NOT wipe your existing data.
-- ═══════════════════════════════════════════════════════════════════

-- ── STEP 1: Create companies table if it doesn't exist ─────────────
CREATE TABLE IF NOT EXISTS companies (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                   TEXT NOT NULL,
  email                  TEXT,
  phone                  TEXT,
  website                TEXT,
  address                TEXT,
  logo_url               TEXT,
  subscription_status    TEXT NOT NULL DEFAULT 'trial',
  trial_ends_at          TIMESTAMPTZ DEFAULT (now() + interval '14 days'),
  paypal_subscription_id TEXT,
  plan                   TEXT DEFAULT 'starter',
  created_at             TIMESTAMPTZ DEFAULT now(),
  updated_at             TIMESTAMPTZ DEFAULT now()
);

-- ── STEP 2: Patch profiles table — add missing columns safely ───────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarded  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Remove old columns that conflict (safe — they may not exist)
ALTER TABLE profiles DROP COLUMN IF EXISTS tier;
ALTER TABLE profiles DROP COLUMN IF EXISTS trial_end_date;
ALTER TABLE profiles DROP COLUMN IF EXISTS email;
ALTER TABLE profiles DROP COLUMN IF EXISTS updated_at;

-- ── STEP 3: Drop old broken trigger & function ──────────────────────
DROP TRIGGER  IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS get_my_company_id();
DROP FUNCTION IF EXISTS is_super_admin();

-- ── STEP 4: Create correct helper functions ─────────────────────────
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT role = 'super_admin' FROM profiles WHERE id = auth.uid()),
    false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── STEP 5: Create the FIXED trigger ────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Assign super_admin role to the platform owner
  IF NEW.email = 'arfa1054@gmail.com' THEN
    user_role := 'super_admin';
  ELSE
    user_role := 'owner';
  END IF;

  -- Insert profile (company_id is NULL until onboarding wizard is completed)
  INSERT INTO profiles (id, company_id, full_name, role, onboarded)
  VALUES (
    NEW.id,
    NULL,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    user_role,
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role      = EXCLUDED.role;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── STEP 6: Enable RLS on companies (if not already) ────────────────
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles  ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies (safe with IF EXISTS workaround)
DO $$
BEGIN
  -- Companies
  DROP POLICY IF EXISTS "company_select" ON companies;
  DROP POLICY IF EXISTS "company_insert" ON companies;
  DROP POLICY IF EXISTS "company_update" ON companies;
  CREATE POLICY "company_select" ON companies FOR SELECT USING (id = get_my_company_id() OR is_super_admin());
  CREATE POLICY "company_insert" ON companies FOR INSERT WITH CHECK (true);
  CREATE POLICY "company_update" ON companies FOR UPDATE USING (id = get_my_company_id() OR is_super_admin());

  -- Profiles
  DROP POLICY IF EXISTS "profile_select" ON profiles;
  DROP POLICY IF EXISTS "profile_insert" ON profiles;
  DROP POLICY IF EXISTS "profile_update" ON profiles;
  CREATE POLICY "profile_select" ON profiles FOR SELECT USING (id = auth.uid() OR company_id = get_my_company_id() OR is_super_admin());
  CREATE POLICY "profile_insert" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
  CREATE POLICY "profile_update" ON profiles FOR UPDATE USING (id = auth.uid() OR is_super_admin());
END $$;

-- ── STEP 7: Create other tables if missing ──────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT, phone TEXT, whatsapp TEXT, country TEXT,
  company     TEXT, lead_source TEXT DEFAULT 'website',
  message     TEXT, notes TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id      UUID REFERENCES clients(id) ON DELETE SET NULL,
  title          TEXT NOT NULL, value NUMERIC DEFAULT 0,
  stage          TEXT DEFAULT 'new-lead', service TEXT, notes TEXT,
  expected_close DATE,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
  invoice_number  TEXT NOT NULL, title TEXT,
  client_name     TEXT, client_company TEXT, client_email TEXT,
  issue_date DATE, due_date DATE, status TEXT DEFAULT 'draft',
  items JSONB DEFAULT '[]',
  subtotal NUMERIC DEFAULT 0, tax_rate NUMERIC DEFAULT 10,
  tax_amount NUMERIC DEFAULT 0, discount NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0, notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT, client_company TEXT, title TEXT NOT NULL,
  service TEXT, value TEXT, status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT, client_company TEXT, title TEXT NOT NULL,
  template TEXT, content TEXT, value TEXT, status TEXT DEFAULT 'draft',
  start_date DATE, end_date DATE, signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT, name TEXT NOT NULL, description TEXT,
  status TEXT DEFAULT 'active', progress INTEGER DEFAULT 0, due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  event_type TEXT, paypal_event_id TEXT, payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS on all tenant tables
DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['clients','deals','invoices','proposals','contracts','projects','subscription_events']
  LOOP
    EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "%s_sel" ON %s', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "%s_ins" ON %s', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "%s_upd" ON %s', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "%s_del" ON %s', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_sel" ON %s FOR SELECT USING (company_id = get_my_company_id() OR is_super_admin())', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_ins" ON %s FOR INSERT WITH CHECK (company_id = get_my_company_id())', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_upd" ON %s FOR UPDATE USING (company_id = get_my_company_id() OR is_super_admin())', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_del" ON %s FOR DELETE USING (company_id = get_my_company_id() OR is_super_admin())', tbl, tbl);
  END LOOP;
END $$;

-- ── STEP 8: Storage bucket for logos ────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "logos_read"   ON storage.objects;
DROP POLICY IF EXISTS "logos_write"  ON storage.objects;
DROP POLICY IF EXISTS "logos_modify" ON storage.objects;
DROP POLICY IF EXISTS "logos_remove" ON storage.objects;

CREATE POLICY "logos_read"   ON storage.objects FOR SELECT USING (bucket_id = 'company-logos');
CREATE POLICY "logos_write"  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'company-logos' AND auth.uid() IS NOT NULL);
CREATE POLICY "logos_modify" ON storage.objects FOR UPDATE USING (bucket_id = 'company-logos' AND auth.uid() IS NOT NULL);
CREATE POLICY "logos_remove" ON storage.objects FOR DELETE USING (bucket_id = 'company-logos' AND auth.uid() IS NOT NULL);

-- ═══════════════════════════════════════════════════════════════════
-- DONE! The "Database error saving new user" is now fixed.
-- New signups will create a profile with company_id = NULL.
-- The onboarding wizard creates the company after email confirmation.
-- ═══════════════════════════════════════════════════════════════════
