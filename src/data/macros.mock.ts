// Quick-reply macros for the ticket composer.
// These are agent-facing canned responses an agent can drop into the
// reply textarea. Picking a macro replaces the current textarea contents.

export interface Macro {
  id: string;
  label: string;
  text: string;
  category?: 'resolution' | 'evidence' | 'escalation' | 'verification';
  pinned?: boolean;
}

export const MACROS: Macro[] = [
  {
    id: 'replacement-dispatched',
    label: 'Replacement dispatched',
    category: 'resolution',
    pinned: true,
    text: 'Hi {customerName}, your replacement for order {orderId} has been approved. It should arrive in 2–3 days. Reference: {ticketId}.',
  },
  {
    id: 'request-photo',
    label: 'Request clearer photo',
    category: 'evidence',
    pinned: true,
    text: 'Hi {customerName}, could you share a clearer photo or video showing the issue with order {orderId}? Once we receive it, our next step is {nextStep}.',
  },
  {
    id: 'refund-processed',
    label: 'Refund processed',
    category: 'resolution',
    text: 'Hi {customerName}, your refund for order {orderId} has been processed. Funds usually reflect in 3–5 business days. Reference: {ticketId}.',
  },
  {
    id: 'apology-escalating',
    label: 'Apology + escalating',
    category: 'escalation',
    pinned: true,
    text: 'Hi {customerName}, apologies for the inconvenience. We are escalating ticket {ticketId} for {reason}. Our next step is {nextStep}.',
  },
  {
    id: 'request-order-id',
    label: 'Request order ID',
    category: 'verification',
    pinned: true,
    text: "Hi {customerName}, we'll need the order ID to verify your claim. You can reply here with the marketplace order ID.",
  },
  {
    id: 'voucher-sent',
    label: 'Voucher sent',
    category: 'resolution',
    text: 'Hi {customerName}, your voucher for ticket {ticketId} has been emailed and sent by SMS. It is valid for 90 days.',
  },
  {
    id: 'attachment-reviewed',
    label: 'Attachment reviewed',
    category: 'evidence',
    text: 'Hi {customerName}, thanks for sharing the photos for order {orderId}. We have reviewed the attachment and our next step is {nextStep}.',
  },
  {
    id: 'photo-mismatch-follow-up',
    label: 'Photo mismatch follow-up',
    category: 'evidence',
    text: 'Hi {customerName}, the photos shared do not clearly match order {orderId}. Please send a photo of the product with the order packaging or invoice visible so we can complete verification.',
  },
];
