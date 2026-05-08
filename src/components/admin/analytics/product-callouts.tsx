import { cn } from '@/lib/utils';
import type { ProductCallout } from '@/types/analytics';

interface Props {
  callouts: ProductCallout[];
}

export function ProductCallouts({ callouts }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
      {callouts.map((c) => (
        <div
          key={c.name}
          className={cn(
            'rounded-2xl border p-4',
            c.tone === 'top'
              ? 'border-emerald-400/20 bg-gradient-to-br from-emerald-400/[0.08] to-emerald-400/[0.02]'
              : 'border-brand-pink/20 bg-gradient-to-br from-brand-pink/[0.08] to-brand-pink/[0.02]',
          )}
        >
          <div
            className={cn(
              'mb-1.5 text-[9px] font-extrabold tracking-[0.15em]',
              c.tone === 'top' ? 'text-emerald-400' : 'text-brand-pink',
            )}
          >
            {c.badge}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-foreground/[0.06] text-2xl">
              {c.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-extrabold text-foreground">{c.name}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">{c.meta}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
