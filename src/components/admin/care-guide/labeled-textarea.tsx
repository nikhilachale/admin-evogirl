import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface LabeledTextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

/**
 * Wraps the prototype's `.admin-label` + `.admin-textarea` pair (see CSS at
 * promise-admin.html lines 473-474) into one composed control. Tailored to
 * this feature so we can keep `src/components/ui/` to broadly reusable
 * primitives.
 */
export const LabeledTextarea = forwardRef<
  HTMLTextAreaElement,
  LabeledTextareaProps
>(({ label, className, rows = 4, ...props }, ref) => (
  <label className="flex flex-col gap-1.5">
    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
      {label}
    </span>
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        'w-full resize-y rounded-lg border border-border bg-background/40 px-3 py-2.5 text-sm text-foreground transition-colors placeholder:text-muted-foreground/70 focus:border-brand-gold/50 focus:outline-none focus:ring-1 focus:ring-brand-gold/30',
        className,
      )}
      {...props}
    />
  </label>
));

LabeledTextarea.displayName = 'LabeledTextarea';
