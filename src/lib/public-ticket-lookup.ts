import { MOCK_TICKETS } from '@/data/tickets.mock';
import type { Ticket, TicketStatus } from '@/types/domain';
import { loadTicketsSnapshot } from '@/lib/tickets-persist';

const STATUS_CUSTOMER_LABEL: Record<TicketStatus, string> = {
  pending: 'In review',
  escalated: 'Being reviewed (priority)',
  resolved: 'Closed — resolved',
  rejected: 'Closed — not approved',
  'replacement-issued': 'Closed — replacement in progress',
};

const CONTACT_CUSTOMER_LABEL: Record<Ticket['contactStatus'], string> = {
  'customer-notified': 'We have updated you',
  'awaiting-customer-reply': 'Waiting for your reply or photos',
  'reply-received': 'We received your latest message',
  'no-response': 'No reply from you yet',
  'follow-up-scheduled': 'Follow-up in progress',
};

export function getTicketsForPublicLookup(): Ticket[] {
  const saved = loadTicketsSnapshot();
  if (saved && saved.length > 0) return saved;
  return MOCK_TICKETS;
}

export interface PublicTicketStatus {
  found: true;
  id: string;
  status: TicketStatus;
  statusLabel: string;
  contactLabel: string;
  orderId: string;
  productLabel: string;
  lastActivityAt: number;
  lastActivityLabel: string;
}

export interface PublicTicketNotFound {
  found: false;
}

export type PublicTicketLookupResult = PublicTicketStatus | PublicTicketNotFound;

function lastActivityAt(ticket: Ticket): number {
  const msgTimes = ticket.messages.map((m) => m.at);
  const noteTimes = ticket.notes.map((n) => n.at);
  const times = [
    ticket.createdAt,
    ticket.resolvedAt,
    ...msgTimes,
    ...noteTimes,
  ].filter((n): n is number => typeof n === 'number');
  return times.length > 0 ? Math.max(...times) : ticket.createdAt;
}

function normalizeTicketLookupKey(raw: string): string {
  return raw.trim().toUpperCase().replace(/^TKT-/, '');
}

export function lookupPublicTicketById(
  rawId: string,
): PublicTicketLookupResult {
  const needle = normalizeTicketLookupKey(rawId);
  if (!needle) return { found: false };

  const pool = getTicketsForPublicLookup();
  const ticket = pool.find(
    (t) => normalizeTicketLookupKey(t.id) === needle,
  );
  if (!ticket) return { found: false };

  const lastAt = lastActivityAt(ticket);
  return {
    found: true,
    id: ticket.id,
    status: ticket.status,
    statusLabel: STATUS_CUSTOMER_LABEL[ticket.status],
    contactLabel: CONTACT_CUSTOMER_LABEL[ticket.contactStatus],
    orderId: ticket.order.id,
    productLabel: ticket.order.product,
    lastActivityAt: lastAt,
    lastActivityLabel: new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(lastAt),
  };
}
