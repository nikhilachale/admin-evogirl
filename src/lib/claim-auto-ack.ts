import type { Ticket, TicketMessage } from '@/types/domain';

/** Stable id so we never double-insert the acknowledgement on re-hydrate. */
export const CLAIM_ACKNOWLEDGEMENT_MESSAGE_ID = 'msg-auto-claim-ack';

export const CLAIM_FIRST_RESPONSE_TEXT =
  "We've received your quality promise claim. Our team typically replies within 2 business days. If we need photos or order details, we'll reach out in this thread. Thank you for your patience — evogirl support.";

/**
 * Ensures every ticket has a first public agent acknowledgement (Zendesk-style
 * auto-reply). Safe to run on hydrate and after loading from localStorage.
 */
export function ensureClaimAcknowledgementMessages(tickets: Ticket[]): Ticket[] {
  return tickets.map((ticket) => {
    if (
      ticket.messages.some((m) => m.id === CLAIM_ACKNOWLEDGEMENT_MESSAGE_ID)
    ) {
      return ticket;
    }
    const firstCustomerIdx = ticket.messages.findIndex(
      (m) => m.from === 'customer',
    );
    const insertAt = firstCustomerIdx >= 0 ? firstCustomerIdx + 1 : 0;
    const ack: TicketMessage = {
      id: CLAIM_ACKNOWLEDGEMENT_MESSAGE_ID,
      from: 'agent',
      text: CLAIM_FIRST_RESPONSE_TEXT,
      at: ticket.createdAt + 60_000,
    };
    const messages = [...ticket.messages];
    messages.splice(insertAt, 0, ack);
    return { ...ticket, messages };
  });
}
