'use strict';

const { supabaseAdmin } = require('../config/supabase');
const { ApiError, sendSuccess, sendCreated, sendPaginated } = require('../utils/apiResponse');
const { parsePagination, stripUndefined } = require('../utils/helpers');

const listProjects = async (req, res) => {
  const { page, limit, from, to } = parsePagination(req.query);
  const { data, error, count } = await supabaseAdmin
    .from('projects')
    .select('*, clients(name)', { count: 'exact' })
    .eq('company_id', req.company_id)
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw ApiError.internal(error.message);
  sendPaginated(res, data, count, page, limit);
};

const getProject = async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('projects').select('*, clients(name, email)')
    .eq('id', req.params.id).eq('company_id', req.company_id).single();
  if (error || !data) throw ApiError.notFound('Project not found');
  sendSuccess(res, data);
};

const createProject = async (req, res) => {
  const { name, client_id, description, status, start_date, end_date, budget } = req.body;
  const { data, error } = await supabaseAdmin
    .from('projects')
    .insert({ name, client_id, description, status: status || 'planning', start_date, end_date, budget: budget || 0, company_id: req.company_id, created_by: req.user.id })
    .select().single();
  if (error) throw ApiError.internal(error.message);
  sendCreated(res, data, 'Project created');
};

const updateProject = async (req, res) => {
  const allowed = stripUndefined({ name: req.body.name, description: req.body.description, status: req.body.status, start_date: req.body.start_date, end_date: req.body.end_date, budget: req.body.budget, progress: req.body.progress });
  const { data, error } = await supabaseAdmin
    .from('projects').update({ ...allowed, updated_at: new Date().toISOString() })
    .eq('id', req.params.id).eq('company_id', req.company_id).select().single();
  if (error || !data) throw ApiError.notFound('Project not found');
  sendSuccess(res, data, 'Project updated');
};

const deleteProject = async (req, res) => {
  const { error } = await supabaseAdmin.from('projects').delete().eq('id', req.params.id).eq('company_id', req.company_id);
  if (error) throw ApiError.internal(error.message);
  sendSuccess(res, {}, 'Project deleted');
};

module.exports = { listProjects, getProject, createProject, updateProject, deleteProject };
