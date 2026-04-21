import { useMemo } from 'react';
import { CheckCircle2, FileText, UserPlus, FileSignature, FolderKanban, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClients } from '@/hooks/useClients';
import { useInvoices } from '@/hooks/useInvoices';
import { useProjects } from '@/hooks/useProjects';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  amount?: string;
  time: string;
  timestamp: Date;
  icon: any;
  iconColor: string;
  iconBg: string;
}

export function RecentActivity() {
  const { clients, loading: cLoading } = useClients();
  const { invoices, loading: iLoading } = useInvoices();
  const { projects, loading: pLoading } = useProjects();

  const loading = cLoading || iLoading || pLoading;

  const activities = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];

    // Latest 3 clients
    clients.slice(0, 3).forEach(c => {
      items.push({
        id: `client-${c.id}`,
        type: 'new_lead',
        title: 'New Client',
        description: `${c.name}${c.company ? ` from ${c.company}` : ''} added`,
        time: formatDistanceToNow(new Date(c.created_at), { addSuffix: true }),
        timestamp: new Date(c.created_at),
        icon: UserPlus,
        iconColor: 'text-primary',
        iconBg: 'bg-primary/10',
      });
    });

    // Latest 4 invoices
    invoices.slice(0, 4).forEach(inv => {
      const isPaid = inv.status === 'paid';
      items.push({
        id: `inv-${inv.id}`,
        type: isPaid ? 'invoice_paid' : 'invoice_sent',
        title: isPaid ? 'Invoice Paid' : `Invoice ${inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}`,
        description: `${inv.client_name} · ${inv.invoice_number}`,
        amount: `$${inv.total.toLocaleString()}`,
        time: formatDistanceToNow(new Date(inv.created_at), { addSuffix: true }),
        timestamp: new Date(inv.created_at),
        icon: isPaid ? CheckCircle2 : FileText,
        iconColor: isPaid ? 'text-success' : inv.status === 'overdue' ? 'text-destructive' : 'text-warning',
        iconBg: isPaid ? 'bg-success/10' : inv.status === 'overdue' ? 'bg-destructive/10' : 'bg-warning/10',
      });
    });

    // Latest 2 projects
    projects.slice(0, 2).forEach(p => {
      items.push({
        id: `proj-${p.id}`,
        type: 'project',
        title: p.status === 'completed' ? 'Project Completed' : 'Project Created',
        description: `${p.name} · ${p.client_name}`,
        time: formatDistanceToNow(new Date(p.created_at), { addSuffix: true }),
        timestamp: new Date(p.created_at),
        icon: p.status === 'completed' ? CheckCircle2 : FolderKanban,
        iconColor: p.status === 'completed' ? 'text-success' : 'text-accent',
        iconBg: p.status === 'completed' ? 'bg-success/10' : 'bg-accent/10',
      });
    });

    // Sort by most recent
    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 6);
  }, [clients, invoices, projects]);

  return (
    <div className="bg-card p-6 rounded-xl shadow-soft border border-border/50 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">Latest updates from your business</p>
        </div>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {!loading && activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
          <FileSignature className="h-8 w-8 opacity-20" />
          <p className="text-sm">No activity yet. Add clients or create invoices to see activity here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div
              key={activity.id}
              className={cn(
                'flex items-start gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors',
                'animate-slide-in-right'
              )}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className={cn('p-2 rounded-lg shrink-0', activity.iconBg)}>
                <activity.icon className={cn('h-4 w-4', activity.iconColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{activity.title}</p>
                  {activity.amount && (
                    <span className="text-sm font-semibold text-success shrink-0">{activity.amount}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
