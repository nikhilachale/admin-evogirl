import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useTicketsStore } from '@/store/tickets';
import { cn } from '@/lib/utils';
import { toast } from '@/store/toast';
import {
  PRESET_VIEWS,
  loadSavedViews,
  persistSavedViews,
  type SavedView,
} from './saved-views-config';
import { normalizeTicketsFilters } from './ticket-filtering';

export function SavedViewsRow() {
  const filters = useTicketsStore((s) => s.filters);
  const setFilters = useTicketsStore((s) => s.setFilters);
  const activeView = useTicketsStore((s) => s.activeView);
  const setActiveView = useTicketsStore((s) => s.setActiveView);

  const [savedViews, setSavedViews] = useState<SavedView[]>([]);

  // Hydrate saved views from localStorage on mount.
  useEffect(() => {
    setSavedViews(loadSavedViews());
  }, []);

  const updateSavedViews = (next: SavedView[]) => {
    setSavedViews(next);
    persistSavedViews(next);
  };

  const handleSelectPreset = (id: string) => {
    const preset = PRESET_VIEWS.find((p) => p.id === id);
    if (!preset) return;
    if (preset.filters) {
      // Snapshot the preset's field filters onto the store; the predicate
      // (if any) is applied separately in the list filter step.
      setFilters({
        ...normalizeTicketsFilters({}),
        ...preset.filters,
      });
    }
    setActiveView(id);
  };

  const handleSelectSaved = (view: SavedView) => {
    setFilters(view.filters);
    setActiveView(view.id);
  };

  const handleClearActive = () => {
    setActiveView(null);
    setFilters(normalizeTicketsFilters({}));
  };

  const handleSaveCurrent = () => {
    const name = window.prompt('Name this view');
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = `custom-${Date.now()}`;
    const next: SavedView[] = [
      ...savedViews,
      { id, name: trimmed, filters: { ...filters } },
    ];
    updateSavedViews(next);
    setActiveView(id);
    toast({
      icon: '★',
      title: 'View saved',
      description: `"${trimmed}" added to your saved views.`,
    });
  };

  const handleDeleteSaved = (
    e: React.MouseEvent<HTMLButtonElement>,
    id: string,
  ) => {
    e.stopPropagation();
    const next = savedViews.filter((v) => v.id !== id);
    updateSavedViews(next);
    if (activeView === id) setActiveView(null);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {PRESET_VIEWS.map((preset) => {
        const isActive = activeView === preset.id;
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() =>
              isActive ? handleClearActive() : handleSelectPreset(preset.id)
            }
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors',
              isActive
                ? 'border-primary/30 bg-primary/15 text-primary ring-1 ring-primary/30'
                : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <span>{preset.name}</span>
            {isActive && <X size={11} aria-hidden="true" />}
          </button>
        );
      })}

      {savedViews.map((view) => {
        const isActive = activeView === view.id;
        return (
          <span
            key={view.id}
            className={cn(
              'inline-flex items-center rounded-full border text-[11px] font-semibold transition-colors',
              isActive
                ? 'border-primary/30 bg-primary/15 text-primary ring-1 ring-primary/30'
                : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <button
              type="button"
              onClick={() =>
                isActive ? handleClearActive() : handleSelectSaved(view)
              }
              className="rounded-l-full py-1 pl-2.5 pr-1.5"
            >
              {view.name}
            </button>
            <button
              type="button"
              onClick={(e) => handleDeleteSaved(e, view.id)}
              aria-label={`Delete view ${view.name}`}
              className="rounded-r-full py-1 pl-0.5 pr-2 text-muted-foreground/70 hover:text-destructive"
            >
              <X size={11} aria-hidden="true" />
            </button>
          </span>
        );
      })}

      <button
        type="button"
        onClick={handleSaveCurrent}
        className="inline-flex items-center gap-1 rounded-full border border-dashed border-border bg-transparent px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
      >
        <Plus size={11} aria-hidden="true" />
        Save current
      </button>
    </div>
  );
}
