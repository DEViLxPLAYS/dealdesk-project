'use strict';

const { supabaseAdmin } = require('../config/supabase');
const { ApiError, sendSuccess } = require('../utils/apiResponse');

const getDashboard = async (req, res) => {
  const cid = req.company_id;

  const [clients, deals, invoices, projects] = await Promise.all([
    supabaseAdmin.from('clients').select('id, status', { count: 'exact' }).eq('company_id', cid),
    supabaseAdmin.from('deals').select('id, value, stage').eq('company_id', cid),
    supabaseAdmin.from('invoices').select('id, total, status').eq('company_id', cid),
    supabaseAdmin.from('projects').select('id, status').eq('company_id', cid),
  ]);

  const totalRevenue = (invoices.data || [])
    .filter((i) => i.status === 'paid')
    .reduce((s, i) => s + (i.total || 0), 0);

  const pipelineValue = (deals.data || []).reduce((s, d) => s + (d.value || 0), 0);

  sendSuccess(res, {
    clients:      { total: clients.count || 0, active: (clients.data || []).filter((c) => c.status === 'active').length },
    deals:        { total: (deals.data || []).length, pipeline_value: pipelineValue },
    invoices:     { total: (invoices.data || []).length, revenue: totalRevenue, pending: (invoices.data || []).filter((i) => i.status === 'pending').length },
    projects:     { total: (projects.data || []).length, active: (projects.data || []).filter((p) => p.status === 'active').length },
  }, 'Dashboard stats');
};

const getReports = async (req, res) => {
  const cid = req.company_id;
  const { data: monthly } = await supabaseAdmin
    .from('invoices')
    .select('total, status, created_at')
    .eq('company_id', cid)
    .eq('status', 'paid');

  sendSuccess(res, { monthly_revenue: monthly || [] }, 'Reports fetched');
};

module.exports = { getDashboard, getReports };
