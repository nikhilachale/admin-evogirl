import { useToastStore } from '@/store/toast';
import { cn } from '@/lib/utils';

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] flex items-end justify-end p-4 sm:p-6">
      <div className="flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex animate-fade-up items-start gap-3 rounded-lg border bg-popover p-4 shadow-lg',
              t.tone === 'success' && 'border-success/40',
              t.tone === 'error' && 'border-destructive/40',
            )}
          >
            {t.icon && <span className="text-lg leading-none">{t.icon}</span>}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{t.title}</p>
              {t.description && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.description}
                </p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
