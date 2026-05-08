import { cn } from '@/lib/utils';
import type { AnalyticsRange, AnalyticsRangeOption } from '@/types/analytics';

const OPTIONS: AnalyticsRangeOption[] = [
  { key: '7', label: '7D' },
  { key: '30', label: '30D' },
  { key: '90', label: '90D' },
  { key: 'ytd', label: 'YTD' },
];

interface RangeToggleProps {
  value: AnalyticsRange;
  onChange: (next: AnalyticsRange) => void;
}

export function RangeToggle({ value, onChange }: RangeToggleProps) {
  return (
    <div className="flex gap-1 rounded-[9px] border border-border bg-foreground/[0.03] p-1">
      {OPTIONS.map((opt) => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={cn(
              'rounded-md px-3 py-1.5 text-[11px] font-bold tracking-wider transition-colors',
              active
                ? 'bg-brand-gold/15 text-brand-gold'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
