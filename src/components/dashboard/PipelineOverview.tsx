import { cn } from '@/lib/utils';
import { useDeals } from '@/hooks/useDeals';
import { Loader2, TrendingUp } from 'lucide-react';

export function PipelineOverview() {
  const { stageStats, totalDeals, totalValue, loading } = useDeals();

  // Only show the 5 active (non-lost) stages prominently; include lost if present
  const visibleStages = stageStats.filter(s => s.count > 0 || s.id !== 'closed-lost');
  const activeForBar  = stageStats.filter(s => s.count > 0);

  return (
    <div className="bg-card p-6 rounded-xl shadow-soft border border-border/50 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Pipeline Overview</h3>
          <p className="text-sm text-muted-foreground">
            {loading ? 'Loading…' : `${totalDeals} total deal${totalDeals !== 1 ? 's' : ''} · $${totalValue.toLocaleString()} pipeline value`}
          </p>
        </div>
        {loading
          ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          : <TrendingUp className="h-4 w-4 text-muted-foreground" />
        }
      </div>

      {/* Pipeline Bar */}
      {totalDeals === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
          <p className="text-sm">No deals yet. Add a deal in the Pipeline page.</p>
        </div>
      ) : (
        <>
          <div className="flex h-3 rounded-full overflow-hidden mb-6 gap-px">
            {activeForBar.map((stage) => (
              <div
                key={stage.id}
                className={cn(stage.color, 'transition-all duration-700')}
                style={{ width: `${(stage.count / totalDeals) * 100}%` }}
                title={`${stage.shortName}: ${stage.count} deal${stage.count !== 1 ? 's' : ''}`}
              />
            ))}
          </div>

          {/* Stage Details */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {stageStats.map((stage, index) => (
              <div
                key={stage.id}
                className="text-center animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={cn('h-2 w-2 rounded-full mx-auto mb-2', stage.color)} />
                <p className="text-[11px] font-medium text-muted-foreground leading-tight">{stage.shortName}</p>
                <p className={cn(
                  'text-lg font-bold',
                  stage.count > 0 ? 'text-foreground' : 'text-muted-foreground/40'
                )}>
                  {stage.count}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {stage.value > 0 ? `$${stage.value.toLocaleString()}` : '—'}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
