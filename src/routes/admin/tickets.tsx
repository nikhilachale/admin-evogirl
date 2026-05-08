import { useEffect } from 'react';
import { useTicketsStore } from '@/store/tickets';
import { useTicketShortcuts } from '@/hooks/use-ticket-shortcuts';
import { MOCK_TICKETS } from '@/data/tickets.mock';
import { TicketsFilters } from '@/components/admin/tickets/tickets-filters';
import { TicketsList } from '@/components/admin/tickets/tickets-list';
import { TicketDetail } from '@/components/admin/tickets/ticket-detail';

export function TicketsPage() {
  const hydrate = useTicketsStore((s) => s.hydrate);
  const tickets = useTicketsStore((s) => s.tickets);

  // Replace with a real fetch when the backend is ready.
  useEffect(() => {
    if (tickets.length === 0) hydrate(MOCK_TICKETS);
  }, [hydrate, tickets.length]);

  useTicketShortcuts();

  return (
    <div className="grid h-screen grid-cols-[360px_1fr]">
      <section className="flex flex-col overflow-hidden border-r">
        <TicketsFilters />
        <div className="flex-1 overflow-y-auto">
          <TicketsList />
        </div>
      </section>
      <section className="overflow-hidden">
        <TicketDetail />
      </section>
    </div>
  );
}
