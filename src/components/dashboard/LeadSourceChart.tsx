import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useClients } from '@/hooks/useClients';
import { Loader2 } from 'lucide-react';

const COLORS = [
  'hsl(239, 84%, 67%)',
  'hsl(160, 84%, 39%)',
  'hsl(24, 95%, 53%)',
  'hsl(280, 87%, 65%)',
  'hsl(340, 82%, 60%)',
  'hsl(220, 9%, 55%)',
];

export function LeadSourceChart() {
  const { clients, loading } = useClients();

  // Group by lead_source
  const sourceMap: Record<string, number> = {};
  clients.forEach(c => {
    const s = c.lead_source || 'other';
    sourceMap[s] = (sourceMap[s] || 0) + 1;
  });

  const data = Object.entries(sourceMap).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const total = clients.length;

  return (
    <div className="bg-card p-6 rounded-xl shadow-soft border border-border/50 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Lead Sources</h3>
          <p className="text-sm text-muted-foreground">{total} total clients</p>
        </div>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {data.length === 0 && !loading ? (
        <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
          No clients yet
        </div>
      ) : (
        <>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any, n: any) => [v, n]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {data.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{item.value}</span>
                  <span className="text-xs text-muted-foreground">
                    ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
