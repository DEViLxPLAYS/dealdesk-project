'use strict';

const bcrypt            = require('bcryptjs');
const { supabaseAdmin } = require('../config/supabase');
const { ApiError, sendSuccess, sendCreated } = require('../utils/apiResponse');
const { randomString }  = require('../utils/helpers');

const listTeam = async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, username, role, created_at')
    .eq('company_id', req.company_id)
    .order('created_at', { ascending: true });
  if (error) throw ApiError.internal(error.message);
  sendSuccess(res, data);
};

const createMember = async (req, res) => {
  const { full_name, username, role, password } = req.body;
  const syntheticEmail = `${username}@${req.company_id}.dealdesk.internal`;
  const rawPassword    = password || randomString(10);
  const password_hash  = await bcrypt.hash(rawPassword, 10);

  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email: syntheticEmail, password: rawPassword, email_confirm: true,
    user_metadata: { full_name },
  });
  if (authErr) throw ApiError.conflict(authErr.message);

  await supabaseAdmin.from('profiles').insert({
    id: authData.user.id, full_name, email: syntheticEmail,
    username, role: role || 'employee', password_hash,
    company_id: req.company_id,
  });

  sendCreated(res, { username, password: rawPassword, role: role || 'employee' }, 'Team member created');
};

const updateMember = async (req, res) => {
  const { role, full_name } = req.body;
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ role, full_name, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('company_id', req.company_id)
    .select('id, full_name, role')
    .single();
  if (error || !data) throw ApiError.notFound('Member not found');
  sendSuccess(res, data, 'Member updated');
};

const resetPassword = async (req, res) => {
  const { new_password } = req.body;
  const hash = await bcrypt.hash(new_password, 10);

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('id').eq('id', req.params.id).eq('company_id', req.company_id).single();
  if (!profile) throw ApiError.notFound('Member not found');

  await supabaseAdmin.auth.admin.updateUserById(profile.id, { password: new_password });
  await supabaseAdmin.from('profiles').update({ password_hash: hash }).eq('id', profile.id);

  sendSuccess(res, {}, 'Password reset successfully');
};

const deleteMember = async (req, res) => {
  const { data: profile } = await supabaseAdmin
    .from('profiles').select('id').eq('id', req.params.id).eq('company_id', req.company_id).single();
  if (!profile) throw ApiError.notFound('Member not found');

  await supabaseAdmin.auth.admin.deleteUser(profile.id);
  await supabaseAdmin.from('profiles').delete().eq('id', profile.id);

  sendSuccess(res, {}, 'Member removed');
};

module.exports = { listTeam, createMember, updateMember, resetPassword, deleteMember };
