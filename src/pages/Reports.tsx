import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { TrendingUp, DollarSign, Users, Target } from 'lucide-react';

const monthlyRevenue = [
  { month: 'Jan', collected: 52000, overdue: 8000 },
  { month: 'Feb', collected: 58000, overdue: 6500 },
  { month: 'Mar', collected: 61000, overdue: 7000 },
  { month: 'Apr', collected: 67000, overdue: 5500 },
  { month: 'May', collected: 72000, overdue: 4800 },
  { month: 'Jun', collected: 78500, overdue: 6000 },
];

const conversionData = [
  { month: 'Jan', rate: 28 },
  { month: 'Feb', rate: 32 },
  { month: 'Mar', rate: 30 },
  { month: 'Apr', rate: 35 },
  { month: 'May', rate: 38 },
  { month: 'Jun', rate: 42 },
];

export default function Reports() {
  return (
    <div className="min-h-screen">
      <Header title="Reports" subtitle="Business analytics and insights" />

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="animate-fade-in">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Collected</p>
                  <p className="text-xl font-bold text-foreground">$388,500</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Overdue</p>
                  <p className="text-xl font-bold text-foreground">$37,800</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <p className="text-xl font-bold text-foreground">42%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="animate-fade-in" style={{ animationDelay: '300ms' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Invoice</p>
                  <p className="text-xl font-bold text-foreground">$4,850</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle>Revenue Collection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'hsl(220, 9%, 46%)' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(220, 9%, 46%)' }} tickFormatter={(v) => `$${v/1000}k`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(0, 0%, 100%)',
                        border: '1px solid hsl(220, 13%, 91%)',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                    />
                    <Bar dataKey="collected" name="Collected" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="overdue" name="Overdue" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <CardHeader>
              <CardTitle>Conversion Rate Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={conversionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'hsl(220, 9%, 46%)' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(220, 9%, 46%)' }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(0, 0%, 100%)',
                        border: '1px solid hsl(220, 13%, 91%)',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value}%`, 'Conversion Rate']}
                    />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="hsl(239, 84%, 67%)"
                      strokeWidth={3}
                      dot={{ fill: 'hsl(239, 84%, 67%)', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
