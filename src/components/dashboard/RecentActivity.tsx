import { CheckCircle2, FileText, UserPlus, FileSignature } from 'lucide-react';
import { cn } from '@/lib/utils';

const activities = [
  {
    id: 1,
    type: 'invoice_paid',
    title: 'Invoice Paid',
    description: 'TechStartup Inc paid invoice #INV-2024-001',
    amount: '$4,400',
    time: '2 hours ago',
    icon: CheckCircle2,
    iconColor: 'text-success',
    iconBg: 'bg-success/10',
  },
  {
    id: 2,
    type: 'new_lead',
    title: 'New Lead',
    description: 'Marcus Chen from InnovateCo added',
    time: '4 hours ago',
    icon: UserPlus,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
  },
  {
    id: 3,
    type: 'contract_signed',
    title: 'Contract Signed',
    description: 'GlobalTech Solutions signed service agreement',
    time: '6 hours ago',
    icon: FileSignature,
    iconColor: 'text-accent',
    iconBg: 'bg-accent/10',
  },
  {
    id: 4,
    type: 'invoice_sent',
    title: 'Invoice Sent',
    description: 'Invoice #INV-2024-003 sent to Creative Media',
    amount: '$6,600',
    time: '1 day ago',
    icon: FileText,
    iconColor: 'text-warning',
    iconBg: 'bg-warning/10',
  },
];

export function RecentActivity() {
  return (
    <div className="bg-card p-6 rounded-xl shadow-soft border border-border/50 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">Latest updates from your business</p>
        </div>
      </div>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className={cn(
              'flex items-start gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors',
              'animate-slide-in-right'
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={cn('p-2 rounded-lg', activity.iconBg)}>
              <activity.icon className={cn('h-5 w-5', activity.iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">{activity.title}</p>
                {activity.amount && (
                  <span className="text-sm font-semibold text-success">{activity.amount}</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
              <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
