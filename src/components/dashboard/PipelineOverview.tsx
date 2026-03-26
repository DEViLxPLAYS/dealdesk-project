import { cn } from '@/lib/utils';

const stages = [
  { name: 'New', count: 12, value: '$48,000', color: 'bg-muted-foreground' },
  { name: 'Qualified', count: 8, value: '$156,000', color: 'bg-primary' },
  { name: 'Proposal', count: 5, value: '$125,000', color: 'bg-accent' },
  { name: 'Negotiation', count: 3, value: '$89,000', color: 'bg-warning' },
  { name: 'Won', count: 15, value: '$312,000', color: 'bg-success' },
];

export function PipelineOverview() {
  const totalDeals = stages.reduce((acc, stage) => acc + stage.count, 0);

  return (
    <div className="bg-card p-6 rounded-xl shadow-soft border border-border/50 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Pipeline Overview</h3>
          <p className="text-sm text-muted-foreground">{totalDeals} total deals in pipeline</p>
        </div>
      </div>
      
      {/* Pipeline Bar */}
      <div className="flex h-3 rounded-full overflow-hidden mb-6">
        {stages.map((stage, index) => (
          <div
            key={stage.name}
            className={cn(stage.color, 'transition-all duration-500')}
            style={{ width: `${(stage.count / totalDeals) * 100}%` }}
          />
        ))}
      </div>

      {/* Stage Details */}
      <div className="grid grid-cols-5 gap-2">
        {stages.map((stage, index) => (
          <div
            key={stage.name}
            className="text-center animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={cn('h-2 w-2 rounded-full mx-auto mb-2', stage.color)} />
            <p className="text-xs font-medium text-muted-foreground">{stage.name}</p>
            <p className="text-lg font-bold text-foreground">{stage.count}</p>
            <p className="text-xs text-muted-foreground">{stage.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
