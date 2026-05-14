import { useEffect } from 'react';
import { useTicketsStore } from '@/store/tickets';
import { useTicketShortcuts } from '@/hooks/use-ticket-shortcuts';
import { MOCK_TICKETS } from '@/data/tickets.mock';
import {
  loadTicketsSnapshot,
  scheduleTicketsSnapshotSave,
} from '@/lib/tickets-persist';
import { TicketsFilters } from '@/components/admin/tickets/tickets-filters';
import { TicketsList } from '@/components/admin/tickets/tickets-list';
import { TicketDetail } from '@/components/admin/tickets/ticket-detail';

export function TicketsPage() {
  const hydrate = useTicketsStore((s) => s.hydrate);
  const tickets = useTicketsStore((s) => s.tickets);

  // Replace with a real fetch when the backend is ready. Prefer a local
  // snapshot so /help status lookup stays in sync on the same browser.
  useEffect(() => {
    if (tickets.length > 0) return;
    const saved = loadTicketsSnapshot();
    if (saved && saved.length > 0) hydrate(saved);
    else hydrate(MOCK_TICKETS);
  }, [hydrate, tickets.length]);

  useEffect(() => {
    return useTicketsStore.subscribe((state) => {
      if (state.tickets.length === 0) return;
      scheduleTicketsSnapshotSave(state.tickets);
    });
  }, []);

  useTicketShortcuts();

  return (
    <div className="grid h-screen grid-cols-[minmax(320px,400px)_1fr] bg-background">
      <section className="flex min-w-0 flex-col overflow-hidden border-r bg-card/35">
        <TicketsFilters />
        <div className="flex-1 overflow-y-auto">
          <TicketsList />
        </div>
      </section>
      <section className="min-w-0 overflow-hidden">
        <TicketDetail />
      </section>
    </div>
  );
}
