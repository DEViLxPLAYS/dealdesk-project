import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useInvoices } from '@/hooks/useInvoices';
import { Loader2 } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border/50 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }} className="text-xs">
          {entry.name}: <span className="font-semibold">${Number(entry.value).toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
};

export function RevenueChart() {
  const { monthlyRevenue, loading } = useInvoices();

  const chartData = monthlyRevenue.map(m => ({
    month: m.month,
    Revenue: m.revenue,
    Overdue: m.overdue,
  }));

  return (
    <div className="bg-card p-6 rounded-xl shadow-soft border border-border/50 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Revenue Overview</h3>
          <p className="text-sm text-muted-foreground">Monthly collected revenue vs overdue — {new Date().getFullYear()}</p>
        </div>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevDB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="hsl(239, 84%, 67%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorOverDB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="hsl(0, 84%, 60%)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }} tickFormatter={v => `$${v / 1000}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area type="monotone" dataKey="Revenue" stroke="hsl(239, 84%, 67%)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevDB)" />
            <Area type="monotone" dataKey="Overdue" stroke="hsl(0, 84%, 60%)" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorOverDB)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
