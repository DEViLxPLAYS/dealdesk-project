-- =============================================================================
-- Deal Desk — TEAM MEMBER SYSTEM  (Run this in Supabase SQL Editor)
-- =============================================================================
-- Fixes: "Could not find the function public.create_team_member in the schema cache"
-- Just paste this entire file → Run → Done.
-- =============================================================================


-- ── 0. Extensions ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto  SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;


-- ── 1. Add username column to profiles ────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;

DROP INDEX  IF EXISTS profiles_username_company_idx;
CREATE UNIQUE INDEX       profiles_username_company_idx
  ON public.profiles (company_id, username)
  WHERE username IS NOT NULL;

-- Allow all role values used in the app
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD  CONSTRAINT profiles_role_check
  CHECK (role IN ('owner','admin','manager','employee','super_admin'));


-- ── 2. Clean up soft-deleted GoTrue ghost rows (prevent duplicate-key errors) ─
DELETE FROM auth.identities
  WHERE user_id IN (SELECT id FROM auth.users WHERE deleted_at IS NOT NULL);
DELETE FROM auth.users WHERE deleted_at IS NOT NULL;


-- ── 3. generate_team_password() ───────────────────────────────────────────────
-- Returns a clean 12-char alphanumeric password, e.g.  "aB3kP9mXqT2n"
CREATE OR REPLACE FUNCTION public.generate_team_password()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = extensions
AS $$
  SELECT substring(
    regexp_replace(
      encode(extensions.gen_random_bytes(24), 'base64'),
      '[^a-zA-Z0-9]', '', 'g'
    ),
    1, 12
  );
$$;


-- ── 4. safe_insert_identity() ─────────────────────────────────────────────────
-- Inserts into auth.identities handling BOTH id column types:
--   • Newer Supabase  →  id UUID
--   • Older Supabase  →  id TEXT
-- This fixes the "Database error querying schema" on signInWithPassword.
CREATE OR REPLACE FUNCTION public.safe_insert_identity(p_user_id UUID, p_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
BEGIN
  -- Try UUID first (newer Supabase)
  BEGIN
    EXECUTE $sql$
      INSERT INTO auth.identities
        (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      VALUES
        ($1::uuid, $2, $3,
         jsonb_build_object('sub',$2::text,'email',$3,'email_verified',true,'provider_id',$3),
         'email', now(), now(), now())
    $sql$ USING p_user_id, p_user_id, p_email;
    RETURN;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- Fallback: TEXT (older Supabase)
  BEGIN
    EXECUTE $sql$
      INSERT INTO auth.identities
        (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      VALUES
        ($1::text, $2, $3,
         jsonb_build_object('sub',$2::text,'email',$3,'email_verified',true,'provider_id',$3),
         'email', now(), now(), now())
    $sql$ USING p_user_id, p_user_id, p_email;
    RETURN;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'safe_insert_identity failed: %', SQLERRM;
  END;
END;
$$;


-- ── 5. create_team_member(p_display_name, p_role) ────────────────────────────
-- • Caller just passes a full name + role.
-- • Username auto-generated from first name  (fahad → fahad1 → fahad2 …)
-- • Password auto-generated  (12-char alphanumeric)
-- • Returns JSON  { "username": "...", "password": "..." }  — shown ONCE to owner.
DROP FUNCTION IF EXISTS public.create_team_member(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.create_team_member(
  p_display_name TEXT,
  p_role         TEXT    -- 'employee' | 'manager'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_company_id    UUID;
  v_caller_role   TEXT;
  v_base_username TEXT;
  v_username      TEXT;
  v_suffix        INT  := 0;
  v_password      TEXT;
  v_email         TEXT;
  v_user_id       UUID;
BEGIN

  -- 1. Verify caller
  SELECT company_id, role INTO v_company_id, v_caller_role
    FROM public.profiles WHERE id = auth.uid();

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'You must be logged in to create team members.';
  END IF;
  IF v_caller_role NOT IN ('owner','manager','admin','super_admin') THEN
    RAISE EXCEPTION 'Only owners and managers can add team members.';
  END IF;

  -- 2. Validate inputs
  IF p_role NOT IN ('manager','employee') THEN
    RAISE EXCEPTION 'Invalid role "%". Must be manager or employee.', p_role;
  END IF;
  IF p_role = 'manager' AND v_caller_role NOT IN ('owner','admin','super_admin') THEN
    RAISE EXCEPTION 'Only owners can create managers.';
  END IF;
  IF p_display_name IS NULL OR trim(p_display_name) = '' THEN
    RAISE EXCEPTION 'Display name cannot be empty.';
  END IF;

  -- 3. Auto-generate username  ("Fahad Khan" → "fahad", "fahad1", "fahad2" …)
  v_base_username := lower(
    regexp_replace(split_part(trim(p_display_name),' ',1), '[^a-z0-9]','','g')
  );
  IF v_base_username = '' THEN v_base_username := 'user'; END IF;
  v_username := v_base_username;

  WHILE EXISTS (
    SELECT 1 FROM public.profiles
     WHERE username = v_username AND company_id = v_company_id
  ) LOOP
    v_suffix   := v_suffix + 1;
    v_username := v_base_username || v_suffix::text;
  END LOOP;

  -- 4. Auto-generate password
  v_password := public.generate_team_password();
  WHILE length(v_password) < 8 LOOP
    v_password := v_password || public.generate_team_password();
  END LOOP;
  v_password := substring(v_password, 1, 12);

  -- 5. Build synthetic email
  v_email := v_username || '@' || replace(v_company_id::text,'-','') || '.internal';

  -- 6. Hard-delete any existing auth rows with this email (prevent duplicate errors)
  DELETE FROM auth.identities
    WHERE user_id IN (SELECT id FROM auth.users WHERE email = v_email);
  DELETE FROM auth.users WHERE email = v_email;

  -- 7. Create auth.users row
  v_user_id := extensions.gen_random_uuid();

  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_user_meta_data, raw_app_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token,
    is_sso_user, is_super_admin
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id, 'authenticated', 'authenticated', v_email,
    extensions.crypt(v_password, extensions.gen_salt('bf')),
    now(),
    jsonb_build_object('full_name', p_display_name, 'is_team_member', true),
    '{"provider":"email","providers":["email"]}'::jsonb,
    now(), now(), '', '', false, false
  );

  -- 8. Create auth.identities row (CRITICAL — fixes "Database error querying schema")
  PERFORM public.safe_insert_identity(v_user_id, v_email);

  -- 9. Create profiles row
  INSERT INTO public.profiles (id, full_name, role, company_id, onboarded, username)
  VALUES (v_user_id, p_display_name, p_role, v_company_id, true, v_username)
  ON CONFLICT (id) DO UPDATE
    SET full_name  = EXCLUDED.full_name,
        role       = EXCLUDED.role,
        company_id = EXCLUDED.company_id,
        onboarded  = true,
        username   = EXCLUDED.username;

  -- 10. Return credentials (owner sees this ONCE — never stored in plaintext)
  RETURN json_build_object('username', v_username, 'password', v_password);

EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Conflict creating user. Please try again.';
END;
$$;


-- ── 6. reset_team_password(p_user_id) ────────────────────────────────────────
-- Owner rolls a new password for any team member.
-- Returns { "username": "...", "password": "..." }
DROP FUNCTION IF EXISTS public.reset_team_password(UUID);

CREATE OR REPLACE FUNCTION public.reset_team_password(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_company_id  UUID;
  v_caller_role TEXT;
  v_member      RECORD;
  v_password    TEXT;
BEGIN
  SELECT company_id, role INTO v_company_id, v_caller_role
    FROM public.profiles WHERE id = auth.uid();

  IF v_caller_role NOT IN ('owner','admin','super_admin') THEN
    RAISE EXCEPTION 'Only owners can reset passwords.';
  END IF;

  SELECT username, full_name INTO v_member
    FROM public.profiles
   WHERE id = p_user_id AND company_id = v_company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Team member not found in your company.';
  END IF;

  v_password := public.generate_team_password();
  WHILE length(v_password) < 8 LOOP
    v_password := v_password || public.generate_team_password();
  END LOOP;
  v_password := substring(v_password, 1, 12);

  UPDATE auth.users
     SET encrypted_password = extensions.crypt(v_password, extensions.gen_salt('bf')),
         updated_at = now()
   WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auth account not found. Re-create this member.';
  END IF;

  RETURN json_build_object('username', v_member.username, 'password', v_password);
END;
$$;


-- ── 7. delete_team_member(p_user_id) ─────────────────────────────────────────
DROP FUNCTION IF EXISTS public.delete_team_member(UUID);

CREATE OR REPLACE FUNCTION public.delete_team_member(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_company_id  UUID;
  v_caller_role TEXT;
BEGIN
  SELECT company_id, role INTO v_company_id, v_caller_role
    FROM public.profiles WHERE id = auth.uid();

  IF v_caller_role NOT IN ('owner','admin','super_admin') THEN
    RAISE EXCEPTION 'Only owners can remove team members.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_user_id AND company_id = v_company_id
  ) THEN
    RAISE EXCEPTION 'Team member not found in your company.';
  END IF;

  DELETE FROM auth.identities WHERE user_id = p_user_id;
  DELETE FROM auth.users       WHERE id     = p_user_id;
  -- profiles deleted automatically via ON DELETE CASCADE
END;
$$;


-- ── 8. get_team_members() ─────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_team_members();

CREATE OR REPLACE FUNCTION public.get_team_members()
RETURNS TABLE (id UUID, full_name TEXT, username TEXT, role TEXT, avatar_url TEXT, created_at TIMESTAMPTZ)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.username, p.role, p.avatar_url, p.created_at
    FROM public.profiles p
   WHERE p.company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
     AND p.id <> auth.uid()
   ORDER BY p.created_at ASC;
$$;


-- ── 9. resolve_team_login(p_username, p_company_name) ────────────────────────
-- Called before signInWithPassword — resolves the synthetic email.
-- Must be accessible by anon users (not yet logged in).
DROP FUNCTION IF EXISTS public.resolve_team_login(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.resolve_team_login(p_username TEXT, p_company_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_user_id    UUID;
  v_email      TEXT;
BEGIN
  SELECT id INTO v_company_id
    FROM public.companies
   WHERE lower(trim(name)) = lower(trim(p_company_name))
   LIMIT 1;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Company not found. Check the company name and try again.';
  END IF;

  v_email := lower(trim(p_username)) || '@' || replace(v_company_id::text,'-','') || '.internal';

  SELECT id INTO v_user_id
    FROM public.profiles
   WHERE username = lower(trim(p_username)) AND company_id = v_company_id
   LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid username or company name.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = v_user_id AND email = v_email AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'This account is inactive. Contact your company owner.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'Account setup incomplete. Ask your owner to re-create your account.';
  END IF;

  RETURN v_email;
END;
$$;


-- ── 10. Permissions ───────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.generate_team_password()             TO authenticated;
GRANT EXECUTE ON FUNCTION public.safe_insert_identity(UUID, TEXT)     TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_team_member(TEXT, TEXT)       TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_team_password(UUID)            TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_team_member(UUID)             TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_members()                   TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_team_login(TEXT, TEXT)       TO anon;
GRANT EXECUTE ON FUNCTION public.resolve_team_login(TEXT, TEXT)       TO authenticated;


-- ── 11. Force PostgREST to reload schema cache ────────────────────────────────
-- This fixes "Could not find the function in the schema cache" immediately.
NOTIFY pgrst, 'reload schema';


-- =============================================================================
-- ✅ DONE — All functions created and schema cache reloaded.
-- =============================================================================
