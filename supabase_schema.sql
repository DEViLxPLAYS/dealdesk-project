-- ═══════════════════════════════════════════════════════════════════
-- DEAL DESK — Multi-Tenant SaaS Database Schema
-- Run this ENTIRE script in the Supabase SQL Editor
-- WARNING: This wipes all existing data!
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. WIPE ALL EXISTING DATA ────────────────────────────────────────
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS proposals CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS deals CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS subscription_events CASCADE;

-- Remove old trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS get_my_company_id();
DROP FUNCTION IF EXISTS is_super_admin();

-- ── 2. COMPANIES (Tenant table) ──────────────────────────────────────
CREATE TABLE companies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  website         TEXT,
  address         TEXT,
  logo_url        TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'trial',
  trial_ends_at   TIMESTAMPTZ DEFAULT (now() + interval '14 days'),
  paypal_subscription_id TEXT,
  plan            TEXT DEFAULT 'starter',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── 3. PROFILES ───────────────────────────────────────────────────────
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id      UUID REFERENCES companies(id) ON DELETE CASCADE,
  full_name       TEXT,
  role            TEXT NOT NULL DEFAULT 'owner',
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── 4. CLIENTS ────────────────────────────────────────────────────────
CREATE TABLE clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  whatsapp        TEXT,
  country         TEXT,
  company         TEXT,
  lead_source     TEXT DEFAULT 'website',
  message         TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── 5. DEALS ──────────────────────────────────────────────────────────
CREATE TABLE deals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  value           NUMERIC DEFAULT 0,
  stage           TEXT DEFAULT 'new-lead',
  service         TEXT,
  notes           TEXT,
  expected_close  DATE,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── 6. INVOICES ───────────────────────────────────────────────────────
CREATE TABLE invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
  invoice_number  TEXT NOT NULL,
  title           TEXT,
  client_name     TEXT,
  client_company  TEXT,
  client_email    TEXT,
  issue_date      DATE,
  due_date        DATE,
  status          TEXT DEFAULT 'draft',
  items           JSONB DEFAULT '[]',
  subtotal        NUMERIC DEFAULT 0,
  tax_rate        NUMERIC DEFAULT 10,
  tax_amount      NUMERIC DEFAULT 0,
  discount        NUMERIC DEFAULT 0,
  total_amount    NUMERIC DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── 7. PROPOSALS ──────────────────────────────────────────────────────
CREATE TABLE proposals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name     TEXT,
  client_company  TEXT,
  title           TEXT NOT NULL,
  service         TEXT,
  value           TEXT,
  status          TEXT DEFAULT 'draft',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── 8. CONTRACTS ──────────────────────────────────────────────────────
CREATE TABLE contracts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name     TEXT,
  client_company  TEXT,
  title           TEXT NOT NULL,
  template        TEXT,
  content         TEXT,
  value           TEXT,
  status          TEXT DEFAULT 'draft',
  start_date      DATE,
  end_date        DATE,
  signed_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── 9. PROJECTS ───────────────────────────────────────────────────────
CREATE TABLE projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name     TEXT,
  name            TEXT NOT NULL,
  description     TEXT,
  status          TEXT DEFAULT 'active',
  progress        INTEGER DEFAULT 0,
  due_date        DATE,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── 10. SUBSCRIPTION EVENTS ───────────────────────────────────────────
CREATE TABLE subscription_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID REFERENCES companies(id) ON DELETE CASCADE,
  event_type      TEXT,
  paypal_event_id TEXT,
  payload         JSONB,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE companies           ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients             ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals               ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices            ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects            ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- Helper: get company_id for current user
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT role = 'super_admin' FROM profiles WHERE id = auth.uid()), false);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Companies RLS
CREATE POLICY "company_select" ON companies FOR SELECT USING (id = get_my_company_id() OR is_super_admin());
CREATE POLICY "company_update" ON companies FOR UPDATE USING (id = get_my_company_id() OR is_super_admin());
CREATE POLICY "company_insert" ON companies FOR INSERT WITH CHECK (true);

-- Profiles RLS
CREATE POLICY "profile_select" ON profiles FOR SELECT USING (id = auth.uid() OR company_id = get_my_company_id() OR is_super_admin());
CREATE POLICY "profile_insert" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profile_update" ON profiles FOR UPDATE USING (id = auth.uid());

-- Tenant tables RLS
DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['clients','deals','invoices','proposals','contracts','projects','subscription_events']
  LOOP
    EXECUTE format('CREATE POLICY "%s_sel" ON %s FOR SELECT USING (company_id = get_my_company_id() OR is_super_admin())', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_ins" ON %s FOR INSERT WITH CHECK (company_id = get_my_company_id())', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_upd" ON %s FOR UPDATE USING (company_id = get_my_company_id() OR is_super_admin())', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_del" ON %s FOR DELETE USING (company_id = get_my_company_id() OR is_super_admin())', tbl, tbl);
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- AUTO-CREATE PROFILE + COMPANY ON SIGNUP TRIGGER
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_company_id UUID;
  user_role TEXT;
  super_admin_email TEXT := 'YOUR_SUPER_ADMIN_EMAIL@gmail.com'; -- ← CHANGE THIS TO YOUR EMAIL
BEGIN
  IF NEW.email = super_admin_email THEN
    user_role := 'super_admin';
  ELSE
    user_role := 'owner';
  END IF;

  IF user_role != 'super_admin' THEN
    INSERT INTO companies (name, email)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'company_name', split_part(NEW.email, '@', 2)),
      NEW.email
    )
    RETURNING id INTO new_company_id;
  END IF;

  INSERT INTO profiles (id, company_id, full_name, role)
  VALUES (
    NEW.id,
    new_company_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    user_role
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ═══════════════════════════════════════════════════════════════════
-- STORAGE BUCKET FOR LOGOS
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "logos_read"   ON storage.objects FOR SELECT USING (bucket_id = 'company-logos');
CREATE POLICY "logos_write"  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'company-logos' AND auth.uid() IS NOT NULL);
CREATE POLICY "logos_modify" ON storage.objects FOR UPDATE USING (bucket_id = 'company-logos' AND auth.uid() IS NOT NULL);
CREATE POLICY "logos_remove" ON storage.objects FOR DELETE USING (bucket_id = 'company-logos' AND auth.uid() IS NOT NULL);

-- DONE!
