// Quick-reply macros for the ticket composer.
// These are agent-facing canned responses an agent can drop into the
// reply textarea. Picking a macro replaces the current textarea contents.

export interface Macro {
  id: string;
  label: string;
  text: string;
}

export const MACROS: Macro[] = [
  {
    id: 'replacement-dispatched',
    label: 'Replacement dispatched',
    text: 'Replacement dispatched — should arrive in 2–3 days.',
  },
  {
    id: 'request-photo',
    label: 'Request clearer photo',
    text: 'Could you share a clearer photo showing the damage?',
  },
  {
    id: 'refund-processed',
    label: 'Refund processed',
    text: 'Your refund is processed; funds reflect in 3–5 business days.',
  },
  {
    id: 'apology-escalating',
    label: 'Apology + escalating',
    text: 'Apologies for the inconvenience — escalating now.',
  },
  {
    id: 'request-order-id',
    label: 'Request order ID',
    text: "We'll need the order ID to verify your claim.",
  },
  {
    id: 'voucher-sent',
    label: 'Voucher sent',
    text: "Voucher emailed and SMS'd. Valid for 90 days.",
  },
];
