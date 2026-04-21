import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface InvoiceRow {
  id: string;
  client_id: string;
  client_name: string;
  client_company?: string;
  client_email: string;
  invoice_number: string;
  items: Array<{ id: string; description: string; quantity: number; rate: number; amount: number }>;
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

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  overdue: number;
}

export interface YearlyRevenue {
  year: number;
  revenue: number;
  invoiceCount: number;
}

export interface ClientRevenue {
  clientName: string;
  revenue: number;
  invoiceCount: number;
}

export function useInvoices() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setInvoices((data as InvoiceRow[]) || []);
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  // ── Derived stats ─────────────────────────────────────────────────────────────
  const totalPaid    = invoices.filter(i => i.status === 'paid').reduce((a, i) => a + i.total, 0);
  const totalPending = invoices.filter(i => i.status === 'pending').reduce((a, i) => a + i.total, 0);
  const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((a, i) => a + i.total, 0);
  const outstandingCount = invoices.filter(i => i.status === 'pending' || i.status === 'overdue').length;

  // ── Current year monthly revenue ──────────────────────────────────────────────
  const currentYear = new Date().getFullYear();
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const monthlyRevenue: MonthlyRevenue[] = MONTHS.map((month, idx) => {
    const monthInvoices = invoices.filter(inv => {
      const d = new Date(inv.created_at);
      return d.getFullYear() === currentYear && d.getMonth() === idx;
    });
    return {
      month,
      revenue: monthInvoices.filter(i => i.status === 'paid').reduce((a, i) => a + i.total, 0),
      overdue: monthInvoices.filter(i => i.status === 'overdue').reduce((a, i) => a + i.total, 0),
    };
  });

  // ── Year-over-year revenue ────────────────────────────────────────────────────
  const yearlyRevenue: YearlyRevenue[] = (() => {
    const years: Record<number, { revenue: number; invoiceCount: number }> = {};
    invoices.forEach(inv => {
      const y = new Date(inv.created_at).getFullYear();
      if (!years[y]) years[y] = { revenue: 0, invoiceCount: 0 };
      if (inv.status === 'paid') years[y].revenue += inv.total;
      years[y].invoiceCount++;
    });
    return Object.entries(years)
      .map(([year, data]) => ({ year: Number(year), ...data }))
      .sort((a, b) => a.year - b.year);
  })();

  // ── Top clients by revenue ────────────────────────────────────────────────────
  const topClients: ClientRevenue[] = (() => {
    const map: Record<string, { revenue: number; invoiceCount: number }> = {};
    invoices.filter(i => i.status === 'paid').forEach(inv => {
      const name = inv.client_name;
      if (!map[name]) map[name] = { revenue: 0, invoiceCount: 0 };
      map[name].revenue += inv.total;
      map[name].invoiceCount++;
    });
    return Object.entries(map)
      .map(([clientName, data]) => ({ clientName, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  })();

  // ── This month revenue ────────────────────────────────────────────────────────
  const now = new Date();
  const thisMonthRevenue = invoices
    .filter(inv => {
      const d = new Date(inv.created_at);
      return inv.status === 'paid' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((a, i) => a + i.total, 0);

  // Last month for % change
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthRevenue = invoices
    .filter(inv => {
      const d = new Date(inv.created_at);
      return inv.status === 'paid' && d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
    })
    .reduce((a, i) => a + i.total, 0);

  const revenueChange = lastMonthRevenue === 0
    ? 0
    : Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 * 10) / 10;

  // ── Lead source counts (from invoices linked to clients) ──────────────────────
  const avgInvoice = invoices.length === 0 ? 0 : Math.round(invoices.reduce((a, i) => a + i.total, 0) / invoices.length);

  return {
    invoices,
    loading,
    refetch: fetchInvoices,
    totalPaid,
    totalPending,
    totalOverdue,
    outstandingCount,
    monthlyRevenue,
    yearlyRevenue,
    topClients,
    thisMonthRevenue,
    revenueChange,
    avgInvoice,
  };
}
