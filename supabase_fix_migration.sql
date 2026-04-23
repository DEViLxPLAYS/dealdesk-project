-- ═══════════════════════════════════════════════════════════════════
-- DEAL DESK — COMPLETE SETUP SQL
-- Run this ONE TIME in Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════════

-- ── Part 1: Fix trigger so signup works ──────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT role = 'super_admin' FROM profiles WHERE id = auth.uid()), false);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE v_role TEXT;
BEGIN
  IF NEW.email = 'arfa1054@gmail.com' THEN v_role := 'super_admin';
  ELSE v_role := 'owner';
  END IF;
  INSERT INTO profiles (id, company_id, full_name, role, onboarded)
  VALUES (NEW.id, NULL, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), v_role, false)
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RAISE WARNING 'handle_new_user: %', SQLERRM; RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Part 2: Fix circular RLS on profiles (infinite loading bug) ───────
DROP POLICY IF EXISTS "profile_select" ON profiles;
DROP POLICY IF EXISTS "profile_insert" ON profiles;
DROP POLICY IF EXISTS "profile_update" ON profiles;

CREATE POLICY "profile_select" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profile_insert" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profile_update" ON profiles FOR UPDATE USING (id = auth.uid());

-- ── Part 3: Create your company and link it to your profile ───────────
-- This creates a company for every profile that doesn't have one yet.
DO $$
DECLARE
  rec RECORD;
  v_company_id UUID;
BEGIN
  FOR rec IN
    SELECT id, full_name FROM profiles WHERE company_id IS NULL AND role != 'super_admin'
  LOOP
    INSERT INTO companies (name, subscription_status, plan)
    VALUES (COALESCE(rec.full_name || '''s Company', 'My Company'), 'trial', 'starter')
    RETURNING id INTO v_company_id;

    UPDATE profiles SET company_id = v_company_id, onboarded = true WHERE id = rec.id;

    RAISE NOTICE 'Created company % for profile %', v_company_id, rec.id;
  END LOOP;
END $$;

-- ── Part 4: Verify — run this to see your profile now ─────────────────
SELECT p.id, p.full_name, p.role, p.company_id, p.onboarded, c.name AS company_name
FROM profiles p
LEFT JOIN companies c ON c.id = p.company_id;

-- ═══════════════════════════════════════════════════════════════════
-- After running this:
-- 1. Every existing user now has a company
-- 2. Signup trigger works for new users (company set during onboarding)
-- 3. No more infinite loading (circular RLS fixed)
-- 4. RLS policies allow your inserts with the new company_id
-- ═══════════════════════════════════════════════════════════════════
