import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SettingsRowProps {
  label: string;
  sublabel?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Label / sub-label on the left, control on the right.
 * Mirrors the prototype's `.settings-row` flex row.
 */
export function SettingsRow({
  label,
  sublabel,
  children,
  className,
}: SettingsRowProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 border-b border-border/40 py-2.5 last:border-b-0',
        className,
      )}
    >
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-foreground">{label}</div>
        {sublabel && (
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {sublabel}
          </div>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
