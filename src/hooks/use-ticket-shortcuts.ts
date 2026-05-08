import { useEffect } from 'react';
import { useTicketsStore } from '@/store/tickets';

/**
 * Wires the keyboard shortcuts the original prototype had:
 *  • j / ↓     next ticket
 *  • k / ↑     previous ticket
 *  • /         focus search
 *  • a         approve selected
 *  • x         reject selected
 *  • Esc       blur input
 */
export function useTicketShortcuts() {
  const tickets = useTicketsStore((s) => s.tickets);
  const filters = useTicketsStore((s) => s.filters);
  const selectedId = useTicketsStore((s) => s.selectedId);
  const select = useTicketsStore((s) => s.select);
  const approve = useTicketsStore((s) => s.approve);
  const reject = useTicketsStore((s) => s.reject);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        if (e.key === 'Escape') (e.target as HTMLElement).blur();
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        document.getElementById('ticket-search')?.focus();
        return;
      }

      const visible = tickets.filter((t) => {
        if (filters.status !== 'all' && t.status !== filters.status) return false;
        if (filters.type !== 'all' && t.type !== filters.type) return false;
        return true;
      });
      if (visible.length === 0) return;

      const idx = visible.findIndex((t) => t.id === selectedId);

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        const next = visible[Math.min(idx + 1, visible.length - 1)] ?? visible[0];
        select(next.id);
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = visible[Math.max(idx - 1, 0)] ?? visible[0];
        select(prev.id);
      } else if (e.key === 'a' && selectedId) {
        const t = tickets.find((x) => x.id === selectedId);
        if (t && t.status !== 'resolved' && t.status !== 'rejected') {
          e.preventDefault();
          approve(selectedId);
        }
      } else if (e.key === 'x' && selectedId) {
        const t = tickets.find((x) => x.id === selectedId);
        if (t && t.status !== 'resolved' && t.status !== 'rejected') {
          e.preventDefault();
          reject(selectedId);
        }
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [tickets, filters, selectedId, select, approve, reject]);
}
