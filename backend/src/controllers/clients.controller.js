'use strict';

const { supabaseAdmin }  = require('../config/supabase');
const { ApiError, sendSuccess, sendCreated, sendPaginated } = require('../utils/apiResponse');
const { parsePagination, stripUndefined } = require('../utils/helpers');

// ── List Clients ─────────────────────────────────────────────────────────────
const listClients = async (req, res) => {
  const { page, limit, from, to } = parsePagination(req.query);
  const search = req.query.search || '';

  let query = supabaseAdmin
    .from('clients')
    .select('*', { count: 'exact' })
    .eq('company_id', req.company_id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (search) query = query.ilike('name', `%${search}%`);

  const { data, error, count } = await query;
  if (error) throw ApiError.internal(error.message);

  sendPaginated(res, data, count, page, limit);
};

// ── Get Client ───────────────────────────────────────────────────────────────
const getClient = async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('clients')
    .select('*')
    .eq('id', req.params.id)
    .eq('company_id', req.company_id)
    .single();

  if (error || !data) throw ApiError.notFound('Client not found');
  sendSuccess(res, data);
};

// ── Create Client ─────────────────────────────────────────────────────────────
const createClient = async (req, res) => {
  const { name, email, phone, company, status, notes, address, website } = req.body;

  const { data, error } = await supabaseAdmin
    .from('clients')
    .insert({
      name, email, phone, company, status: status || 'active', notes, address, website,
      company_id: req.company_id,
      created_by: req.user.id,
    })
    .select()
    .single();

  if (error) throw ApiError.internal(error.message);
  sendCreated(res, data, 'Client created');
};

// ── Update Client ─────────────────────────────────────────────────────────────
const updateClient = async (req, res) => {
  const allowed = stripUndefined({
    name:    req.body.name,
    email:   req.body.email,
    phone:   req.body.phone,
    company: req.body.company,
    status:  req.body.status,
    notes:   req.body.notes,
    address: req.body.address,
    website: req.body.website,
  });

  const { data, error } = await supabaseAdmin
    .from('clients')
    .update({ ...allowed, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('company_id', req.company_id)
    .select()
    .single();

  if (error || !data) throw ApiError.notFound('Client not found or no permission');
  sendSuccess(res, data, 'Client updated');
};

// ── Delete Client ─────────────────────────────────────────────────────────────
const deleteClient = async (req, res) => {
  const { error } = await supabaseAdmin
    .from('clients')
    .delete()
    .eq('id', req.params.id)
    .eq('company_id', req.company_id);

  if (error) throw ApiError.internal(error.message);
  sendSuccess(res, {}, 'Client deleted');
};

module.exports = { listClients, getClient, createClient, updateClient, deleteClient };
