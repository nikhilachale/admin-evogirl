import { useEffect } from 'react';
import { useTicketsStore } from '@/store/tickets';
import { applyVisibleTicketFilters, sortQueueTickets } from '@/components/admin/tickets/ticket-filtering';

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

      const visible = sortQueueTickets(
        applyVisibleTicketFilters(tickets, filters, activeView),
      );
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
        if (
          t &&
          t.status !== 'resolved' &&
          t.status !== 'rejected' &&
          t.status !== 'replacement-issued'
        ) {
          e.preventDefault();
          const hasRisk =
            t.dupCheck.status !== 'ok' ||
            t.riskStatus !== 'normal' ||
            Boolean(t.aiReport?.flags.length) ||
            Boolean(t.issueAttachments?.some((attachment) => !attachment.reviewed));
          if (
            hasRisk &&
            !window.confirm(
              `Approve ${selectedId} even though it has risk or incomplete verification?`,
            )
          ) {
            return;
          }
          approve(selectedId);
        }
      } else if (e.key === 'x' && selectedId) {
        const t = tickets.find((x) => x.id === selectedId);
        if (
          t &&
          t.status !== 'resolved' &&
          t.status !== 'rejected' &&
          t.status !== 'replacement-issued'
        ) {
          e.preventDefault();
          const reason = window.prompt(`Reason for rejecting ${selectedId}`);
          if (
            reason?.trim() &&
            window.confirm(`Reject ${selectedId} with this reason?`)
          ) {
            reject(selectedId, 'other', reason);
          }
        }
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [tickets, filters, activeView, selectedId, select, approve, reject]);
}
