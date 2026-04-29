'use strict';

const { supabaseAdmin } = require('../config/supabase');
const { ApiError, sendSuccess } = require('../utils/apiResponse');

const getSettings = async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .select('id, name, email, phone, address, website, logo_url, currency, timezone')
    .eq('id', req.company_id)
    .single();
  if (error || !data) throw ApiError.notFound('Company settings not found');
  sendSuccess(res, data, 'Settings fetched');
};

const updateSettings = async (req, res) => {
  const { name, email, phone, address, website, currency, timezone } = req.body;
  const { data, error } = await supabaseAdmin
    .from('companies')
    .update({ name, email, phone, address, website, currency, timezone, updated_at: new Date().toISOString() })
    .eq('id', req.company_id)
    .select()
    .single();
  if (error || !data) throw ApiError.internal('Failed to update settings');
  sendSuccess(res, data, 'Settings updated');
};

module.exports = { getSettings, updateSettings };
