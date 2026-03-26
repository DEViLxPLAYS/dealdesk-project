import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  variant?: 'default' | 'primary' | 'accent' | 'success';
}

export function StatCard({ title, value, change, icon: Icon, variant = 'default' }: StatCardProps) {
  const bgVariants = {
    default: 'bg-card',
    primary: 'gradient-primary',
    accent: 'gradient-accent',
    success: 'gradient-success',
  };

  const textVariants = {
    default: 'text-foreground',
    primary: 'text-primary-foreground',
    accent: 'text-accent-foreground',
    success: 'text-success-foreground',
  };

  const subtextVariants = {
    default: 'text-muted-foreground',
    primary: 'text-primary-foreground/80',
    accent: 'text-accent-foreground/80',
    success: 'text-success-foreground/80',
  };

  const iconBgVariants = {
    default: 'bg-primary/10 text-primary',
    primary: 'bg-primary-foreground/20 text-primary-foreground',
    accent: 'bg-accent-foreground/20 text-accent-foreground',
    success: 'bg-success-foreground/20 text-success-foreground',
  };

  return (
    <div
      className={cn(
        'p-6 rounded-xl shadow-soft border border-border/50 animate-fade-in',
        bgVariants[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={cn('text-sm font-medium', subtextVariants[variant])}>{title}</p>
          <p className={cn('text-3xl font-bold mt-2', textVariants[variant])}>{value}</p>
          {change !== undefined && (
            <p
              className={cn(
                'text-sm mt-2 font-medium',
                change >= 0 ? 'text-success' : 'text-destructive',
                variant !== 'default' && (change >= 0 ? 'text-success-foreground' : 'text-destructive-foreground')
              )}
            >
              {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% from last month
            </p>
          )}
        </div>
        <div className={cn('p-3 rounded-lg', iconBgVariants[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
