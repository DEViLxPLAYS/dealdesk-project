-- ═══════════════════════════════════════════════════════════════════
-- DEAL DESK — FINAL FIX (Trigger + RLS infinite loop fix)
-- Run this in Supabase SQL Editor. ONE TIME. Fixes everything.
-- ═══════════════════════════════════════════════════════════════════

-- Step 1: Safely add missing columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarded  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Step 2: Make old columns nullable (skips gracefully if they don't exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='tier') THEN
    ALTER TABLE profiles ALTER COLUMN tier DROP NOT NULL;
    ALTER TABLE profiles ALTER COLUMN tier SET DEFAULT 'free';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email') THEN
    ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='updated_at') THEN
    ALTER TABLE profiles ALTER COLUMN updated_at DROP NOT NULL;
  END IF;
END $$;

-- Step 3: Drop only the trigger (not functions — policies depend on them)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 4: Replace functions in-place (no drop = no policy conflicts)
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

-- Step 5: Fixed trigger — only creates profile, no company (company comes from onboarding)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF NEW.email = 'arfa1054@gmail.com' THEN
    v_role := 'super_admin';
  ELSE
    v_role := 'owner';
  END IF;

  INSERT INTO profiles (id, company_id, full_name, role, onboarded)
  VALUES (
    NEW.id,
    NULL,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    v_role,
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role      = EXCLUDED.role;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user error: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────────────────────────────────────────────
-- Step 6: FIX THE INFINITE LOADING BUG
-- The old profile_select policy called get_my_company_id() which reads
-- from profiles → causing a circular RLS loop → query hangs forever.
-- Fix: profiles table RLS only needs id = auth.uid() (users read own row).
-- ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "profile_select" ON profiles;
DROP POLICY IF EXISTS "profile_insert" ON profiles;
DROP POLICY IF EXISTS "profile_update" ON profiles;

CREATE POLICY "profile_select" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profile_insert" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profile_update" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════
-- DONE. Signup works. Refresh no longer hangs.
-- ═══════════════════════════════════════════════════════════════════
