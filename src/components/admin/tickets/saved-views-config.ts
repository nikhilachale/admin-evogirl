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
const OPEN_STATUSES = new Set<Ticket['status']>(['pending', 'escalated']);

export const PRESET_VIEWS: PresetView[] = [
  {
    id: 'all-open',
    name: 'All open',
    filters: { status: 'all', issueType: 'all', search: '' },
    predicate: (t) => OPEN_STATUSES.has(t.status),
  },
  {
    id: 'snoozed',
    name: 'Snoozed',
    filters: { status: 'all', issueType: 'all', search: '' },
    predicate: (t) =>
      OPEN_STATUSES.has(t.status) &&
      typeof t.snoozedUntil === 'number' &&
      t.snoozedUntil > Date.now(),
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
    filters: { riskStatus: 'all', issueType: 'all', search: '' },
    predicate: (t) =>
      t.tag === 'FRAUD FLAG' ||
      t.riskStatus === 'fraud' ||
      t.riskStatus === 'duplicate' ||
      (t.aiReport?.flags.some((f) => FRAUD_AI_FLAGS.has(f)) ?? false),
  },
  {
    id: 'urgent-sla',
    name: 'Urgent SLA',
    filters: { status: 'all', priority: 'urgent', issueType: 'all', search: '' },
    predicate: (t) => OPEN_STATUSES.has(t.status),
  },
  {
    id: 'needs-evidence',
    name: 'Needs evidence',
    filters: {
      status: 'all',
      evidence: 'incomplete',
      issueType: 'all',
      search: '',
    },
    predicate: (t) => OPEN_STATUSES.has(t.status),
  },
  {
    id: 'attachments-review',
    name: 'Attachments review',
    filters: {
      status: 'all',
      attachments: 'unreviewed',
      issueType: 'all',
      search: '',
    },
    predicate: (t) => OPEN_STATUSES.has(t.status),
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

function normalizeFiltersShape(value: unknown): TicketsFilters | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (
    typeof v.status === 'string' &&
    typeof v.issueType === 'string' &&
    typeof v.search === 'string'
  ) {
    return {
      status: v.status as TicketsFilters['status'],
      issueType: v.issueType as TicketsFilters['issueType'],
      search: v.search,
      priority:
        typeof v.priority === 'string'
          ? (v.priority as TicketsFilters['priority'])
          : 'all',
      marketplace:
        typeof v.marketplace === 'string'
          ? (v.marketplace as TicketsFilters['marketplace'])
          : 'all',
      assignee:
        typeof v.assignee === 'string'
          ? (v.assignee as TicketsFilters['assignee'])
          : 'all',
      contactStatus:
        typeof v.contactStatus === 'string'
          ? (v.contactStatus as TicketsFilters['contactStatus'])
          : 'all',
      riskStatus:
        typeof v.riskStatus === 'string'
          ? (v.riskStatus as TicketsFilters['riskStatus'])
          : 'all',
      dupCheck:
        typeof v.dupCheck === 'string'
          ? (v.dupCheck as TicketsFilters['dupCheck'])
          : 'all',
      attachments:
        typeof v.attachments === 'string'
          ? (v.attachments as TicketsFilters['attachments'])
          : 'all',
      evidence:
        typeof v.evidence === 'string'
          ? (v.evidence as TicketsFilters['evidence'])
          : 'all',
    };
  }
  return null;
}

function normalizeSavedView(value: unknown): SavedView | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (typeof v.id !== 'string' || typeof v.name !== 'string') return null;
  const filters = normalizeFiltersShape(v.filters);
  if (!filters) return null;
  return { id: v.id, name: v.name, filters };
}

export function loadSavedViews(): SavedView[] {
  try {
    const raw = localStorage.getItem(SAVED_VIEWS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeSavedView)
      .filter((view): view is SavedView => Boolean(view));
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
