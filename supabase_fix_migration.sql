-- ═══════════════════════════════════════════════════════════════════
-- DEAL DESK — DEFINITIVE ONE-SHOT FIX
-- Handles ALL cases. Safe to run no matter what state your DB is in.
-- ═══════════════════════════════════════════════════════════════════

-- Step 1: Safely patch the profiles table columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarded  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Step 2: Make old columns nullable (safe — skips if they don't exist)
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

-- Step 3: Drop ONLY the trigger (not functions — policies depend on them)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 4: Replace all functions IN PLACE (CREATE OR REPLACE keeps RLS intact)
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
  -- Log error but don't block the signup
  RAISE WARNING 'handle_new_user error: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Reattach trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ═══════════════════════════════════════════════════════════════════
-- DONE. You should see: "Success. No rows returned."
-- ═══════════════════════════════════════════════════════════════════
