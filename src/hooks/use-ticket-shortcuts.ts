import { useEffect } from 'react';
import { useTicketsStore } from '@/store/tickets';
import { applyPresetPredicate } from '@/components/admin/tickets/saved-views-config';
import type { Ticket } from '@/types/domain';

/**
 * Wires the keyboard shortcuts the original prototype had:
 *  • j / ↓     next ticket
 *  • k / ↑     previous ticket
 *  • /         focus search
 *  • a         approve selected
 *  • x         reject selected
 *  • Esc       blur input
 */

// Mirrors the wider search predicate in tickets-list.tsx — kept in sync so
// j/k stays anchored to the same visible queue.
function matchesSearch(t: Ticket, query: string): boolean {
  const q = query.toLowerCase();
  if (t.id.toLowerCase().includes(q)) return true;
  if (t.customer.name.toLowerCase().includes(q)) return true;
  if (t.customer.phone.toLowerCase().includes(q)) return true;
  if (t.customer.email && t.customer.email.toLowerCase().includes(q))
    return true;
  if (t.order.id.toLowerCase().includes(q)) return true;
  if (t.order.sku.toLowerCase().includes(q)) return true;
  if (t.order.product.toLowerCase().includes(q)) return true;
  if (t.order.marketplace.toLowerCase().includes(q)) return true;
  if (t.tag && t.tag.toLowerCase().includes(q)) return true;
  if (t.aiReport?.flags.some((f) => f.toLowerCase().includes(q))) return true;
  return false;
}

export function useTicketShortcuts() {
  const tickets = useTicketsStore((s) => s.tickets);
  const filters = useTicketsStore((s) => s.filters);
  const activeView = useTicketsStore((s) => s.activeView);
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

      const fieldFiltered = tickets.filter((t) => {
        if (filters.status !== 'all' && t.status !== filters.status)
          return false;
        if (filters.type !== 'all' && t.type !== filters.type) return false;
        if (filters.search && !matchesSearch(t, filters.search)) return false;
        return true;
      });
      const visible = applyPresetPredicate(fieldFiltered, activeView);
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
  }, [tickets, filters, activeView, selectedId, select, approve, reject]);
}
