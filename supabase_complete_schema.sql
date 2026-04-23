-- ═══════════════════════════════════════════════════════════════════════════════
-- DEAL DESK — Complete Supabase Schema (From Scratch)
-- Paste this ENTIRE file into Supabase SQL Editor and run it ONCE.
--
-- Auth flow:
--   1. User signs up → trigger creates a profiles row (company_id = NULL)
--   2. User goes to /onboarding → creates a companies row, links to profile
--   3. After onboarding → user goes to /dashboard
--
-- Super admin: arfa1054@gmail.com (always gets role 'super_admin')
-- All other users: role 'owner'
--
-- RLS strategy (NO circular dependencies):
--   - profiles SELECT uses id = auth.uid() directly (no function calls)
--   - All other tables use get_my_company_id() which is SECURITY DEFINER
--   - companies INSERT is open to any authenticated user (for onboarding)
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- 0. CLEAN SLATE — Drop everything if it exists
-- ─────────────────────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS get_my_company_id() CASCADE;
DROP FUNCTION IF EXISTS is_super_admin() CASCADE;

DROP TABLE IF EXISTS projects       CASCADE;
DROP TABLE IF EXISTS proposals      CASCADE;
DROP TABLE IF EXISTS contracts      CASCADE;
DROP TABLE IF EXISTS invoices       CASCADE;
DROP TABLE IF EXISTS deals          CASCADE;
DROP TABLE IF EXISTS clients        CASCADE;
DROP TABLE IF EXISTS profiles       CASCADE;
DROP TABLE IF EXISTS companies      CASCADE;


-- ═════════════════════════════════════════════════════════════════════════════
-- 1. TABLES
-- ═════════════════════════════════════════════════════════════════════════════

-- ── companies ────────────────────────────────────────────────────────────────
CREATE TABLE companies (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by             UUID DEFAULT auth.uid(),  -- tracks who created this company
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

-- ── profiles ─────────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'owner'
              CHECK (role IN ('owner', 'admin', 'super_admin')),
  company_id  UUID REFERENCES companies(id) ON DELETE SET NULL,
  onboarded   BOOLEAN NOT NULL DEFAULT false,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── clients ──────────────────────────────────────────────────────────────────
CREATE TABLE clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  whatsapp    TEXT,
  country     TEXT,
  company     TEXT,
  lead_source TEXT DEFAULT 'website',
  message     TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ── deals ────────────────────────────────────────────────────────────────────
CREATE TABLE deals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  stage           TEXT DEFAULT 'new-lead',
  value           NUMERIC DEFAULT 0,
  assigned_to     TEXT,
  follow_up_date  DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── invoices ─────────────────────────────────────────────────────────────────
CREATE TABLE invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name     TEXT,
  client_email    TEXT,
  invoice_number  TEXT NOT NULL,
  items           JSONB DEFAULT '[]'::jsonb,
  subtotal        NUMERIC DEFAULT 0,
  tax             NUMERIC DEFAULT 0,
  discount        NUMERIC DEFAULT 0,
  total           NUMERIC DEFAULT 0,
  status          TEXT DEFAULT 'draft'
                  CHECK (status IN ('draft', 'pending', 'paid', 'overdue')),
  issue_date      DATE,
  due_date        DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── contracts ────────────────────────────────────────────────────────────────
CREATE TABLE contracts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id   UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT,
  title       TEXT NOT NULL,
  template    TEXT,
  status      TEXT DEFAULT 'draft',
  value       TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ── proposals ────────────────────────────────────────────────────────────────
CREATE TABLE proposals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id   UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT,
  title       TEXT NOT NULL,
  service     TEXT,
  status      TEXT DEFAULT 'draft',
  value       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ── projects ─────────────────────────────────────────────────────────────────
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  client_id   UUID REFERENCES clients(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  status      TEXT DEFAULT 'active',
  budget      NUMERIC DEFAULT 0,
  deadline    DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);


-- ═════════════════════════════════════════════════════════════════════════════
-- 2. HELPER FUNCTIONS (SECURITY DEFINER — bypass RLS internally)
-- ═════════════════════════════════════════════════════════════════════════════

-- Returns the company_id of the currently authenticated user.
-- SECURITY DEFINER means this function runs as the DB owner,
-- so it can read profiles without hitting the profiles RLS policy.
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid();
$$;

-- Returns true if the current user is a super_admin.
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role = 'super_admin' FROM profiles WHERE id = auth.uid()),
    false
  );
$$;


-- ═════════════════════════════════════════════════════════════════════════════
-- 3. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ═════════════════════════════════════════════════════════════════════════════

ALTER TABLE companies  ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients    ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals      ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices   ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals  ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects   ENABLE ROW LEVEL SECURITY;


-- ═════════════════════════════════════════════════════════════════════════════
-- 4. RLS POLICIES
-- ═════════════════════════════════════════════════════════════════════════════

-- ── profiles ─────────────────────────────────────────────────────────────────
-- CRITICAL: SELECT uses id = auth.uid() directly — NO function calls.
-- This prevents the circular dependency where get_my_company_id() tries
-- to SELECT from profiles, which would re-invoke the RLS policy.
CREATE POLICY "profiles_select"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles_insert"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update"
  ON profiles FOR UPDATE
  USING (id = auth.uid());


-- ── companies ────────────────────────────────────────────────────────────────
-- INSERT: any authenticated user can create a company (needed for onboarding)
-- SELECT: your company via get_my_company_id(), OR the company you just created
--         (created_by = auth.uid()) — this lets .insert().select() work during
--         onboarding before the profile's company_id is set.
-- UPDATE: only your own company (after profile is linked)
CREATE POLICY "companies_insert"
  ON companies FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "companies_select"
  ON companies FOR SELECT
  USING (
    id = get_my_company_id()
    OR created_by = auth.uid()    -- lets onboarding read back the just-inserted row
    OR is_super_admin()
  );

CREATE POLICY "companies_update"
  ON companies FOR UPDATE
  USING (
    id = get_my_company_id()
    OR created_by = auth.uid()    -- lets onboarding update logo before profile is linked
    OR is_super_admin()
  );


-- ── clients ──────────────────────────────────────────────────────────────────
CREATE POLICY "clients_select"
  ON clients FOR SELECT
  USING (company_id = get_my_company_id() OR is_super_admin());

CREATE POLICY "clients_insert"
  ON clients FOR INSERT
  WITH CHECK (company_id = get_my_company_id());

CREATE POLICY "clients_update"
  ON clients FOR UPDATE
  USING (company_id = get_my_company_id() OR is_super_admin());

CREATE POLICY "clients_delete"
  ON clients FOR DELETE
  USING (company_id = get_my_company_id() OR is_super_admin());


-- ── deals ────────────────────────────────────────────────────────────────────
CREATE POLICY "deals_select"
  ON deals FOR SELECT
  USING (company_id = get_my_company_id() OR is_super_admin());

CREATE POLICY "deals_insert"
  ON deals FOR INSERT
  WITH CHECK (company_id = get_my_company_id());

CREATE POLICY "deals_update"
  ON deals FOR UPDATE
  USING (company_id = get_my_company_id() OR is_super_admin());

CREATE POLICY "deals_delete"
  ON deals FOR DELETE
  USING (company_id = get_my_company_id() OR is_super_admin());


-- ── invoices ─────────────────────────────────────────────────────────────────
CREATE POLICY "invoices_select"
  ON invoices FOR SELECT
  USING (company_id = get_my_company_id() OR is_super_admin());

CREATE POLICY "invoices_insert"
  ON invoices FOR INSERT
  WITH CHECK (company_id = get_my_company_id());

CREATE POLICY "invoices_update"
  ON invoices FOR UPDATE
  USING (company_id = get_my_company_id() OR is_super_admin());

CREATE POLICY "invoices_delete"
  ON invoices FOR DELETE
  USING (company_id = get_my_company_id() OR is_super_admin());


-- ── contracts ────────────────────────────────────────────────────────────────
CREATE POLICY "contracts_select"
  ON contracts FOR SELECT
  USING (company_id = get_my_company_id() OR is_super_admin());

CREATE POLICY "contracts_insert"
  ON contracts FOR INSERT
  WITH CHECK (company_id = get_my_company_id());

CREATE POLICY "contracts_update"
  ON contracts FOR UPDATE
  USING (company_id = get_my_company_id() OR is_super_admin());

CREATE POLICY "contracts_delete"
  ON contracts FOR DELETE
  USING (company_id = get_my_company_id() OR is_super_admin());


-- ── proposals ────────────────────────────────────────────────────────────────
CREATE POLICY "proposals_select"
  ON proposals FOR SELECT
  USING (company_id = get_my_company_id() OR is_super_admin());

CREATE POLICY "proposals_insert"
  ON proposals FOR INSERT
  WITH CHECK (company_id = get_my_company_id());

CREATE POLICY "proposals_update"
  ON proposals FOR UPDATE
  USING (company_id = get_my_company_id() OR is_super_admin());

CREATE POLICY "proposals_delete"
  ON proposals FOR DELETE
  USING (company_id = get_my_company_id() OR is_super_admin());


-- ── projects ─────────────────────────────────────────────────────────────────
CREATE POLICY "projects_select"
  ON projects FOR SELECT
  USING (company_id = get_my_company_id() OR is_super_admin());

CREATE POLICY "projects_insert"
  ON projects FOR INSERT
  WITH CHECK (company_id = get_my_company_id());

CREATE POLICY "projects_update"
  ON projects FOR UPDATE
  USING (company_id = get_my_company_id() OR is_super_admin());

CREATE POLICY "projects_delete"
  ON projects FOR DELETE
  USING (company_id = get_my_company_id() OR is_super_admin());


-- ═════════════════════════════════════════════════════════════════════════════
-- 5. AUTH TRIGGER — Create profile on signup
-- ═════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- arfa1054@gmail.com is always super_admin, everyone else is owner
  IF NEW.email = 'arfa1054@gmail.com' THEN
    user_role := 'super_admin';
  ELSE
    user_role := 'owner';
  END IF;

  INSERT INTO public.profiles (id, full_name, role, company_id, onboarded, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    user_role,
    NULL,    -- no company yet — user completes onboarding first
    false,   -- not onboarded yet
    NULL
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();


-- ═════════════════════════════════════════════════════════════════════════════
-- 6. STORAGE — Public bucket for company logos
-- ═════════════════════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop any existing storage policies (from previous runs)
DROP POLICY IF EXISTS "company_logos_read"   ON storage.objects;
DROP POLICY IF EXISTS "company_logos_upload" ON storage.objects;
DROP POLICY IF EXISTS "company_logos_update" ON storage.objects;
DROP POLICY IF EXISTS "company_logos_delete" ON storage.objects;
-- Also drop old names from previous schema versions
DROP POLICY IF EXISTS "logos_read"   ON storage.objects;
DROP POLICY IF EXISTS "logos_write"  ON storage.objects;
DROP POLICY IF EXISTS "logos_modify" ON storage.objects;
DROP POLICY IF EXISTS "logos_remove" ON storage.objects;

-- Everyone can read logos (public bucket)
CREATE POLICY "company_logos_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-logos');

-- Authenticated users can upload logos
CREATE POLICY "company_logos_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'company-logos' AND auth.uid() IS NOT NULL);

-- Authenticated users can update their uploads
CREATE POLICY "company_logos_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'company-logos' AND auth.uid() IS NOT NULL);

-- Authenticated users can delete their uploads
CREATE POLICY "company_logos_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'company-logos' AND auth.uid() IS NOT NULL);


-- ═════════════════════════════════════════════════════════════════════════════
-- 7. BACKFILL — Create profiles for ALL existing auth.users
--    (The trigger only fires on NEW signups. Since we just dropped & recreated
--     the profiles table, existing users have no profile row → app breaks.)
-- ═════════════════════════════════════════════════════════════════════════════

INSERT INTO public.profiles (id, full_name, role, company_id, onboarded, avatar_url)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)),
  CASE WHEN u.email = 'arfa1054@gmail.com' THEN 'super_admin' ELSE 'owner' END,
  NULL,    -- no company — forces them through onboarding again
  false,   -- not onboarded
  NULL
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;


-- ═════════════════════════════════════════════════════════════════════════════
-- ✅ DONE
-- ═════════════════════════════════════════════════════════════════════════════
-- 
-- What this creates:
--   ✓ 8 tables: companies, profiles, clients, deals, invoices, contracts,
--               proposals, projects
--   ✓ 2 helper functions: get_my_company_id(), is_super_admin()
--   ✓ 30 RLS policies (no circular dependencies)
--   ✓ 1 auth trigger: auto-creates profile on signup
--   ✓ 1 storage bucket: company-logos (public read, auth write)
--
-- Auth flow after running this:
--   1. User signs up → trigger creates profiles row (company_id = NULL)
--   2. User visits /onboarding → your app creates a companies row,
--      then updates profiles SET company_id = <new_company_id>, onboarded = true
--   3. User is redirected to /dashboard — everything works
--
-- Deployed at: https://dealdesk-project.vercel.app
-- Local dev:   http://localhost:5173
-- ═════════════════════════════════════════════════════════════════════════════
