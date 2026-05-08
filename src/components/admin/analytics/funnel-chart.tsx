import { cn } from '@/lib/utils';
import type { FunnelStep } from '@/types/analytics';

const ACCENT_BG: Record<FunnelStep['accent'], string> = {
  purple: 'bg-brand-purple-mid',
  pink: 'bg-brand-pink',
  emerald: 'bg-emerald-400',
  gold: 'bg-brand-gold',
};

export function FunnelChart({ steps }: { steps: FunnelStep[] }) {
  return (
    <div className="flex flex-col gap-3 pt-1">
      {steps.map((step) => (
        <div key={step.label}>
          <div className="mb-1 flex justify-between text-[11px]">
            <span className="text-muted-foreground">{step.label}</span>
            <span className="font-bold text-foreground">{step.display}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
            <div
              className={cn('h-full rounded-full transition-all', ACCENT_BG[step.accent])}
              style={{ width: `${step.widthPct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
