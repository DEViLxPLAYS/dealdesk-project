'use strict';

const { supabaseAdmin }  = require('../config/supabase');
const { ApiError, sendSuccess, sendCreated, sendPaginated } = require('../utils/apiResponse');
const { parsePagination, stripUndefined } = require('../utils/helpers');

// ── List Deals ───────────────────────────────────────────────────────────────
const listDeals = async (req, res) => {
  const { page, limit, from, to } = parsePagination(req.query);
  const { stage, search } = req.query;

  let query = supabaseAdmin
    .from('deals')
    .select('*, clients(name, email)', { count: 'exact' })
    .eq('company_id', req.company_id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (stage)  query = query.eq('stage', stage);
  if (search) query = query.ilike('title', `%${search}%`);

  const { data, error, count } = await query;
  if (error) throw ApiError.internal(error.message);
  sendPaginated(res, data, count, page, limit);
};

// ── Get Deal ─────────────────────────────────────────────────────────────────
const getDeal = async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('deals')
    .select('*, clients(name, email, phone)')
    .eq('id', req.params.id)
    .eq('company_id', req.company_id)
    .single();

  if (error || !data) throw ApiError.notFound('Deal not found');
  sendSuccess(res, data);
};

// ── Create Deal ───────────────────────────────────────────────────────────────
const createDeal = async (req, res) => {
  const { title, value, stage, client_id, expected_close_date, notes, probability } = req.body;

  const { data, error } = await supabaseAdmin
    .from('deals')
    .insert({
      title, value, stage: stage || 'lead', client_id,
      expected_close_date, notes, probability: probability || 0,
      company_id: req.company_id,
      created_by: req.user.id,
    })
    .select()
    .single();

  if (error) throw ApiError.internal(error.message);
  sendCreated(res, data, 'Deal created');
};

// ── Update Deal ───────────────────────────────────────────────────────────────
const updateDeal = async (req, res) => {
  const allowed = stripUndefined({
    title:               req.body.title,
    value:               req.body.value,
    stage:               req.body.stage,
    client_id:           req.body.client_id,
    expected_close_date: req.body.expected_close_date,
    notes:               req.body.notes,
    probability:         req.body.probability,
  });

  const { data, error } = await supabaseAdmin
    .from('deals')
    .update({ ...allowed, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('company_id', req.company_id)
    .select()
    .single();

  if (error || !data) throw ApiError.notFound('Deal not found');
  sendSuccess(res, data, 'Deal updated');
};

// ── Delete Deal ───────────────────────────────────────────────────────────────
const deleteDeal = async (req, res) => {
  const { error } = await supabaseAdmin
    .from('deals')
    .delete()
    .eq('id', req.params.id)
    .eq('company_id', req.company_id);

  if (error) throw ApiError.internal(error.message);
  sendSuccess(res, {}, 'Deal deleted');
};

module.exports = { listDeals, getDeal, createDeal, updateDeal, deleteDeal };
