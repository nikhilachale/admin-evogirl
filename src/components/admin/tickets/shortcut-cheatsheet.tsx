import { useEffect, useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { Kbd } from './kbd';

const SHORTCUTS = [
  { keys: ['j', '↓'], label: 'Next ticket' },
  { keys: ['k', '↑'], label: 'Previous ticket' },
  { keys: ['/'], label: 'Focus search' },
  { keys: ['a'], label: 'Approve selected ticket' },
  { keys: ['x'], label: 'Reject selected ticket' },
  { keys: ['Esc'], label: 'Blur fields or close this panel' },
];

export function ShortcutCheatsheet() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (event.key === '?') {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Show ticket shortcuts"
        className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <HelpCircle size={12} aria-hidden="true" />
        <span>Shortcuts</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-background/70 px-4 py-24 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Ticket keyboard shortcuts"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-lg border border-border bg-card p-4 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">Ticket shortcuts</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close shortcuts"
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X size={14} />
              </button>
            </div>
            <div className="mt-3 divide-y divide-border">
              {SHORTCUTS.map((shortcut) => (
                <div
                  key={shortcut.label}
                  className="flex items-center justify-between gap-3 py-2 text-xs"
                >
                  <span className="text-muted-foreground">
                    {shortcut.label}
                  </span>
                  <span className="flex items-center gap-1">
                    {shortcut.keys.map((key) => (
                      <Kbd key={key}>{key}</Kbd>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
