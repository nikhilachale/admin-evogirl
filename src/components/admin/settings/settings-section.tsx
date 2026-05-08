import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SettingsSectionProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/**
 * A bordered card that groups related settings rows.
 * Mirrors the prototype's `.settings-section` block.
 */
export const SettingsSection = forwardRef<HTMLDivElement, SettingsSectionProps>(
  ({ title, subtitle, children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl border border-border bg-card/40 p-5',
        className,
      )}
      {...props}
    >
      <div className="mb-3.5">
        <h3 className="text-[13px] font-extrabold leading-tight text-foreground">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div>{children}</div>
    </div>
  ),
);
SettingsSection.displayName = 'SettingsSection';
