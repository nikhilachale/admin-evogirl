// Saved-views logic for the tickets queue.
//
// Design choice: option (b) — we keep `filters` as a simple field-equality
// shape on the store, and add a separate `activeView` slice. View predicates
// live here so list rendering and the j/k shortcut hook can share the
// "currently visible" computation.

import type { Ticket } from '@/types/domain';
import type { TicketsFilters } from '@/store/tickets';

export interface SavedView {
  id: string;
  name: string;
  // Snapshot of the field filters at the time the view was saved.
  filters: TicketsFilters;
}

export interface PresetView {
  id: string;
  name: string;
  // Optional snapshot of field filters this preset applies (ones that fit
  // the simple shape — e.g. status='pending' or status='rejected').
  filters?: Partial<TicketsFilters>;
  // Optional extra predicate for views whose semantics can't be expressed
  // through the simple field filter shape.
  predicate?: (t: Ticket) => boolean;
}

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const FRAUD_AI_FLAGS = new Set(['fraud', 'suspicious', 'duplicate']);

export const PRESET_VIEWS: PresetView[] = [
  {
    id: 'all-open',
    name: 'All open',
    filters: { status: 'pending', issueType: 'all', search: '' },
  },
  {
    id: 'pending-review',
    name: 'Pending review',
    filters: { status: 'pending', issueType: 'all', search: '' },
    predicate: (t) =>
      !t.aiReport || !t.aiReport.flags.some((f) => FRAUD_AI_FLAGS.has(f)),
  },
  {
    id: 'fraud-flagged',
    name: 'Fraud flagged',
    predicate: (t) =>
      t.tag === 'FRAUD FLAG' ||
      t.riskStatus === 'fraud' ||
      t.riskStatus === 'duplicate' ||
      (t.aiReport?.flags.some((f) => FRAUD_AI_FLAGS.has(f)) ?? false),
  },
  {
    id: 'resolved-week',
    name: 'Resolved this week',
    filters: { status: 'resolved', issueType: 'all', search: '' },
    predicate: (t) =>
      t.status === 'resolved' &&
      typeof t.resolvedAt === 'number' &&
      Date.now() - t.resolvedAt <= ONE_WEEK_MS,
  },
  {
    id: 'rejected',
    name: 'Rejected',
    filters: { status: 'rejected', issueType: 'all', search: '' },
  },
];

export function getPresetView(id: string | null): PresetView | undefined {
  if (!id) return undefined;
  return PRESET_VIEWS.find((v) => v.id === id);
}

export const SAVED_VIEWS_STORAGE_KEY = 'evogirl.tickets.views';

function isFiltersShape(value: unknown): value is TicketsFilters {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.status === 'string' &&
    typeof v.issueType === 'string' &&
    typeof v.search === 'string'
  );
}

function isSavedView(value: unknown): value is SavedView {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    isFiltersShape(v.filters)
  );
}

export function loadSavedViews(): SavedView[] {
  try {
    const raw = localStorage.getItem(SAVED_VIEWS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSavedView);
  } catch {
    return [];
  }
}

export function persistSavedViews(views: SavedView[]): void {
  try {
    localStorage.setItem(SAVED_VIEWS_STORAGE_KEY, JSON.stringify(views));
  } catch {
    // Storage quota / disabled — ignore; saved views are best-effort.
  }
}

/**
 * Apply a preset's predicate (if any). Field-equality parts are applied
 * via the regular store filters (preset.filters is snapshotted onto the
 * store when the chip is clicked).
 */
export function applyPresetPredicate(
  tickets: Ticket[],
  activeView: string | null,
): Ticket[] {
  const preset = getPresetView(activeView);
  if (!preset?.predicate) return tickets;
  return tickets.filter(preset.predicate);
}
