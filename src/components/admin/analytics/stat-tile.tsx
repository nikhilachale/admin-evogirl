import { cn } from '@/lib/utils';
import type { AnalyticsStat } from '@/types/analytics';

const ACCENT_CLASS: Record<AnalyticsStat['accent'], string> = {
  gold: 'text-brand-gold',
  pink: 'text-brand-pink',
  emerald: 'text-emerald-400',
  'purple-light': 'text-brand-purple-light',
};

export function StatTile({ stat }: { stat: AnalyticsStat }) {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-4">
      <div
        className={cn(
          'font-display text-3xl font-bold leading-none',
          ACCENT_CLASS[stat.accent],
        )}
      >
        {stat.value}
      </div>
      <div className="mt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {stat.label}
      </div>
      <div
        className={cn(
          'mt-2 text-[11px] font-semibold',
          stat.direction === 'up' ? 'text-emerald-400' : 'text-brand-pink',
        )}
      >
        {stat.change}
      </div>
    </div>
  );
}
