'use strict';

const { createClient } = require('@supabase/supabase-js');
const config           = require('../config');

// ── Public (anon) client ─ used for user-scoped operations ──────────────────
const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      autoRefreshToken:  true,
      persistSession:    false,   // server-side; session handled per-request
      detectSessionInUrl: false,
    },
  }
);

// ── Admin (service-role) client ─ bypasses RLS ──────────────────────────────
const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken:  false,
      persistSession:    false,
    },
  }
);

module.exports = { supabase, supabaseAdmin };
