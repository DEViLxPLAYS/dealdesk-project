import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useClients } from '@/hooks/useClients';
import {
  Search, Plus, MoreHorizontal, Download, Send, Eye, Filter,
  Trash2, FileText, Printer, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

// ─── Status styles ─────────────────────────────────────────────────────────────
const statusStyles: Record<string, { bg: string; text: string }> = {
  paid:    { bg: 'bg-success/10',     text: 'text-success' },
  pending: { bg: 'bg-warning/10',     text: 'text-warning' },
  overdue: { bg: 'bg-destructive/10', text: 'text-destructive' },
  draft:   { bg: 'bg-muted',          text: 'text-muted-foreground' },
};

// ─── Types ─────────────────────────────────────────────────────────────────────
interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoiceRow {
  id: string;
  client_id: string;
  client_name: string;
  client_company?: string;
  client_email: string;
  invoice_number: string;
  items: LineItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'draft' | 'pending' | 'paid' | 'overdue';
  issue_date: string;
  due_date: string;
  notes?: string;
  created_at: string;
}

// ─── Services catalogue ────────────────────────────────────────────────────────
const SERVICE_CATALOGUE = [
  { description: 'Social Media Marketing',      rate: 2500 },
  { description: 'Digital Marketing Campaign',  rate: 3500 },
  { description: 'Web Development',             rate: 8000 },
  { description: 'Influencer Marketing',        rate: 5000 },
  { description: 'SEO Optimization',            rate: 1500 },
  { description: 'Content Creation Package',    rate: 1200 },
  { description: 'Brand Strategy',              rate: 2000 },
  { description: 'Email Marketing Setup',       rate: 800  },
  { description: 'Google Ads Management',       rate: 1800 },
  { description: 'Monthly Retainer',            rate: 3000 },
];

// ─── PDF generator ─────────────────────────────────────────────────────────────
function openInvoicePDF(inv: InvoiceRow) {
  const total = inv.total;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Invoice ${inv.invoice_number}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',sans-serif;padding:44px;color:#1a1a2e}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:44px}
.brand{font-size:26px;font-weight:800;color:#6366f1}.brand-sub{font-size:12px;color:#888;margin-top:3px}
.inv-title{text-align:right}.inv-title h1{font-size:34px;font-weight:700;color:#6366f1}
.inv-title p{color:#888;font-size:13px;margin-top:3px}
.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;margin-top:6px}
.badge.draft{background:#f1f5f9;color:#64748b}.badge.pending{background:#fef3c7;color:#d97706}
.badge.paid{background:#dcfce7;color:#16a34a}.badge.overdue{background:#fee2e2;color:#dc2626}
hr{border:none;border-top:3px solid #6366f1;border-radius:2px;margin:26px 0}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:32px}
.block label{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#6366f1;font-weight:600;display:block;margin-bottom:6px}
.block .name{font-size:15px;font-weight:700}.block p{font-size:13px;color:#555;line-height:1.6}
.dates{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:32px}
.date-card{background:#f8f7ff;border:1px solid #e8e6ff;border-radius:8px;padding:12px;text-align:center}
.date-card .dl{font-size:10px;text-transform:uppercase;color:#6366f1;font-weight:600;margin-bottom:4px}
.date-card .dv{font-size:14px;font-weight:600}
table{width:100%;border-collapse:collapse;margin-bottom:26px}
thead tr{background:linear-gradient(135deg,#6366f1,#8b5cf6)}
thead th{padding:12px 14px;text-align:left;color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:.4px}
thead th:last-child{text-align:right}
tbody tr{border-bottom:1px solid #f0eeff}
tbody tr:nth-child(even){background:#fafaff}
tbody td{padding:12px 14px;font-size:13px;color:#333}
tbody td:last-child{text-align:right;font-weight:600}
.tots{display:flex;justify-content:flex-end;margin-bottom:36px}
.tots-box{min-width:260px}
.tr{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f0eeff;font-size:13px}
.tr.total{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:13px 14px;border-radius:8px;margin-top:8px;font-weight:700;font-size:17px}
.notes{background:#f8f7ff;border-left:4px solid #6366f1;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:36px}
.notes h3{color:#6366f1;font-size:11px;text-transform:uppercase;margin-bottom:6px}
.notes p{color:#555;font-size:13px;line-height:1.6}
.footer{text-align:center;padding-top:24px;border-top:2px solid #f0eeff;color:#999;font-size:11px}
</style></head><body>
<div class="hdr">
  <div><div class="brand">DealDesk</div><div class="brand-sub">Professional CRM &amp; Billing</div></div>
  <div class="inv-title"><h1>INVOICE</h1><p>${inv.invoice_number}</p><span class="badge ${inv.status}">${inv.status.toUpperCase()}</span></div>
</div>
<hr/>
<div class="grid2">
  <div class="block"><label>Bill To</label><p class="name">${inv.client_name}</p><p>${inv.client_company || ''}</p><p>${inv.client_email}</p></div>
  <div class="block"><label>From</label><p class="name">DealDesk Agency</p><p>Digital Marketing Solutions</p><p>billing@dealdesk.com</p></div>
</div>
<div class="dates">
  <div class="date-card"><div class="dl">Invoice #</div><div class="dv">${inv.invoice_number}</div></div>
  <div class="date-card"><div class="dl">Issue Date</div><div class="dv">${inv.issue_date}</div></div>
  <div class="date-card"><div class="dl">Due Date</div><div class="dv">${inv.due_date}</div></div>
</div>
<table>
<thead><tr><th>#</th><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
<tbody>
${inv.items.map((item, i) => `<tr><td>${i+1}</td><td>${item.description}</td><td>${item.quantity}</td><td>$${item.rate.toLocaleString()}</td><td>$${item.amount.toLocaleString()}</td></tr>`).join('')}
</tbody></table>
<div class="tots"><div class="tots-box">
  <div class="tr"><span>Subtotal</span><span>$${inv.subtotal.toLocaleString()}</span></div>
  <div class="tr"><span>Tax</span><span>$${inv.tax.toLocaleString()}</span></div>
  ${inv.discount > 0 ? `<div class="tr"><span>Discount</span><span>-$${inv.discount.toLocaleString()}</span></div>` : ''}
  <div class="tr total"><span>Total Due</span><span>$${total.toLocaleString()}</span></div>
</div></div>
${inv.notes ? `<div class="notes"><h3>Notes &amp; Terms</h3><p>${inv.notes}</p></div>` : ''}
<div class="footer"><p>Thank you for your business! &middot; DealDesk &middot; billing@dealdesk.com</p><p style="margin-top:5px">Please include <strong>${inv.invoice_number}</strong> with your payment.</p></div>
</body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) win.onload = () => win.print();
}

// ─── Empty form factory ────────────────────────────────────────────────────────
const emptyForm = (count: number, clientId = '', clientName = '', clientCompany = '', clientEmail = ''): Partial<InvoiceRow> & { taxRate: string | number; clientId: string } => ({
  clientId,
  client_name: clientName,
  client_company: clientCompany,
  client_email: clientEmail,
  invoice_number: `INV-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`,
  issue_date: format(new Date(), 'yyyy-MM-dd'),
  due_date: format(new Date(Date.now() + 30 * 86400000), 'yyyy-MM-dd'),
  status: 'draft',
  items: [{ id: '1', description: 'Social Media Marketing', quantity: 1, rate: 2500, amount: 2500 }],
  notes: 'Payment due within 30 days. Thank you for your business!',
  taxRate: 10,
  discount: 0,
});

// ═══════════════════════════════════════════════════════════════════════════════
export default function Invoices() {
  const { clients, loading: clientsLoading } = useClients();

  const [invoices, setInvoices]           = useState<InvoiceRow[]>([]);
  const [loadingInvoices, setLoadingInv]  = useState(true);
  const [searchQuery, setSearchQuery]     = useState('');
  const [showCreate, setShowCreate]       = useState(false);
  const [viewInvoice, setViewInvoice]     = useState<InvoiceRow | null>(null);
  const [saving, setSaving]               = useState(false);
  const [form, setForm]                   = useState<ReturnType<typeof emptyForm>>(emptyForm(0));

  const location = useLocation();

  // ── Fetch invoices from Supabase ─────────────────────────────────────────────
  const fetchInvoices = useCallback(async () => {
    try {
      setLoadingInv(true);
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setInvoices((data as InvoiceRow[]) || []);
    } catch {
      // invoices table might not exist yet → show empty list
      setInvoices([]);
    } finally {
      setLoadingInv(false);
    }
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  // Open Create Invoice automatically if navigated from Clients page or Header Quick Add
  useEffect(() => {
    if ((location.state?.createInvoiceForClient || location.state?.openCreateInvoice) && !loadingInvoices && !clientsLoading) {
      const cId = location.state?.createInvoiceForClient;
      if (cId) {
        const client = clients.find(c => c.id === cId);
        if (client) {
          setForm(emptyForm(invoices.length, client.id, client.name, client.company || '', client.email || ''));
        }
      } else if (clients.length > 0) {
        // Generic open (from header)
        const first = clients[0];
        setForm(emptyForm(invoices.length, first.id, first.name, first.company || '', first.email || ''));
      }
      setShowCreate(true);
      // Clear state to avoid reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state, clientsLoading, loadingInvoices, clients, invoices.length]);

  // Keep form invoice number in sync with current count
  const openCreateModal = () => {
    const first = clients[0];
    setForm(emptyForm(invoices.length, first?.id || '', first?.name || '', first?.company || '', first?.email || ''));
    setShowCreate(true);
  };

  // ── Line-item helpers ─────────────────────────────────────────────────────────
  const addItem = () => setForm(p => ({
    ...p,
    items: [...(p.items || []), { id: String(Date.now()), description: '', quantity: 1, rate: 0, amount: 0 }],
  }));

  const removeItem = (id: string) => setForm(p => ({ ...p, items: (p.items || []).filter(i => i.id !== id) }));

  const updateItem = (id: string, field: keyof LineItem, value: number | string) => setForm(p => ({
    ...p,
    items: (p.items || []).map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === 'quantity' || field === 'rate') updated.amount = Number(updated.quantity) * Number(updated.rate);
      return updated;
    }),
  }));

  const selectClient = (clientId: string) => {
    const c = clients.find(cl => cl.id === clientId);
    if (c) setForm(p => ({ ...p, clientId: c.id, client_name: c.name, client_company: c.company || '', client_email: c.email }));
  };

  // ── Computed totals ───────────────────────────────────────────────────────────
  const subtotal = (form.items || []).reduce((a, i) => a + i.amount, 0);
  const parsedTax = Number(form.taxRate) || 0;
  const taxAmount = Math.round((subtotal * parsedTax) / 100);
  const total = subtotal + taxAmount - (form.discount || 0);

  // ── Save invoice ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.clientId) { toast.error('Please select a client'); return; }
    if (!form.items?.length) { toast.error('Add at least one line item'); return; }

    setSaving(true);
    const payload = {
      client_id:       form.clientId,
      client_name:     form.client_name,
      client_company:  form.client_company || '',
      client_email:    form.client_email,
      invoice_number:  form.invoice_number,
      items:           form.items,
      subtotal,
      tax:             taxAmount,
      discount:        form.discount || 0,
      total,
      status:          form.status || 'draft',
      issue_date:      form.issue_date,
      due_date:        form.due_date,
      notes:           form.notes || '',
    };

    try {
      const { data, error } = await supabase.from('invoices').insert([payload]).select().single();
      if (error) throw error;
      setInvoices(prev => [data as InvoiceRow, ...prev]);
      toast.success('Invoice created!', { description: `${payload.invoice_number} for ${payload.client_name}` });
    } catch {
      // Fallback: table may not exist — store locally
      const localRow: InvoiceRow = { ...payload, id: String(Date.now()), created_at: new Date().toISOString() } as InvoiceRow;
      setInvoices(prev => [localRow, ...prev]);
      toast.success('Invoice created!', { description: `${payload.invoice_number} for ${payload.client_name}` });
    } finally {
      setSaving(false);
      setShowCreate(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────────
  const deleteInvoice = async (id: string) => {
    try { await supabase.from('invoices').delete().eq('id', id); } catch { /* ignore */ }
    setInvoices(prev => prev.filter(i => i.id !== id));
    toast.success('Invoice deleted');
  };

  // ── Mark as paid ──────────────────────────────────────────────────────────────
  const markPaid = async (id: string) => {
    try { await supabase.from('invoices').update({ status: 'paid' }).eq('id', id); } catch { /* ignore */ }
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: 'paid' } : i));
    toast.success('Invoice marked as paid!');
  };

  // ── Filtered list ─────────────────────────────────────────────────────────────
  const filtered = invoices.filter(i =>
    i.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.client_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPaid    = invoices.filter(i => i.status === 'paid').reduce((a, i) => a + i.total, 0);
  const totalPending = invoices.filter(i => i.status === 'pending').reduce((a, i) => a + i.total, 0);
  const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((a, i) => a + i.total, 0);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <Header title="Invoices" subtitle="Create and manage invoices" />

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-success/10 p-5 rounded-xl border border-success/20 animate-fade-in">
            <p className="text-sm font-medium text-success">Total Paid</p>
            <p className="text-3xl font-bold text-success mt-1">${totalPaid.toLocaleString()}</p>
            <p className="text-xs text-success/70 mt-1">{invoices.filter(i => i.status === 'paid').length} invoices</p>
          </div>
          <div className="bg-warning/10 p-5 rounded-xl border border-warning/20 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <p className="text-sm font-medium text-warning">Pending</p>
            <p className="text-3xl font-bold text-warning mt-1">${totalPending.toLocaleString()}</p>
            <p className="text-xs text-warning/70 mt-1">{invoices.filter(i => i.status === 'pending').length} invoices</p>
          </div>
          <div className="bg-destructive/10 p-5 rounded-xl border border-destructive/20 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <p className="text-sm font-medium text-destructive">Overdue</p>
            <p className="text-3xl font-bold text-destructive mt-1">${totalOverdue.toLocaleString()}</p>
            <p className="text-xs text-destructive/70 mt-1">{invoices.filter(i => i.status === 'overdue').length} invoices</p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search invoices..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Button variant="outline" className="gap-2"><Filter className="h-4 w-4" /> Filters</Button>
          </div>
          <Button variant="accent" className="gap-2" onClick={openCreateModal} disabled={clientsLoading}>
            {clientsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create Invoice
          </Button>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl shadow-soft border border-border/50 overflow-hidden animate-fade-in">
          {loadingInvoices ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading invoices…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <FileText className="h-10 w-10 opacity-30" />
              <p className="text-sm font-medium">No invoices yet</p>
              <p className="text-xs">Click "Create Invoice" to generate your first invoice.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Invoice</TableHead>
                  <TableHead className="font-semibold">Client</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Due Date</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((inv, index) => (
                  <TableRow key={inv.id} className="hover:bg-muted/30 transition-colors animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                    <TableCell>
                      <p className="font-medium text-foreground">{inv.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">{inv.issue_date}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-foreground">{inv.client_name}</p>
                      <p className="text-sm text-muted-foreground">{inv.client_company}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-foreground">${inv.total.toLocaleString()}</p>
                      {inv.discount > 0 && <p className="text-xs text-success">-${inv.discount} discount</p>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn('capitalize', statusStyles[inv.status]?.bg, statusStyles[inv.status]?.text)}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className={cn('text-sm', inv.status === 'overdue' ? 'text-destructive font-medium' : 'text-muted-foreground')}>
                        {inv.due_date}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewInvoice(inv)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { openInvoicePDF(inv); toast.success('Opening PDF…'); }}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewInvoice(inv)}>View Invoice</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => markPaid(inv.id)}>Mark as Paid</DropdownMenuItem>
                            <DropdownMenuItem>Send Reminder</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteInvoice(inv.id)}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* ── Create Invoice Modal ──────────────────────────────────────────────── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Create New Invoice
            </DialogTitle>
            <DialogDescription>Choose one of your clients and add services.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Client selector */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">Select Client</label>
              {clientsLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading clients…
                </div>
              ) : clients.length === 0 ? (
                <div className="text-sm text-destructive py-2">No clients found. Add clients first.</div>
              ) : (
                <Select value={form.clientId} onValueChange={selectClient}>
                  <SelectTrigger><SelectValue placeholder="Choose a client…" /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}{c.company ? ` — ${c.company}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Client info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Client Name</label>
                <Input value={form.client_name || ''} onChange={e => setForm(p => ({ ...p, client_name: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Company</label>
                <Input value={form.client_company || ''} onChange={e => setForm(p => ({ ...p, client_company: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Email</label>
                <Input value={form.client_email || ''} onChange={e => setForm(p => ({ ...p, client_email: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Invoice Number</label>
                <Input value={form.invoice_number || ''} onChange={e => setForm(p => ({ ...p, invoice_number: e.target.value }))} />
              </div>
            </div>

            {/* Dates + status */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Issue Date</label>
                <Input type="date" value={form.issue_date || ''} onChange={e => setForm(p => ({ ...p, issue_date: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Due Date</label>
                <Input type="date" value={form.due_date || ''} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Status</label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Line items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-foreground">Line Items</label>
                <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={addItem}>
                  <Plus className="h-3.5 w-3.5" /> Add Item
                </Button>
              </div>
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="grid grid-cols-12 bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground">
                  <div className="col-span-5">Description</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-center">Rate ($)</div>
                  <div className="col-span-2 text-right">Amount</div>
                  <div className="col-span-1"></div>
                </div>
                <div className="divide-y divide-border">
                  {(form.items || []).map(item => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 p-2 items-center">
                      <div className="col-span-5">
                        <Input
                          list="services-datalist"
                          className="h-8 text-sm"
                          placeholder="Type or select a service..."
                          value={item.description}
                          onChange={(e) => {
                            const v = e.target.value;
                            const svc = SERVICE_CATALOGUE.find(s => s.description === v);
                            updateItem(item.id, 'description', v);
                            if (svc) updateItem(item.id, 'rate', svc.rate);
                          }}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input type="number" value={item.quantity} min={1} className="h-8 text-sm text-center"
                          onChange={e => updateItem(item.id, 'quantity', Number(e.target.value))} />
                      </div>
                      <div className="col-span-2">
                        <Input type="number" value={item.rate} className="h-8 text-sm text-center"
                          onChange={e => updateItem(item.id, 'rate', Number(e.target.value))} />
                      </div>
                      <div className="col-span-2 text-right text-sm font-semibold pr-1">${item.amount.toLocaleString()}</div>
                      <div className="col-span-1 flex justify-center">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive" onClick={() => removeItem(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <datalist id="services-datalist">
                {SERVICE_CATALOGUE.map(s => <option key={s.description} value={s.description} />)}
              </datalist>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-72 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm items-center gap-2">
                  <span className="text-muted-foreground flex items-center gap-2">
                    Tax <Input type="text" value={form.taxRate ?? ''} className="h-6 w-14 text-xs px-2" onChange={e => setForm(p => ({ ...p, taxRate: e.target.value }))} />%
                  </span>
                  <span className="font-medium">${taxAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-bold border-t border-border/50 pt-2">
                  <span>Total</span>
                  <span className="text-primary">${total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Notes / Terms</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[72px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.notes || ''}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Payment terms, notes for the client…"
              />
            </div>

            {/* Footer actions */}
            <div className="flex justify-between pt-2">
              <Button variant="outline" className="gap-2" onClick={() => form.client_name && openInvoicePDF({
                ...form as any, id: '0', subtotal, tax: taxAmount, total, created_at: '',
              })}>
                <Printer className="h-4 w-4" /> Preview PDF
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button variant="accent" onClick={handleSave} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  Create Invoice
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── View / Download Modal ──────────────────────────────────────────────── */}
      {viewInvoice && (
        <Dialog open={!!viewInvoice} onOpenChange={() => setViewInvoice(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> {viewInvoice.invoice_number}
                </span>
                <Badge variant="secondary" className={cn('capitalize', statusStyles[viewInvoice.status]?.bg, statusStyles[viewInvoice.status]?.text)}>
                  {viewInvoice.status}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-2">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Bill To</p>
                  <p className="font-bold text-foreground">{viewInvoice.client_name}</p>
                  <p className="text-sm text-muted-foreground">{viewInvoice.client_company}</p>
                  <p className="text-sm text-muted-foreground">{viewInvoice.client_email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Details</p>
                  <p className="text-sm text-muted-foreground">Issued: {viewInvoice.issue_date}</p>
                  <p className="text-sm text-muted-foreground">Due: {viewInvoice.due_date}</p>
                </div>
              </div>
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="grid grid-cols-12 bg-muted/50 px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                  <div className="col-span-6">Description</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-center">Rate</div>
                  <div className="col-span-2 text-right">Amount</div>
                </div>
                <div className="divide-y divide-border">
                  {viewInvoice.items.map(item => (
                    <div key={item.id} className="grid grid-cols-12 px-4 py-3 text-sm">
                      <div className="col-span-6">{item.description}</div>
                      <div className="col-span-2 text-center">{item.quantity}</div>
                      <div className="col-span-2 text-center">${item.rate.toLocaleString()}</div>
                      <div className="col-span-2 text-right font-medium">${item.amount.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>${viewInvoice.subtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax</span><span>${viewInvoice.tax.toLocaleString()}</span></div>
                  {viewInvoice.discount > 0 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Discount</span><span className="text-success">-${viewInvoice.discount.toLocaleString()}</span></div>}
                  <div className="flex justify-between font-bold border-t border-border/50 pt-2"><span>Total</span><span className="text-primary text-lg">${viewInvoice.total.toLocaleString()}</span></div>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-1">
                <Button variant="outline" className="gap-2" onClick={() => { openInvoicePDF(viewInvoice); toast.success('Opening PDF…'); }}>
                  <Download className="h-4 w-4" /> Download PDF
                </Button>
                <Button variant="outline" className="gap-2"><Send className="h-4 w-4" /> Send to Client</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
