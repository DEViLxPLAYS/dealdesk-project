'use strict';

const bcrypt                   = require('bcryptjs');
const { supabase, supabaseAdmin } = require('../config/supabase');
const { generateTokenPair, verifyToken } = require('../utils/jwt');
const { sendWelcomeEmail }     = require('../utils/email');
const { ApiError, sendSuccess, sendCreated } = require('../utils/apiResponse');
const config                   = require('../config');

// ── Register ────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  const { email, password, full_name, company_name } = req.body;

  // Create user in Supabase Auth
  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (authErr) throw ApiError.conflict(authErr.message);

  const userId = authData.user.id;

  // Create company
  const { data: company, error: compErr } = await supabaseAdmin
    .from('companies')
    .insert({ name: company_name, created_by: userId })
    .select('id')
    .single();
  if (compErr) throw ApiError.internal('Failed to create company');

  // Create profile
  await supabaseAdmin.from('profiles').insert({
    id:         userId,
    full_name,
    email,
    role:       'owner',
    company_id: company.id,
  });

  await sendWelcomeEmail(email, full_name).catch(() => {});

  const tokens = generateTokenPair({ sub: userId, role: 'owner', company_id: company.id });
  sendCreated(res, { user: { id: userId, email, full_name, role: 'owner' }, ...tokens }, 'Registration successful');
};

// ── Login ────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw ApiError.unauthorized('Invalid email or password');

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, role, company_id, username')
    .eq('id', data.user.id)
    .single();

  const tokens = generateTokenPair({
    sub:        profile.id,
    role:       profile.role,
    company_id: profile.company_id,
  });

  sendSuccess(res, {
    user: profile,
    ...tokens,
  }, 'Login successful');
};

// ── Team Login (username + company_id + password) ────────────────────────────
const teamLogin = async (req, res) => {
  const { company_id, username, password } = req.body;

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, role, company_id, username, password_hash')
    .eq('company_id', company_id)
    .eq('username', username)
    .single();

  if (error || !profile) throw ApiError.unauthorized('Invalid credentials');

  const match = await bcrypt.compare(password, profile.password_hash || '');
  if (!match) throw ApiError.unauthorized('Invalid credentials');

  const tokens = generateTokenPair({
    sub:        profile.id,
    role:       profile.role,
    company_id: profile.company_id,
  });

  sendSuccess(res, {
    user: { id: profile.id, full_name: profile.full_name, role: profile.role, company_id: profile.company_id },
    ...tokens,
  }, 'Team login successful');
};

// ── Refresh Token ────────────────────────────────────────────────────────────
const refreshToken = async (req, res) => {
  const { refreshToken: token } = req.body;
  if (!token) throw ApiError.badRequest('Refresh token required');

  const decoded = verifyToken(token, config.jwt.refreshSecret);

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, role, company_id')
    .eq('id', decoded.sub)
    .single();
  if (!profile) throw ApiError.unauthorized();

  const tokens = generateTokenPair({ sub: profile.id, role: profile.role, company_id: profile.company_id });
  sendSuccess(res, tokens, 'Token refreshed');
};

// ── Me ───────────────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  sendSuccess(res, { user: req.user }, 'Profile fetched');
};

// ── Logout (stateless JWT; client drops tokens) ──────────────────────────────
const logout = (_req, res) => {
  sendSuccess(res, {}, 'Logged out successfully');
};

module.exports = { register, login, teamLogin, refreshToken, getMe, logout };
