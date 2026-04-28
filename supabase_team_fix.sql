-- =============================================================================
-- Deal Desk — TEAM MEMBER SYSTEM (Auto-Generated Credentials) v3
-- =============================================================================
-- Features:
--   ✅ Owner just enters a NAME — username + password are AUTO-GENERATED
--   ✅ Owner can RESET (roll) any member's password anytime
--   ✅ Fixes "Database error querying schema" (auth.identities row included)
--   ✅ Fixes "duplicate key constraint" (hard-deletes ghost rows before insert)
--   ✅ Handles both UUID and TEXT type for auth.identities.id column
--   ✅ Passwords are bcrypt-hashed via pgcrypto
--   ✅ Returned JSON: { username, password } — shown ONCE to owner, never stored plain
--
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → New Query → Paste entire file → Run
-- =============================================================================


-- =============================================================================
-- STEP 0 — Extensions
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;


-- =============================================================================
-- STEP 1 — Schema: username column + unique index + role constraint
-- =============================================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;

DROP INDEX IF EXISTS profiles_username_company_idx;
CREATE UNIQUE INDEX profiles_username_company_idx
  ON profiles (company_id, username)
  WHERE username IS NOT NULL;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('owner', 'admin', 'manager', 'employee', 'super_admin'));


-- =============================================================================
-- STEP 2 — ONE-TIME CLEANUP: Hard-delete all soft-deleted ghost auth rows
--   GoTrue soft-deletes users (sets deleted_at). Ghost rows block re-creation
--   with the same email. Hard-delete them now.
-- =============================================================================
DELETE FROM auth.identities
  WHERE user_id IN (SELECT id FROM auth.users WHERE deleted_at IS NOT NULL);

DELETE FROM auth.users WHERE deleted_at IS NOT NULL;


-- =============================================================================
-- STEP 3 — Helper: generate_team_password()
--   Returns a clean 12-char alphanumeric password (no special chars).
--   Example output: "aB3kP9mXqT2n"
-- =============================================================================
CREATE OR REPLACE FUNCTION generate_team_password()
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


-- =============================================================================
-- STEP 4 — safe_insert_identity(p_user_id, p_email)
--   Inserts into auth.identities while gracefully handling BOTH column types:
--     • Old Supabase: id = TEXT
--     • New Supabase: id = UUID
--   Uses dynamic SQL to avoid compile-time type errors.
-- =============================================================================
CREATE OR REPLACE FUNCTION safe_insert_identity(p_user_id UUID, p_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
BEGIN
  -- Try UUID insert first (newer Supabase)
  BEGIN
    EXECUTE '
      INSERT INTO auth.identities (
        id, user_id, provider_id, identity_data,
        provider, last_sign_in_at, created_at, updated_at
      ) VALUES (
        $1::uuid, $2, $3,
        jsonb_build_object(
          ''sub'',            $2::text,
          ''email'',          $3,
          ''email_verified'', true,
          ''provider_id'',    $3
        ),
        ''email'', now(), now(), now()
      )
    ' USING p_user_id, p_user_id, p_email;
    RETURN;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- fall through to TEXT insert
  END;

  -- Fallback: TEXT insert (older Supabase)
  BEGIN
    EXECUTE '
      INSERT INTO auth.identities (
        id, user_id, provider_id, identity_data,
        provider, last_sign_in_at, created_at, updated_at
      ) VALUES (
        $1::text, $2, $3,
        jsonb_build_object(
          ''sub'',            $2::text,
          ''email'',          $3,
          ''email_verified'', true,
          ''provider_id'',    $3
        ),
        ''email'', now(), now(), now()
      )
    ' USING p_user_id, p_user_id, p_email;
    RETURN;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to insert auth.identities row: %', SQLERRM;
  END;
END;
$$;


-- =============================================================================
-- STEP 5 — create_team_member(p_display_name, p_role)
--   • Auto-generates username from first name (fahad, fahad1, fahad2, …)
--   • Auto-generates a secure 12-char alphanumeric password
--   • Returns JSON: { "username": "...", "password": "..." }
--   • Only the calling owner sees this — password is NEVER stored in plaintext
-- =============================================================================
CREATE OR REPLACE FUNCTION create_team_member(
  p_display_name TEXT,
  p_role         TEXT   -- 'manager' | 'employee'
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

  -- ── 1. Verify caller is authenticated ───────────────────────────────────────
  SELECT company_id, role
    INTO v_company_id, v_caller_role
    FROM profiles
   WHERE id = auth.uid();

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'You must be logged in to create team members.';
  END IF;

  IF v_caller_role NOT IN ('owner', 'manager', 'admin', 'super_admin') THEN
    RAISE EXCEPTION 'Insufficient permissions. Only owners and managers can add team members.';
  END IF;

  -- ── 2. Validate role ────────────────────────────────────────────────────────
  IF p_role NOT IN ('manager', 'employee') THEN
    RAISE EXCEPTION 'Invalid role "%". Must be "manager" or "employee".', p_role;
  END IF;

  IF p_role = 'manager' AND v_caller_role NOT IN ('owner', 'admin', 'super_admin') THEN
    RAISE EXCEPTION 'Only company owners can create managers.';
  END IF;

  IF p_display_name IS NULL OR trim(p_display_name) = '' THEN
    RAISE EXCEPTION 'Display name cannot be empty.';
  END IF;

  -- ── 3. Auto-generate username from first name ───────────────────────────────
  --    "Fahad Khan" → "fahad", then "fahad1", "fahad2" if taken
  v_base_username := lower(
    regexp_replace(
      split_part(trim(p_display_name), ' ', 1),
      '[^a-z0-9]', '', 'g'
    )
  );

  IF v_base_username = '' THEN
    v_base_username := 'user';
  END IF;

  v_username := v_base_username;

  WHILE EXISTS (
    SELECT 1 FROM profiles
     WHERE username   = v_username
       AND company_id = v_company_id
  ) LOOP
    v_suffix   := v_suffix + 1;
    v_username := v_base_username || v_suffix::text;
  END LOOP;

  -- ── 4. Auto-generate a clean 12-char alphanumeric password ─────────────────
  v_password := generate_team_password();

  -- Guard against extremely rare short results
  WHILE length(v_password) < 8 LOOP
    v_password := v_password || generate_team_password();
  END LOOP;
  v_password := substring(v_password, 1, 12);

  -- ── 5. Build synthetic internal email ──────────────────────────────────────
  --    Format: username@<company_id_no_dashes>.internal
  v_email := v_username
             || '@'
             || replace(v_company_id::text, '-', '')
             || '.internal';

  -- ── 6. Hard-delete any existing auth rows with this email ──────────────────
  --    Cleans up soft-deleted GoTrue ghost rows that block re-creation
  DELETE FROM auth.identities
   WHERE user_id IN (SELECT id FROM auth.users WHERE email = v_email);
  DELETE FROM auth.users WHERE email = v_email;

  -- ── 7. Insert into auth.users ───────────────────────────────────────────────
  v_user_id := extensions.gen_random_uuid();

  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    is_sso_user,
    is_super_admin
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    extensions.crypt(v_password, extensions.gen_salt('bf')),
    now(),   -- pre-confirmed, no email needed for team members
    jsonb_build_object('full_name', p_display_name, 'is_team_member', true),
    '{"provider":"email","providers":["email"]}'::jsonb,
    now(),
    now(),
    '',
    '',
    false,
    false
  );

  -- ── 8. Insert into auth.identities ─────────────────────────────────────────
  --    CRITICAL: GoTrue requires this row or signInWithPassword crashes with
  --    "Database error querying schema". Uses safe_insert_identity() which
  --    handles both UUID and TEXT id column types across Supabase versions.
  PERFORM safe_insert_identity(v_user_id, v_email);

  -- ── 9. Insert public.profiles row ───────────────────────────────────────────
  INSERT INTO profiles (
    id,
    full_name,
    role,
    company_id,
    onboarded,
    username
  )
  VALUES (
    v_user_id,
    p_display_name,
    p_role,
    v_company_id,
    true,
    v_username
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name  = EXCLUDED.full_name,
        role       = EXCLUDED.role,
        company_id = EXCLUDED.company_id,
        onboarded  = true,
        username   = EXCLUDED.username;

  -- ── 10. Return credentials to caller (ONLY the owner sees this) ─────────────
  --    Password is shown once — owner must copy it for the team member.
  RETURN json_build_object(
    'username', v_username,
    'password', v_password
  );

EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'A conflict occurred. Please try again or use a different name.';
END;
$$;


-- =============================================================================
-- STEP 6 — reset_team_password(p_user_id)
--   Owner can roll any team member's password at any time.
--   Returns JSON: { "username": "...", "password": "..." }
--   Only the calling owner sees the new password — NEVER stored in plaintext.
-- =============================================================================
CREATE OR REPLACE FUNCTION reset_team_password(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_company_id   UUID;
  v_caller_role  TEXT;
  v_member       RECORD;
  v_new_password TEXT;
BEGIN

  -- ── Verify caller is an owner ───────────────────────────────────────────────
  SELECT company_id, role
    INTO v_company_id, v_caller_role
    FROM profiles
   WHERE id = auth.uid();

  IF v_caller_role NOT IN ('owner', 'admin', 'super_admin') THEN
    RAISE EXCEPTION 'Only owners can reset team member passwords.';
  END IF;

  -- ── Verify member belongs to this company ───────────────────────────────────
  SELECT p.username, p.full_name
    INTO v_member
    FROM profiles p
   WHERE p.id = p_user_id AND p.company_id = v_company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Team member not found in your company.';
  END IF;

  -- ── Generate a new secure password ─────────────────────────────────────────
  v_new_password := generate_team_password();
  WHILE length(v_new_password) < 8 LOOP
    v_new_password := v_new_password || generate_team_password();
  END LOOP;
  v_new_password := substring(v_new_password, 1, 12);

  -- ── Update encrypted_password in auth.users ─────────────────────────────────
  UPDATE auth.users
     SET encrypted_password = extensions.crypt(v_new_password, extensions.gen_salt('bf')),
         updated_at          = now()
   WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auth account not found. Please delete and re-create this member.';
  END IF;

  RETURN json_build_object(
    'username', v_member.username,
    'password', v_new_password
  );
END;
$$;


-- =============================================================================
-- STEP 7 — delete_team_member(p_user_id)
-- =============================================================================
CREATE OR REPLACE FUNCTION delete_team_member(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_company_id  UUID;
  v_caller_role TEXT;
BEGIN
  SELECT company_id, role
    INTO v_company_id, v_caller_role
    FROM profiles
   WHERE id = auth.uid();

  IF v_caller_role NOT IN ('owner', 'admin', 'super_admin') THEN
    RAISE EXCEPTION 'Only owners can remove team members.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM profiles
     WHERE id = p_user_id AND company_id = v_company_id
  ) THEN
    RAISE EXCEPTION 'Team member not found in your company.';
  END IF;

  DELETE FROM auth.identities WHERE user_id = p_user_id;
  DELETE FROM auth.users       WHERE id     = p_user_id;
  -- profiles row removed automatically via ON DELETE CASCADE
END;
$$;


-- =============================================================================
-- STEP 8 — get_team_members()
-- =============================================================================
CREATE OR REPLACE FUNCTION get_team_members()
RETURNS TABLE (
  id         UUID,
  full_name  TEXT,
  username   TEXT,
  role       TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    p.id,
    p.full_name,
    p.username,
    p.role,
    p.avatar_url,
    p.created_at
  FROM profiles p
  WHERE p.company_id = (
    SELECT company_id FROM profiles WHERE id = auth.uid() LIMIT 1
  )
    AND p.id <> auth.uid()
  ORDER BY p.created_at ASC;
$$;


-- =============================================================================
-- STEP 9 — resolve_team_login(p_username, p_company_name)
--   Called BEFORE signInWithPassword to resolve the synthetic email.
--   Must be callable by anon (unauthenticated) users.
-- =============================================================================
CREATE OR REPLACE FUNCTION resolve_team_login(
  p_username     TEXT,
  p_company_name TEXT
)
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
  -- Find company by name (case-insensitive)
  SELECT id INTO v_company_id
    FROM companies
   WHERE lower(trim(name)) = lower(trim(p_company_name))
   LIMIT 1;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Company not found. Check the company name and try again.';
  END IF;

  -- Build synthetic email
  v_email := lower(trim(p_username))
             || '@'
             || replace(v_company_id::text, '-', '')
             || '.internal';

  -- Find user in profiles
  SELECT id INTO v_user_id
    FROM profiles
   WHERE username   = lower(trim(p_username))
     AND company_id = v_company_id
   LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid username or company name.';
  END IF;

  -- Verify auth.users row is active
  IF NOT EXISTS (
    SELECT 1 FROM auth.users
     WHERE id = v_user_id AND email = v_email AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'This account is inactive. Contact your company owner.';
  END IF;

  -- Verify auth.identities row exists (required for GoTrue signInWithPassword)
  IF NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Account setup incomplete. Ask your owner to reset your password or re-create your account.';
  END IF;

  RETURN v_email;
END;
$$;


-- =============================================================================
-- STEP 10 — Grant permissions
-- =============================================================================
GRANT EXECUTE ON FUNCTION generate_team_password()               TO authenticated;
GRANT EXECUTE ON FUNCTION safe_insert_identity(UUID, TEXT)       TO authenticated;
GRANT EXECUTE ON FUNCTION create_team_member(TEXT, TEXT)         TO authenticated;
GRANT EXECUTE ON FUNCTION reset_team_password(UUID)              TO authenticated;
GRANT EXECUTE ON FUNCTION delete_team_member(UUID)               TO authenticated;
GRANT EXECUTE ON FUNCTION get_team_members()                     TO authenticated;
GRANT EXECUTE ON FUNCTION resolve_team_login(TEXT, TEXT)         TO anon;
GRANT EXECUTE ON FUNCTION resolve_team_login(TEXT, TEXT)         TO authenticated;


-- =============================================================================
-- DONE ✅
-- Run in Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- =============================================================================
