import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  className?: string;
  children: ReactNode;
}

export function ChartCard({ title, subtitle, className, children }: ChartCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card/50 p-4',
        className,
      )}
    >
      <div className="text-sm font-bold tracking-wide text-foreground">
        {title}
      </div>
      {subtitle ? (
        <div className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</div>
      ) : null}
      <div className="mt-3">{children}</div>
    </div>
  );
}
