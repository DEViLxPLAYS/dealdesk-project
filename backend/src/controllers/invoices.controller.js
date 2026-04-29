'use strict';

const { supabaseAdmin }  = require('../config/supabase');
const { sendInvoiceEmail } = require('../utils/email');
const { ApiError, sendSuccess, sendCreated, sendPaginated } = require('../utils/apiResponse');
const { parsePagination, stripUndefined } = require('../utils/helpers');

// ── List Invoices ─────────────────────────────────────────────────────────────
const listInvoices = async (req, res) => {
  const { page, limit, from, to } = parsePagination(req.query);
  const { status } = req.query;

  let query = supabaseAdmin
    .from('invoices')
    .select('*, clients(name, email)', { count: 'exact' })
    .eq('company_id', req.company_id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;
  if (error) throw ApiError.internal(error.message);
  sendPaginated(res, data, count, page, limit);
};

// ── Get Invoice ───────────────────────────────────────────────────────────────
const getInvoice = async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('invoices')
    .select('*, clients(name, email, phone), invoice_items(*)')
    .eq('id', req.params.id)
    .eq('company_id', req.company_id)
    .single();

  if (error || !data) throw ApiError.notFound('Invoice not found');
  sendSuccess(res, data);
};

// ── Create Invoice ────────────────────────────────────────────────────────────
const createInvoice = async (req, res) => {
  const { client_id, invoice_number, due_date, items = [], notes, tax_rate, discount } = req.body;

  const subtotal  = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const taxAmount = subtotal * ((tax_rate || 0) / 100);
  const total     = subtotal + taxAmount - (discount || 0);

  const { data: inv, error } = await supabaseAdmin
    .from('invoices')
    .insert({
      client_id, invoice_number, due_date, notes,
      tax_rate:   tax_rate  || 0,
      discount:   discount  || 0,
      subtotal, tax_amount: taxAmount, total,
      status:     'draft',
      company_id: req.company_id,
      created_by: req.user.id,
    })
    .select()
    .single();

  if (error) throw ApiError.internal(error.message);

  // Insert line items
  if (items.length) {
    const rows = items.map((i) => ({
      invoice_id:  inv.id,
      description: i.description,
      quantity:    i.quantity,
      unit_price:  i.unit_price,
      amount:      i.quantity * i.unit_price,
    }));
    await supabaseAdmin.from('invoice_items').insert(rows);
  }

  sendCreated(res, inv, 'Invoice created');
};

// ── Update Invoice ────────────────────────────────────────────────────────────
const updateInvoice = async (req, res) => {
  const allowed = stripUndefined({
    status:   req.body.status,
    due_date: req.body.due_date,
    notes:    req.body.notes,
  });

  const { data, error } = await supabaseAdmin
    .from('invoices')
    .update({ ...allowed, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('company_id', req.company_id)
    .select('*, clients(name,email)')
    .single();

  if (error || !data) throw ApiError.notFound('Invoice not found');

  // Auto-send email when status flipped to 'sent'
  if (req.body.status === 'sent' && data.clients?.email) {
    await sendInvoiceEmail(
      data.clients.email,
      data.invoice_number,
      data.total,
      data.due_date
    ).catch(() => {});
  }

  sendSuccess(res, data, 'Invoice updated');
};

// ── Delete Invoice ────────────────────────────────────────────────────────────
const deleteInvoice = async (req, res) => {
  const { error } = await supabaseAdmin
    .from('invoices')
    .delete()
    .eq('id', req.params.id)
    .eq('company_id', req.company_id);

  if (error) throw ApiError.internal(error.message);
  sendSuccess(res, {}, 'Invoice deleted');
};

module.exports = { listInvoices, getInvoice, createInvoice, updateInvoice, deleteInvoice };
