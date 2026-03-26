import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { mockRevenueData } from '@/data/mockData';

export function RevenueChart() {
  return (
    <div className="bg-card p-6 rounded-xl shadow-soft border border-border/50 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Revenue Overview</h3>
          <p className="text-sm text-muted-foreground">Monthly revenue vs target</p>
        </div>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mockRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(24, 95%, 53%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(24, 95%, 53%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }}
              tickFormatter={(value) => `$${value / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(0, 0%, 100%)',
                border: '1px solid hsl(220, 13%, 91%)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="hsl(239, 84%, 67%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
            <Area
              type="monotone"
              dataKey="target"
              name="Target"
              stroke="hsl(24, 95%, 53%)"
              strokeWidth={2}
              strokeDasharray="5 5"
              fillOpacity={1}
              fill="url(#colorTarget)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
