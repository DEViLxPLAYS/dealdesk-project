-- =============================================================================
-- DEAL DESK — TEAM MEMBER SQL  (Paste ALL of this into Supabase SQL Editor → Run)
-- =============================================================================
-- Fixes: "Could not find function public.create_team_member in the schema cache"
-- =============================================================================


-- ── STEP 1: Extensions ────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ── STEP 2: Add username column (safe — skips if already exists) ──────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- Unique username per company (partial index — ignores NULLs)
DROP INDEX IF EXISTS profiles_username_company_idx;
CREATE UNIQUE INDEX profiles_username_company_idx
  ON public.profiles (company_id, username)
  WHERE username IS NOT NULL;


-- ── STEP 3: Clean ghost auth rows (prevents duplicate-key on re-create) ───────
DELETE FROM auth.identities
  WHERE user_id IN (SELECT id FROM auth.users WHERE deleted_at IS NOT NULL);
DELETE FROM auth.users WHERE deleted_at IS NOT NULL;


-- ── STEP 4: Password generator ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.generate_team_password()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT substring(
    regexp_replace(
      encode(gen_random_bytes(24), 'base64'),
      '[^a-zA-Z0-9]', '', 'g'
    ),
    1, 12
  );
$$;


-- ── STEP 5: Safe identity insert (handles UUID vs TEXT id column) ─────────────
CREATE OR REPLACE FUNCTION public.safe_insert_identity(p_user_id UUID, p_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Try UUID id first (newer Supabase projects)
  BEGIN
    EXECUTE format(
      'INSERT INTO auth.identities
         (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
       VALUES (%L::uuid, %L, %L,
         jsonb_build_object(''sub'',%L,''email'',%L,''email_verified'',true,''provider_id'',%L),
         ''email'', now(), now(), now())',
      p_user_id, p_user_id, p_email, p_user_id, p_email, p_email
    );
    RETURN;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- Fallback: TEXT id (older Supabase projects)
  BEGIN
    EXECUTE format(
      'INSERT INTO auth.identities
         (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
       VALUES (%L::text, %L, %L,
         jsonb_build_object(''sub'',%L,''email'',%L,''email_verified'',true,''provider_id'',%L),
         ''email'', now(), now(), now())',
      p_user_id, p_user_id, p_email, p_user_id, p_email, p_email
    );
    RETURN;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Could not insert auth.identities: %', SQLERRM;
  END;
END;
$$;


-- ── STEP 6: CREATE TEAM MEMBER ────────────────────────────────────────────────
-- Owner types a name → username + password auto-generated → returned as JSON.
-- Password NEVER stored in plaintext.
DROP FUNCTION IF EXISTS public.create_team_member(TEXT, TEXT);

CREATE FUNCTION public.create_team_member(
  p_display_name TEXT,
  p_role         TEXT    -- 'employee' | 'manager'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company_id    UUID;
  v_caller_role   TEXT;
  v_base          TEXT;
  v_username      TEXT;
  v_suffix        INT := 0;
  v_password      TEXT;
  v_email         TEXT;
  v_user_id       UUID;
BEGIN

  -- Who is calling?
  SELECT company_id, role
    INTO v_company_id, v_caller_role
    FROM public.profiles
   WHERE id = auth.uid();

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated.';
  END IF;

  IF v_caller_role NOT IN ('owner','manager','admin','super_admin') THEN
    RAISE EXCEPTION 'Only owners/managers can add team members.';
  END IF;

  -- Validate inputs
  IF p_role NOT IN ('employee','manager') THEN
    RAISE EXCEPTION 'Role must be employee or manager.';
  END IF;
  IF p_role = 'manager' AND v_caller_role NOT IN ('owner','admin','super_admin') THEN
    RAISE EXCEPTION 'Only owners can create managers.';
  END IF;
  IF trim(coalesce(p_display_name,'')) = '' THEN
    RAISE EXCEPTION 'Name cannot be empty.';
  END IF;

  -- Auto-generate username from first name
  -- "Fahad Khan" → "fahad", "fahad1", "fahad2" …
  v_base := lower(regexp_replace(split_part(trim(p_display_name),' ',1), '[^a-z0-9]','','g'));
  IF v_base = '' THEN v_base := 'user'; END IF;
  v_username := v_base;

  WHILE EXISTS (
    SELECT 1 FROM public.profiles
     WHERE username = v_username AND company_id = v_company_id
  ) LOOP
    v_suffix   := v_suffix + 1;
    v_username := v_base || v_suffix;
  END LOOP;

  -- Auto-generate password
  v_password := public.generate_team_password();
  WHILE length(v_password) < 8 LOOP
    v_password := v_password || public.generate_team_password();
  END LOOP;
  v_password := substring(v_password, 1, 12);

  -- Synthetic email (never shown to anyone, only used internally)
  v_email := v_username || '@' || replace(v_company_id::text,'-','') || '.internal';

  -- Clean up any existing ghost rows for this email
  DELETE FROM auth.identities
    WHERE user_id IN (SELECT id FROM auth.users WHERE email = v_email);
  DELETE FROM auth.users WHERE email = v_email;

  -- Create auth user
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

  -- Create identity row (required by GoTrue for signInWithPassword)
  PERFORM public.safe_insert_identity(v_user_id, v_email);

  -- Create profile
  INSERT INTO public.profiles (id, full_name, role, company_id, onboarded, username)
  VALUES (v_user_id, p_display_name, p_role, v_company_id, true, v_username)
  ON CONFLICT (id) DO UPDATE
    SET full_name  = EXCLUDED.full_name,
        role       = EXCLUDED.role,
        company_id = EXCLUDED.company_id,
        onboarded  = true,
        username   = EXCLUDED.username;

  -- Return credentials to owner (shown once only)
  RETURN json_build_object('username', v_username, 'password', v_password);

EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Conflict — please try again.';
END;
$$;


-- ── STEP 7: RESET TEAM PASSWORD ───────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.reset_team_password(UUID);

CREATE FUNCTION public.reset_team_password(p_user_id UUID)
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
    FROM public.profiles
   WHERE id = p_user_id AND company_id = v_company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found in your company.';
  END IF;

  v_password := public.generate_team_password();
  WHILE length(v_password) < 8 LOOP
    v_password := v_password || public.generate_team_password();
  END LOOP;
  v_password := substring(v_password, 1, 12);

  UPDATE auth.users
     SET encrypted_password = crypt(v_password, gen_salt('bf')),
         updated_at = now()
   WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auth account not found — re-create this member.';
  END IF;

  RETURN json_build_object('username', v_member.username, 'password', v_password);
END;
$$;


-- ── STEP 8: DELETE TEAM MEMBER ────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.delete_team_member(UUID);

CREATE FUNCTION public.delete_team_member(p_user_id UUID)
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

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_user_id AND company_id = v_company_id
  ) THEN
    RAISE EXCEPTION 'Member not found in your company.';
  END IF;

  DELETE FROM auth.identities WHERE user_id = p_user_id;
  DELETE FROM auth.users       WHERE id     = p_user_id;
END;
$$;


-- ── STEP 9: GET TEAM MEMBERS ──────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_team_members();

CREATE FUNCTION public.get_team_members()
RETURNS TABLE (id UUID, full_name TEXT, username TEXT, role TEXT, avatar_url TEXT, created_at TIMESTAMPTZ)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT p.id, p.full_name, p.username, p.role, p.avatar_url, p.created_at
    FROM public.profiles p
   WHERE p.company_id = (
     SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1
   )
     AND p.id <> auth.uid()
   ORDER BY p.created_at ASC;
$$;


-- ── STEP 10: RESOLVE TEAM LOGIN ───────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.resolve_team_login(TEXT, TEXT);

CREATE FUNCTION public.resolve_team_login(p_username TEXT, p_company_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
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
    RAISE EXCEPTION 'Company not found.';
  END IF;

  v_email := lower(trim(p_username)) || '@' || replace(v_company_id::text,'-','') || '.internal';

  SELECT id INTO v_user_id
    FROM public.profiles
   WHERE username = lower(trim(p_username)) AND company_id = v_company_id
   LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid username or company.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = v_user_id AND email = v_email AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Account inactive. Contact your owner.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'Account setup incomplete. Ask your owner to re-create your account.';
  END IF;

  RETURN v_email;
END;
$$;


-- ── STEP 11: Grant permissions ────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.generate_team_password()           TO authenticated;
GRANT EXECUTE ON FUNCTION public.safe_insert_identity(UUID, TEXT)   TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_team_member(TEXT, TEXT)     TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_team_password(UUID)          TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_team_member(UUID)           TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_members()                 TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_team_login(TEXT, TEXT)     TO anon;
GRANT EXECUTE ON FUNCTION public.resolve_team_login(TEXT, TEXT)     TO authenticated;


-- ── STEP 12: Force PostgREST schema cache reload ──────────────────────────────
NOTIFY pgrst, 'reload schema';

-- ✅ Done! Functions created and schema cache reloaded.
