-- ================================================================
-- DEAL DESK (Digital) — TEAM MEMBER FUNCTIONS  ✅ FINAL VERSION
-- Paste into: Supabase Dashboard → SQL Editor → New query → Run
-- ================================================================


-- STEP 1: Enable pgcrypto (REQUIRED for password hashing)
-- This is what was silently failing before — without it, crypt() doesn't exist
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- STEP 2: Add username column (safe with DO block)
DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'username column: %', SQLERRM;
END $$;


-- STEP 3: Unique index on username per company (safe with DO block)
DO $$ BEGIN
  DROP INDEX IF EXISTS profiles_username_company_idx;
  CREATE UNIQUE INDEX profiles_username_company_idx
    ON public.profiles (company_id, username)
    WHERE username IS NOT NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'index: %', SQLERRM;
END $$;


-- STEP 4: Clean ghost auth rows (safe with DO block)
DO $$ BEGIN
  DELETE FROM auth.identities
    WHERE user_id IN (SELECT id FROM auth.users WHERE deleted_at IS NOT NULL);
  DELETE FROM auth.users WHERE deleted_at IS NOT NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'cleanup: %', SQLERRM;
END $$;


-- ================================================================
-- STEP 5: generate_team_password()
-- Using plpgsql (NOT sql) so the body is NOT validated at creation time
-- ================================================================
DROP FUNCTION IF EXISTS public.generate_team_password();
CREATE OR REPLACE FUNCTION public.generate_team_password()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN substring(
    regexp_replace(
      encode(gen_random_bytes(24), 'base64'),
      '[^a-zA-Z0-9]', '', 'g'
    ),
    1, 12
  );
END;
$$;


-- ================================================================
-- STEP 6: create_team_member(p_display_name, p_role)
-- Owner types a name → username + password auto-generated
-- Returns JSON: { "username": "faheem", "password": "aB3kP9mX" }
-- ================================================================
DROP FUNCTION IF EXISTS public.create_team_member(TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.create_team_member(
  p_display_name TEXT,
  p_role         TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company_id  UUID;
  v_caller_role TEXT;
  v_base        TEXT;
  v_username    TEXT;
  v_suffix      INT := 0;
  v_password    TEXT;
  v_email       TEXT;
  v_user_id     UUID;
BEGIN
  -- Verify caller is logged in
  SELECT company_id, role INTO v_company_id, v_caller_role
    FROM public.profiles WHERE id = auth.uid();

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated.';
  END IF;
  IF v_caller_role NOT IN ('owner','manager','admin','super_admin') THEN
    RAISE EXCEPTION 'Only owners and managers can add team members.';
  END IF;
  IF p_role NOT IN ('employee','manager') THEN
    RAISE EXCEPTION 'Role must be employee or manager.';
  END IF;
  IF trim(coalesce(p_display_name,'')) = '' THEN
    RAISE EXCEPTION 'Name cannot be empty.';
  END IF;

  -- Auto-generate username from first name
  -- "Faheem Khan" → "faheem", then "faheem1", "faheem2" if taken
  v_base := lower(regexp_replace(
    split_part(trim(p_display_name), ' ', 1),
    '[^a-z0-9]', '', 'g'
  ));
  IF v_base = '' THEN v_base := 'user'; END IF;
  v_username := v_base;

  WHILE EXISTS (
    SELECT 1 FROM public.profiles
     WHERE username = v_username AND company_id = v_company_id
  ) LOOP
    v_suffix   := v_suffix + 1;
    v_username := v_base || v_suffix;
  END LOOP;

  -- Auto-generate 12-char alphanumeric password
  v_password := public.generate_team_password();
  WHILE length(v_password) < 8 LOOP
    v_password := v_password || public.generate_team_password();
  END LOOP;
  v_password := substring(v_password, 1, 12);

  -- Internal synthetic email (never shown to user)
  v_email := v_username || '@' || replace(v_company_id::text, '-', '') || '.internal';

  -- Remove any old ghost rows for this email
  DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = v_email);
  DELETE FROM auth.users WHERE email = v_email;

  -- Create auth.users row
  v_user_id := gen_random_uuid();
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
    crypt(v_password, gen_salt('bf')),
    now(),
    jsonb_build_object('full_name', p_display_name, 'is_team_member', true),
    '{"provider":"email","providers":["email"]}'::jsonb,
    now(), now(), '', '', false, false
  );

  -- Create auth.identities row
  -- Try UUID id first (newer Supabase), fallback to TEXT (older Supabase)
  BEGIN
    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id, v_user_id, v_email,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email,
                         'email_verified', true, 'provider_id', v_email),
      'email', now(), now(), now()
    );
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id::text, v_user_id, v_email,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email,
                         'email_verified', true, 'provider_id', v_email),
      'email', now(), now(), now()
    );
  END;

  -- Create public.profiles row
  INSERT INTO public.profiles (id, full_name, role, company_id, onboarded, username)
  VALUES (v_user_id, p_display_name, p_role, v_company_id, true, v_username)
  ON CONFLICT (id) DO UPDATE SET
    full_name  = EXCLUDED.full_name,
    role       = EXCLUDED.role,
    company_id = EXCLUDED.company_id,
    onboarded  = true,
    username   = EXCLUDED.username;

  -- Return credentials — shown ONCE to owner, never stored as plaintext
  RETURN json_build_object('username', v_username, 'password', v_password);

EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Conflict — please try again.';
END;
$$;


-- ================================================================
-- STEP 7: reset_team_password(p_user_id)
-- ================================================================
DROP FUNCTION IF EXISTS public.reset_team_password(UUID);
CREATE OR REPLACE FUNCTION public.reset_team_password(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
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
    FROM public.profiles WHERE id = p_user_id AND company_id = v_company_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Member not found.'; END IF;

  v_password := public.generate_team_password();
  WHILE length(v_password) < 8 LOOP
    v_password := v_password || public.generate_team_password();
  END LOOP;
  v_password := substring(v_password, 1, 12);

  UPDATE auth.users
     SET encrypted_password = crypt(v_password, gen_salt('bf')),
         updated_at = now()
   WHERE id = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Auth account not found.'; END IF;

  RETURN json_build_object('username', v_member.username, 'password', v_password);
END;
$$;


-- ================================================================
-- STEP 8: delete_team_member(p_user_id)
-- ================================================================
DROP FUNCTION IF EXISTS public.delete_team_member(UUID);
CREATE OR REPLACE FUNCTION public.delete_team_member(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company_id  UUID;
  v_caller_role TEXT;
BEGIN
  SELECT company_id, role INTO v_company_id, v_caller_role
    FROM public.profiles WHERE id = auth.uid();
  IF v_caller_role NOT IN ('owner','admin','super_admin') THEN
    RAISE EXCEPTION 'Only owners can remove members.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND company_id = v_company_id) THEN
    RAISE EXCEPTION 'Member not found.';
  END IF;
  DELETE FROM auth.identities WHERE user_id = p_user_id;
  DELETE FROM auth.users       WHERE id     = p_user_id;
END;
$$;


-- ================================================================
-- STEP 9: get_team_members()
-- ================================================================
DROP FUNCTION IF EXISTS public.get_team_members();
CREATE OR REPLACE FUNCTION public.get_team_members()
RETURNS TABLE (id UUID, full_name TEXT, username TEXT, role TEXT, avatar_url TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.full_name, p.username, p.role, p.avatar_url, p.created_at
    FROM public.profiles p
   WHERE p.company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
     AND p.id <> auth.uid()
   ORDER BY p.created_at ASC;
END;
$$;


-- ================================================================
-- STEP 10: resolve_team_login(p_username, p_company_name)
-- ================================================================
DROP FUNCTION IF EXISTS public.resolve_team_login(TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.resolve_team_login(p_username TEXT, p_company_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company_id UUID;
  v_user_id    UUID;
  v_email      TEXT;
BEGIN
  SELECT id INTO v_company_id
    FROM public.companies
   WHERE lower(trim(name)) = lower(trim(p_company_name)) LIMIT 1;
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Company not found.';
  END IF;

  v_email := lower(trim(p_username)) || '@' || replace(v_company_id::text, '-', '') || '.internal';

  SELECT id INTO v_user_id
    FROM public.profiles
   WHERE username = lower(trim(p_username)) AND company_id = v_company_id LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid username or company.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id AND email = v_email AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'Account inactive. Contact your owner.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'Account setup incomplete. Ask owner to re-create your account.';
  END IF;

  RETURN v_email;
END;
$$;


-- ================================================================
-- STEP 11: Grant permissions
-- ================================================================
GRANT EXECUTE ON FUNCTION public.generate_team_password()         TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_team_member(TEXT, TEXT)   TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_team_password(UUID)        TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_team_member(UUID)         TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_members()               TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_team_login(TEXT, TEXT)   TO anon;
GRANT EXECUTE ON FUNCTION public.resolve_team_login(TEXT, TEXT)   TO authenticated;


-- STEP 12: Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';

-- ✅ Done. All functions created for Digital / Deal Desk CRM.
