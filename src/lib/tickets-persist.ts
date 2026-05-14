import type { Ticket } from '@/types/domain';

/** Shared with admin persistence and /help ticket lookup (same browser). */
export const TICKETS_SNAPSHOT_KEY = 'promise-admin:tickets-snapshot-v1';

let persistTimer: ReturnType<typeof setTimeout> | null = null;

export function loadTicketsSnapshot(): Ticket[] | null {
  try {
    const raw = localStorage.getItem(TICKETS_SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed as Ticket[];
  } catch {
    return null;
  }
}

/** Debounced write so rapid store updates do not thrash localStorage. */
export function scheduleTicketsSnapshotSave(tickets: Ticket[]): void {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try {
      localStorage.setItem(TICKETS_SNAPSHOT_KEY, JSON.stringify(tickets));
    } catch {
      // Quota / private mode — ignore.
    }
  }, 300);
}
