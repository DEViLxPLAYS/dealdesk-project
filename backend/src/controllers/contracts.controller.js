'use strict';

const { supabaseAdmin } = require('../config/supabase');
const { ApiError, sendSuccess, sendCreated, sendPaginated } = require('../utils/apiResponse');
const { parsePagination, stripUndefined } = require('../utils/helpers');

const listContracts = async (req, res) => {
  const { page, limit, from, to } = parsePagination(req.query);
  const { status } = req.query;

  let query = supabaseAdmin
    .from('contracts')
    .select('*, clients(name, email)', { count: 'exact' })
    .eq('company_id', req.company_id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;
  if (error) throw ApiError.internal(error.message);
  sendPaginated(res, data, count, page, limit);
};

const getContract = async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('contracts')
    .select('*, clients(name, email, phone)')
    .eq('id', req.params.id)
    .eq('company_id', req.company_id)
    .single();

  if (error || !data) throw ApiError.notFound('Contract not found');
  sendSuccess(res, data);
};

const createContract = async (req, res) => {
  const { client_id, title, value, start_date, end_date, terms, status } = req.body;

  const { data, error } = await supabaseAdmin
    .from('contracts')
    .insert({
      client_id, title, value, start_date, end_date, terms,
      status:     status || 'draft',
      company_id: req.company_id,
      created_by: req.user.id,
    })
    .select()
    .single();

  if (error) throw ApiError.internal(error.message);
  sendCreated(res, data, 'Contract created');
};

const updateContract = async (req, res) => {
  const allowed = stripUndefined({
    title:      req.body.title,
    value:      req.body.value,
    status:     req.body.status,
    start_date: req.body.start_date,
    end_date:   req.body.end_date,
    terms:      req.body.terms,
  });

  const { data, error } = await supabaseAdmin
    .from('contracts')
    .update({ ...allowed, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('company_id', req.company_id)
    .select()
    .single();

  if (error || !data) throw ApiError.notFound('Contract not found');
  sendSuccess(res, data, 'Contract updated');
};

const deleteContract = async (req, res) => {
  const { error } = await supabaseAdmin
    .from('contracts')
    .delete()
    .eq('id', req.params.id)
    .eq('company_id', req.company_id);

  if (error) throw ApiError.internal(error.message);
  sendSuccess(res, {}, 'Contract deleted');
};

module.exports = { listContracts, getContract, createContract, updateContract, deleteContract };
