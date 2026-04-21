import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, Legend,
} from 'recharts';
import {
  TrendingUp, DollarSign, Users, FileText, ArrowUpRight,
  ArrowDownRight, Loader2, Calendar, Trophy, Target,
} from 'lucide-react';
import { useInvoices } from '@/hooks/useInvoices';
import { useClients } from '@/hooks/useClients';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border/50 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} className="flex items-center gap-2" style={{ color: entry.color }}>
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: entry.color }} />
          {entry.name}: <span className="font-semibold">${Number(entry.value).toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
export default function Reports() {
  const {
    invoices, loading: invLoading,
    totalPaid, totalPending, totalOverdue,
    monthlyRevenue, yearlyRevenue, topClients,
    thisMonthRevenue, revenueChange, avgInvoice,
  } = useInvoices();

  const { clients, loading: clientsLoading } = useClients();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const loading = invLoading || clientsLoading;

  // ── Year-filtered monthly data ──────────────────────────────────────────────
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthlyForYear = MONTHS.map((month, idx) => {
    const monthInvoices = invoices.filter(inv => {
      const d = new Date(inv.created_at);
      return d.getFullYear() === selectedYear && d.getMonth() === idx;
    });
    return {
      month,
      Revenue: monthInvoices.filter(i => i.status === 'paid').reduce((a, i) => a + i.total, 0),
      Overdue: monthInvoices.filter(i => i.status === 'overdue').reduce((a, i) => a + i.total, 0),
      Pending: monthInvoices.filter(i => i.status === 'pending').reduce((a, i) => a + i.total, 0),
    };
  });

  // ── Lead source distribution ──────────────────────────────────────────────
  const sourceMap: Record<string, number> = {};
  clients.forEach(c => {
    const s = c.lead_source || 'other';
    sourceMap[s] = (sourceMap[s] || 0) + 1;
  });
  const leadSourceData = Object.entries(sourceMap).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  })).sort((a, b) => b.value - a.value);

  // ── Available years ───────────────────────────────────────────────────────
  const availableYears = yearlyRevenue.length > 0
    ? yearlyRevenue.map(y => y.year)
    : [currentYear];

  // ── New clients this year ─────────────────────────────────────────────────
  const newClientsThisYear = clients.filter(c => {
    return new Date(c.created_at).getFullYear() === currentYear;
  }).length;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <Header title="Reports" subtitle="Real-time business analytics & revenue insights" />

      <div className="p-6 space-y-6">

        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading data…
          </div>
        )}

        {/* ── Top KPI Cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue Collected */}
          <Card className="animate-fade-in border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Total Collected</p>
                  <p className="text-2xl font-bold text-foreground">${totalPaid.toLocaleString()}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {revenueChange >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-destructive" />
                    )}
                    <span className={cn('text-xs font-medium', revenueChange >= 0 ? 'text-emerald-600' : 'text-destructive')}>
                      {Math.abs(revenueChange)}% vs last month
                    </span>
                  </div>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Outstanding */}
          <Card className="animate-fade-in border-destructive/20 bg-gradient-to-br from-destructive/5 to-transparent" style={{ animationDelay: '100ms' }}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Outstanding</p>
                  <p className="text-2xl font-bold text-foreground">${(totalPending + totalOverdue).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ${totalOverdue.toLocaleString()} overdue · ${totalPending.toLocaleString()} pending
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* This Month Revenue */}
          <Card className="animate-fade-in border-primary/20 bg-gradient-to-br from-primary/5 to-transparent" style={{ animationDelay: '200ms' }}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">This Month</p>
                  <p className="text-2xl font-bold text-foreground">${thisMonthRevenue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Avg invoice: ${avgInvoice.toLocaleString()}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* New Clients */}
          <Card className="animate-fade-in border-accent/20 bg-gradient-to-br from-accent/5 to-transparent" style={{ animationDelay: '300ms' }}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">New Clients {currentYear}</p>
                  <p className="text-2xl font-bold text-foreground">{newClientsThisYear}</p>
                  <p className="text-xs text-muted-foreground mt-1">{clients.length} total clients</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Year-over-Year Revenue ──────────────────────────────────────────── */}
        {yearlyRevenue.length > 0 && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Year-over-Year Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {yearlyRevenue.map(yr => (
                  <div
                    key={yr.year}
                    className={cn(
                      'rounded-xl border p-4 transition-all cursor-pointer',
                      yr.year === currentYear
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border/50 hover:border-primary/20 hover:bg-primary/5',
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> {yr.year}
                        {yr.year === currentYear && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full ml-1">Current</span>
                        )}
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">${yr.revenue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">{yr.invoiceCount} invoices</p>
                  </div>
                ))}
              </div>

              {/* Bar chart of YOY */}
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearlyRevenue.map(y => ({ year: String(y.year), Revenue: y.revenue }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" vertical={false} />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: 'hsl(220,9%,46%)', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(220,9%,46%)', fontSize: 12 }} tickFormatter={v => `$${v/1000}k`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="Revenue" fill="hsl(239,84%,67%)" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Monthly Revenue Chart ──────────────────────────────────────────── */}
        <Card className="animate-fade-in">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Monthly Revenue — {selectedYear}
              </CardTitle>
              <div className="flex gap-1.5">
                {availableYears.map(yr => (
                  <Button
                    key={yr}
                    size="sm"
                    variant={selectedYear === yr ? 'default' : 'outline'}
                    className="h-7 px-3 text-xs"
                    onClick={() => setSelectedYear(yr)}
                  >
                    {yr}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                <DollarSign className="h-10 w-10 opacity-20" />
                <p className="text-sm">No invoice data yet. Create invoices to see revenue charts.</p>
              </div>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyForYear} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(160,84%,39%)" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="hsl(160,84%,39%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradOverdue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(0,84%,60%)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="hsl(0,84%,60%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'hsl(220,9%,46%)', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(220,9%,46%)', fontSize: 12 }} tickFormatter={v => `$${v/1000}k`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="Revenue" stroke="hsl(160,84%,39%)" strokeWidth={2.5} fillOpacity={1} fill="url(#gradRevenue)" />
                    <Area type="monotone" dataKey="Overdue" stroke="hsl(0,84%,60%)" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#gradOverdue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Bottom Row: Top Clients + Lead Sources ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Top Clients by Revenue */}
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Top Clients by Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topClients.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No paid invoices yet. Mark invoices as paid to see top clients.
                </p>
              ) : (
                <div className="space-y-3">
                  {topClients.map((client, i) => {
                    const maxRev = topClients[0].revenue;
                    const pct = maxRev > 0 ? (client.revenue / maxRev) * 100 : 0;
                    return (
                      <div key={client.clientName} className="flex items-center gap-3">
                        <div className={cn(
                          'h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                          i === 0 ? 'bg-amber-500/20 text-amber-600' :
                          i === 1 ? 'bg-zinc-400/20 text-zinc-500' :
                          i === 2 ? 'bg-orange-500/20 text-orange-600' :
                          'bg-muted text-muted-foreground'
                        )}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between mb-1">
                            <p className="text-sm font-medium text-foreground truncate">{client.clientName}</p>
                            <p className="text-sm font-semibold text-foreground shrink-0 ml-2">${client.revenue.toLocaleString()}</p>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full">
                            <div
                              className={cn('h-full rounded-full',
                                i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-zinc-400' : i === 2 ? 'bg-orange-500' : 'bg-primary/60'
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{client.invoiceCount} invoice{client.invoiceCount !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lead Sources */}
          <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Client Acquisition Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clients.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No clients yet.</p>
              ) : (
                <>
                  <div className="h-[180px] mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={leadSourceData} layout="vertical" margin={{ left: 0 }}>
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'hsl(220,9%,46%)', fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(220,9%,46%)', fontSize: 12 }} width={70} />
                        <Tooltip formatter={(v: any) => [v, 'Clients']} />
                        <Bar dataKey="value" name="Clients" fill="hsl(239,84%,67%)" radius={[0,4,4,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {leadSourceData.map(src => (
                      <div key={src.name} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{src.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{src.value}</span>
                          <span className="text-xs text-muted-foreground">
                            ({clients.length > 0 ? Math.round((src.value / clients.length) * 100) : 0}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Invoice Status Summary ──────────────────────────────────────────── */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Invoice Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {[
                { label: 'Paid', value: invoices.filter(i => i.status === 'paid').length, amount: totalPaid, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
                { label: 'Pending', value: invoices.filter(i => i.status === 'pending').length, amount: totalPending, color: 'text-amber-600', bg: 'bg-amber-500/10' },
                { label: 'Overdue', value: invoices.filter(i => i.status === 'overdue').length, amount: totalOverdue, color: 'text-destructive', bg: 'bg-destructive/10' },
                { label: 'Draft', value: invoices.filter(i => i.status === 'draft').length, amount: invoices.filter(i => i.status === 'draft').reduce((a,i) => a+i.total, 0), color: 'text-muted-foreground', bg: 'bg-muted' },
              ].map(item => (
                <div key={item.label} className={cn('rounded-xl p-4', item.bg)}>
                  <p className={cn('text-sm font-semibold', item.color)}>{item.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{item.value}</p>
                  <p className={cn('text-sm font-medium mt-0.5', item.color)}>${item.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
