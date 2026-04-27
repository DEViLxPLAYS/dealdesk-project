-- ============================================================
-- Deal Desk — Team Member Management Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Extend role CHECK constraint to include manager + employee
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('owner', 'admin', 'manager', 'employee', 'super_admin'));

-- 2. Add username column (unique per company)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_company_idx
  ON profiles (company_id, username)
  WHERE username IS NOT NULL;

-- ============================================================
-- 3. RPC: create_team_member
--    Owner/manager calls this to create a new team member.
--    Uses SECURITY DEFINER so it can insert directly into auth.users.
-- ============================================================
CREATE OR REPLACE FUNCTION create_team_member(
  p_display_name TEXT,
  p_username     TEXT,
  p_password     TEXT,
  p_role         TEXT   -- 'manager' | 'employee'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id  UUID;
  v_email       TEXT;
  v_user_id     UUID;
  v_caller_role TEXT;
BEGIN
  -- Only owner/manager may call this
  SELECT company_id, role INTO v_company_id, v_caller_role
    FROM profiles WHERE id = auth.uid();

  IF v_caller_role NOT IN ('owner', 'manager', 'admin', 'super_admin') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  -- Validate role
  IF p_role NOT IN ('manager', 'employee') THEN
    RAISE EXCEPTION 'Invalid role. Must be manager or employee';
  END IF;

  -- Only owner/admin can create managers
  IF p_role = 'manager' AND v_caller_role NOT IN ('owner', 'admin', 'super_admin') THEN
    RAISE EXCEPTION 'Only owners can create managers';
  END IF;

  -- Synthetic email — never sent to user
  v_email := lower(p_username) || '@' || replace(v_company_id::text, '-', '') || '.internal';

  -- Check if username already exists
  IF EXISTS (
    SELECT 1 FROM profiles WHERE username = lower(p_username) AND company_id = v_company_id
  ) THEN
    RAISE EXCEPTION 'Username already exists in this company';
  END IF;

  -- Create auth user
  INSERT INTO auth.users (
    id, email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at, aud, role
  ) VALUES (
    gen_random_uuid(),
    v_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    jsonb_build_object('full_name', p_display_name),
    now(), now(), 'authenticated', 'authenticated'
  )
  RETURNING id INTO v_user_id;

  -- Profile row (ON CONFLICT in case trigger fires first)
  INSERT INTO profiles (id, full_name, role, company_id, onboarded, username)
  VALUES (v_user_id, p_display_name, p_role, v_company_id, true, lower(p_username))
  ON CONFLICT (id) DO UPDATE
    SET full_name  = EXCLUDED.full_name,
        role       = EXCLUDED.role,
        company_id = EXCLUDED.company_id,
        onboarded  = true,
        username   = EXCLUDED.username;

  RETURN v_user_id;
END;
$$;

-- ============================================================
-- 4. RPC: delete_team_member (owner only)
-- ============================================================
CREATE OR REPLACE FUNCTION delete_team_member(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id  UUID;
  v_caller_role TEXT;
BEGIN
  SELECT company_id, role INTO v_company_id, v_caller_role
    FROM profiles WHERE id = auth.uid();

  IF v_caller_role NOT IN ('owner', 'admin', 'super_admin') THEN
    RAISE EXCEPTION 'Only owners can delete team members';
  END IF;

  -- Ensure target belongs to same company
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = p_user_id AND company_id = v_company_id
  ) THEN
    RAISE EXCEPTION 'Member not found in your company';
  END IF;

  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;

-- ============================================================
-- 5. RPC: get_team_members (returns all members in caller's company except self)
-- ============================================================
CREATE OR REPLACE FUNCTION get_team_members()
RETURNS TABLE (
  id UUID, full_name TEXT, username TEXT, role TEXT,
  avatar_url TEXT, created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT p.id, p.full_name, p.username, p.role, p.avatar_url, p.created_at
  FROM profiles p
  WHERE p.company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
    AND p.id <> auth.uid()
  ORDER BY p.created_at;
$$;

-- ============================================================
-- 6. RPC: resolve_team_login (username + company_name → synthetic email)
--    Called from the login page BEFORE signInWithPassword.
-- ============================================================
CREATE OR REPLACE FUNCTION resolve_team_login(p_username TEXT, p_company_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_email      TEXT;
BEGIN
  SELECT id INTO v_company_id
    FROM companies
    WHERE lower(name) = lower(trim(p_company_name))
    LIMIT 1;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Company not found';
  END IF;

  -- Build synthetic email
  v_email := lower(p_username) || '@' || replace(v_company_id::text, '-', '') || '.internal';

  -- Verify profile exists
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE username = lower(p_username) AND company_id = v_company_id
  ) THEN
    RAISE EXCEPTION 'Invalid username or company';
  END IF;

  RETURN v_email;
END;
$$;

-- ============================================================
-- Grant execute to authenticated users
-- (SECURITY DEFINER functions run as the function owner,
--  but we still need authenticated callers to be able to invoke them)
-- ============================================================
GRANT EXECUTE ON FUNCTION create_team_member(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_team_member(UUID)                    TO authenticated;
GRANT EXECUTE ON FUNCTION get_team_members()                          TO authenticated;
GRANT EXECUTE ON FUNCTION resolve_team_login(TEXT, TEXT)              TO anon, authenticated;
