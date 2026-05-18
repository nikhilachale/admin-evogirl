import { create } from 'zustand';
import type {
  ClaimEvidenceChecklist,
  CustomerContactStatus,
  DupCheckStatus,
  Marketplace,
  OrderLookupStatus,
  RejectionReasonCategory,
  Ticket,
  TicketAction,
  TicketChannel,
  TicketIntake,
  TicketMessage,
  TicketRequestType,
  TicketStatus,
  TicketIssueType,
  TicketRiskStatus,
} from '@/types/domain';
import { toast } from './toast';
import { checkDuplicateClaim } from '@/lib/api/marketplaces';
import { ensureClaimAcknowledgementMessages } from '@/lib/claim-auto-ack';
import { nextTicketId, newCustomerId } from '@/lib/id-generators';

export interface TicketsFilters {
  status: TicketStatus | 'all';
  issueType: TicketIssueType | 'all';
  search: string;
  priority: Ticket['priority'] | 'all';
  marketplace: Marketplace | 'all';
  assignee: string | 'all' | 'unassigned';
  contactStatus: CustomerContactStatus | 'all';
  riskStatus: TicketRiskStatus | 'all';
  dupCheck: DupCheckStatus | 'all';
  attachments: 'all' | 'has' | 'none' | 'unreviewed' | 'suspicious';
  evidence: keyof ClaimEvidenceChecklist | 'incomplete' | 'all';
  channel: TicketChannel | 'all';
}

/** Payload for the manual "log a contact" intake flow. */
export interface CreateTicketInput {
  channel: TicketChannel;
  loggedBy: string;
  customer: { name: string; phone: string; email?: string };
  order: {
    id: string;
    marketplace: Marketplace;
    product: string;
    sku?: string;
    amount?: number;
    purchasedAt?: number;
    deliveredAt?: number;
  };
  requestType: TicketRequestType;
  issueType: TicketIssueType;
  priority?: Ticket['priority'];
  issueDescription?: string;
  rawContact?: string;
  productUrl?: string;
  lookupStatus: OrderLookupStatus;
  matchedOrderId?: string;
}

interface TicketsState {
  tickets: Ticket[];
  selectedId: string | null;
  // Multi-select for bulk actions. Native Set — always assign a NEW Set
  // so Zustand sees the change.
  selectedIds: Set<string>;
  filters: TicketsFilters;
  // Active saved/preset view id. Predicate logic lives in
  // `components/admin/tickets/saved-views.ts` — see option (b) note there.
  activeView: string | null;

  select: (id: string | null) => void;
  setFilter: <K extends keyof TicketsFilters>(
    key: K,
    value: TicketsFilters[K],
  ) => void;
  setFilters: (filters: TicketsFilters) => void;
  setActiveView: (id: string | null) => void;

  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  bulkReject: (category?: RejectionReasonCategory, reason?: string) => void;
  bulkFlagFraud: (reason?: string) => void;

  approve: (id: string) => void;
  reject: (
    id: string,
    category?: RejectionReasonCategory,
    reason?: string,
  ) => void;
  reopen: (id: string, reason?: string) => void;
  resolve: (id: string) => void;
  issueReplacement: (id: string) => void;
  issueRefund: (id: string) => void;
  issueVoucher: (id: string, amount: number) => void;
  flagFraud: (id: string) => void;
  escalate: (id: string) => void;
  reassign: (id: string, agent: string) => void;
  runDupCheck: (id: string) => Promise<void>;
  updateAttachmentReview: (
    ticketId: string,
    attachmentId: string,
    patch: Partial<NonNullable<Ticket['issueAttachments']>[number]>,
  ) => void;
  updateEvidence: (
    ticketId: string,
    key: keyof ClaimEvidenceChecklist,
    value: boolean,
  ) => void;

  addMessage: (id: string, text: string) => void;
  addNote: (id: string, text: string) => void;

  createTicket: (input: CreateTicketInput) => string;

  snoozeTicket: (id: string, until: number) => void;
  clearSnooze: (id: string) => void;

  hydrate: (tickets: Ticket[]) => void;
}

function isTerminal(ticket: Ticket): boolean {
  return (
    ticket.status === 'resolved' ||
    ticket.status === 'rejected' ||
    ticket.status === 'replacement-issued'
  );
}

function canTransition(ticket: Ticket, action: TicketAction): boolean {
  if (action === 'reopen') return isTerminal(ticket);
  if (isTerminal(ticket)) return false;

  switch (ticket.status) {
    case 'pending':
      return ['approve', 'reject', 'escalate', 'resolve'].includes(action);
    case 'escalated':
      return ['approve', 'reject', 'resolve'].includes(action);
    default:
      return false;
  }
}

function createSystemNote(text: string, at = Date.now()): TicketMessage {
  return {
    id: crypto.randomUUID(),
    from: 'system',
    text,
    at,
  };
}

function formatRejection(category: RejectionReasonCategory, reason: string) {
  return `${REJECTION_REASON_LABEL[category]}: ${reason}`;
}

/** Single source of truth for the unfiltered queue state. */
const DEFAULT_FILTERS: TicketsFilters = {
  status: 'all',
  issueType: 'all',
  search: '',
  priority: 'all',
  marketplace: 'all',
  assignee: 'all',
  contactStatus: 'all',
  riskStatus: 'all',
  dupCheck: 'all',
  attachments: 'all',
  evidence: 'all',
  channel: 'all',
};

const REJECTION_REASON_LABEL: Record<RejectionReasonCategory, string> = {
  'duplicate-claim': 'Duplicate claim',
  'invalid-order': 'Invalid order',
  'outside-warranty-window': 'Outside warranty window',
  'insufficient-proof': 'Insufficient proof',
  'photo-mismatch': 'Photo mismatch',
  'product-not-covered': 'Product not covered',
  'suspected-fraud': 'Suspected fraud',
  other: 'Other',
};

export const useTicketsStore = create<TicketsState>((set, get) => ({
  tickets: [],
  selectedId: null,
  selectedIds: new Set<string>(),
  filters: { ...DEFAULT_FILTERS },
  activeView: null,

  select: (id) => set({ selectedId: id }),

  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),

  setFilters: (filters) => set({ filters }),

  setActiveView: (id) => set({ activeView: id }),

  toggleSelect: (id) =>
    set((s) => {
      const next = new Set(s.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next };
    }),

  clearSelection: () => set({ selectedIds: new Set<string>() }),

  bulkReject: (category = 'other', reason) => {
    const trimmedReason = reason?.trim();
    if (!trimmedReason) {
      toast({
        icon: '⚠',
        title: 'Rejection reason required',
        description: 'Add a reason before rejecting selected claims.',
        tone: 'error',
      });
      return;
    }

    const selected = get().tickets.filter((t) => get().selectedIds.has(t.id));
    const actionable = selected.filter((t) => canTransition(t, 'reject'));
    const skipped = selected.length - actionable.length;
    const ids = actionable.map((t) => t.id);
    if (ids.length === 0) return;
    const now = Date.now();
    set((s) => ({
      tickets: s.tickets.map((t) =>
        ids.includes(t.id)
          ? {
              ...t,
              snoozedUntil: undefined,
              status: 'rejected',
              resolvedAt: now,
              resolution: 'rejection',
              notes: [
                ...t.notes,
                createSystemNote(
                  `Claim rejected in bulk action: ${formatRejection(
                    category,
                    trimmedReason,
                  )}`,
                  now,
                ),
              ],
            }
          : t,
      ),
      selectedIds: new Set<string>(),
    }));
    toast({
      icon: '✗',
      title: `${ids.length} tickets rejected`,
      description:
        skipped > 0
          ? `${formatRejection(category, trimmedReason)} (${skipped} ineligible ticket${skipped === 1 ? '' : 's'} skipped)`
          : formatRejection(category, trimmedReason),
      tone: 'error',
    });
  },

  bulkFlagFraud: (reason) => {
    const trimmedReason = reason?.trim();
    if (!trimmedReason) {
      toast({
        icon: '⚠',
        title: 'Fraud flag reason required',
        description: 'Add a reason before flagging selected claims.',
        tone: 'error',
      });
      return;
    }

    const selected = get().tickets.filter((t) => get().selectedIds.has(t.id));
    const actionable = selected.filter((t) => !isTerminal(t));
    const skipped = selected.length - actionable.length;
    const ids = actionable.map((t) => t.id);
    if (ids.length === 0) return;
    const now = Date.now();
    set((s) => ({
      tickets: s.tickets.map((t) =>
        ids.includes(t.id)
          ? {
              ...t,
              riskStatus: 'fraud',
              tag: 'FRAUD FLAG',
              tagCls: 'fraud',
              dupCheck: { ...t.dupCheck, status: 'bad', severity: 'high' },
              notes: [
                ...t.notes,
                createSystemNote(`Bulk fraud flag: ${trimmedReason}`, now),
              ],
            }
          : t,
      ),
      selectedIds: new Set<string>(),
    }));
    toast({
      icon: '🚨',
      title: `${ids.length} tickets flagged`,
      description:
        skipped > 0
          ? `${skipped} terminal ticket${skipped === 1 ? '' : 's'} skipped.`
          : undefined,
      tone: 'error',
    });
  },

  approve: (id) => {
    const ticket = get().tickets.find((t) => t.id === id);
    if (!ticket || !canTransition(ticket, 'approve')) return;
    const now = Date.now();
    set((s) => ({
      tickets: s.tickets.map((t) =>
        t.id === id
          ? {
              ...t,
              snoozedUntil: undefined,
              status: 'replacement-issued',
              resolvedAt: now,
              resolution: 'replacement',
              contactStatus: 'customer-notified',
              notes: [
                ...t.notes,
                createSystemNote('Claim approved for replacement.', now),
              ],
            }
          : t,
      ),
    }));
    toast({
      icon: '✓',
      title: 'Claim approved',
      description: `${id} — replacement queued for fulfilment.`,
      tone: 'success',
    });
  },

  reject: (id, category = 'other', reason) => {
    const trimmedReason = reason?.trim();
    if (!trimmedReason) {
      toast({
        icon: '⚠',
        title: 'Rejection reason required',
        description: 'Add a reason before rejecting this claim.',
        tone: 'error',
      });
      return;
    }

    const ticket = get().tickets.find((t) => t.id === id);
    if (!ticket || !canTransition(ticket, 'reject')) return;

    const now = Date.now();
    set((s) => ({
      tickets: s.tickets.map((t) =>
        t.id === id
          ? {
              ...t,
              snoozedUntil: undefined,
              status: 'rejected',
              resolvedAt: now,
              resolution: 'rejection',
              notes: [
                ...t.notes,
                createSystemNote(
                  `Claim rejected: ${formatRejection(category, trimmedReason)}`,
                  now,
                ),
              ],
            }
          : t,
      ),
    }));
    toast({
      icon: '✗',
      title: 'Claim rejected',
      description: `${id} — ${formatRejection(category, trimmedReason)}`,
      tone: 'error',
    });
  },

  reopen: (id, reason) => {
    const trimmedReason = reason?.trim();
    if (!trimmedReason) {
      toast({
        icon: '⚠',
        title: 'Reopen reason required',
        description: 'Add a reason before reopening this ticket.',
        tone: 'error',
      });
      return;
    }

    const now = Date.now();
    set((s) => ({
      tickets: s.tickets.map((t) =>
        t.id === id && canTransition(t, 'reopen')
          ? {
              ...t,
              snoozedUntil: undefined,
              status: 'pending',
              resolvedAt: undefined,
              resolution: undefined,
              resolutionAmount: undefined,
              contactStatus: 'awaiting-customer-reply',
              notes: [
                ...t.notes,
                createSystemNote(`Ticket reopened: ${trimmedReason}`, now),
              ],
            }
          : t,
      ),
    }));
    toast({
      icon: '↩',
      title: 'Ticket reopened',
      description: `${id} — ${trimmedReason}`,
    });
  },

  resolve: (id) => {
    const ticket = get().tickets.find((t) => t.id === id);
    if (!ticket || !canTransition(ticket, 'resolve')) return;
    const now = Date.now();
    set((s) => ({
      tickets: s.tickets.map((t) =>
        t.id === id
          ? {
              ...t,
              snoozedUntil: undefined,
              status: 'resolved',
              resolvedAt: now,
              notes: [...t.notes, createSystemNote('Ticket resolved.', now)],
            }
          : t,
      ),
    }));
    toast({
      icon: '✓',
      title: 'Ticket resolved',
      description: `${id} marked as resolved.`,
      tone: 'success',
    });
  },

  issueReplacement: (id) => {
    set((s) => ({
      tickets: s.tickets.map((t) =>
        t.id === id
          ? {
              ...t,
              snoozedUntil: undefined,
              status: 'resolved',
              resolvedAt: Date.now(),
              resolution: 'replacement',
            }
          : t,
      ),
    }));
    toast({
      icon: '📦',
      title: 'Replacement dispatched',
      description: `${id} — courier label generated, customer notified.`,
      tone: 'success',
    });
  },

  issueRefund: (id) => {
    set((s) => ({
      tickets: s.tickets.map((t) =>
        t.id === id
          ? {
              ...t,
              snoozedUntil: undefined,
              status: 'resolved',
              resolvedAt: Date.now(),
              resolution: 'refund',
              resolutionAmount: t.order.amount,
            }
          : t,
      ),
    }));
    toast({
      icon: '💸',
      title: 'Refund issued',
      description: `${id} refunded. Funds will reflect in 3–5 business days.`,
      tone: 'success',
    });
  },

  issueVoucher: (id, amount) => {
    set((s) => ({
      tickets: s.tickets.map((t) =>
        t.id === id
          ? {
              ...t,
              snoozedUntil: undefined,
              status: 'resolved',
              resolvedAt: Date.now(),
              resolution: 'voucher',
              resolutionAmount: amount,
            }
          : t,
      ),
    }));
    toast({
      icon: '🎟️',
      title: 'Voucher issued',
      description: `${id} — ₹${amount} voucher emailed and SMS'd.`,
      tone: 'success',
    });
  },

  flagFraud: (id) => {
    const ticket = get().tickets.find((t) => t.id === id);
    if (!ticket || isTerminal(ticket)) return;
    const now = Date.now();
    set((s) => ({
      tickets: s.tickets.map((t) =>
        t.id === id
          ? {
              ...t,
              riskStatus: 'fraud',
              tag: 'FRAUD FLAG',
              tagCls: 'fraud',
              dupCheck: { ...t.dupCheck, status: 'bad', severity: 'high' },
              notes: [
                ...t.notes,
                createSystemNote('Ticket flagged as fraud.', now),
              ],
            }
          : t,
      ),
    }));
    toast({
      icon: '🚨',
      title: 'Flagged as fraud',
      description: `${id} — escalated to fraud queue, customer auto-approvals frozen.`,
      tone: 'error',
    });
  },

  escalate: (id) => {
    const ticket = get().tickets.find((t) => t.id === id);
    if (!ticket || !canTransition(ticket, 'escalate')) return;
    const now = Date.now();
    set((s) => ({
      tickets: s.tickets.map((t) =>
        t.id === id
          ? {
              ...t,
              status: 'escalated',
              priority: 'urgent',
              tag: t.tag ?? 'ESCALATED',
              tagCls: t.tagCls ?? 'escalation',
              agent: 'Senior support queue',
              notes: [
                ...t.notes,
                createSystemNote('Ticket escalated to senior support queue.', now),
              ],
            }
          : t,
      ),
    }));
    toast({
      icon: '⬆',
      title: 'Escalated',
      description: `${id} routed to senior agent queue.`,
    });
  },

  reassign: (id, agent) => {
    const now = Date.now();
    set((s) => ({
      tickets: s.tickets.map((t) =>
        t.id === id
          ? {
              ...t,
              agent,
              notes: [
                ...t.notes,
                createSystemNote(`Ticket reassigned to ${agent}.`, now),
              ],
            }
          : t,
      ),
    }));
    toast({
      icon: '↪',
      title: 'Reassigned',
      description: `${id} reassigned to ${agent}.`,
    });
  },

  runDupCheck: async (id) => {
    const t = get().tickets.find((x) => x.id === id);
    if (!t) return;
    const startedAt = Date.now();

    toast({
      icon: '🔍',
      title: 'Re-running marketplace check…',
      description: `Polling ${t.order.marketplace} for ${t.order.id}.`,
    });

    set((s) => ({
      tickets: s.tickets.map((x) =>
        x.id === id
          ? {
              ...x,
              dupCheck: { ...x.dupCheck, status: 'checking' },
              notes: [
                ...x.notes,
                createSystemNote('Marketplace duplicate check started.', startedAt),
              ],
            }
          : x,
      ),
    }));

    try {
      const result = await checkDuplicateClaim(t.order.marketplace, t.order.id);
      const now = Date.now();
      set((s) => ({
        tickets: s.tickets.map((x) =>
          x.id === id
            ? {
                ...x,
                dupCheck: {
                  ...x.dupCheck,
                  status: result.status,
                  checked: 'just now',
                  details: result.details,
                  priorClaims: result.priorClaims,
                  matchingOrderIds: result.matchingOrderIds,
                  matchSignals: result.matchSignals,
                  confidence: result.confidence,
                  severity: result.severity,
                },
                evidence: {
                  ...x.evidence,
                  duplicateCheckPassed: result.status === 'ok',
                },
                riskStatus:
                  result.status === 'bad'
                    ? result.severity === 'high'
                      ? 'fraud'
                      : 'duplicate'
                    : x.riskStatus,
                notes: [
                  ...x.notes,
                  createSystemNote(
                    result.status === 'ok'
                      ? 'Marketplace duplicate check passed.'
                      : `Marketplace duplicate check flagged risk: ${
                          result.details ?? 'Potential duplicate.'
                        }`,
                    now,
                  ),
                ],
              }
            : x,
        ),
      }));

      toast({
        icon: '✓',
        title: 'Check complete',
        description:
          result.status === 'ok'
            ? 'No duplicate.'
            : (result.details ?? 'Duplicate detected.'),
        tone: result.status === 'ok' ? 'success' : 'error',
      });
    } catch (err) {
      set((s) => ({
        tickets: s.tickets.map((x) =>
          x.id === id
            ? {
                ...x,
                dupCheck: {
                  ...x.dupCheck,
                  status: 'failed',
                  checked: 'just now',
                  details:
                    'Marketplace check failed. Do not treat this claim as verified.',
                },
                evidence: {
                  ...x.evidence,
                  duplicateCheckPassed: false,
                },
                notes: [
                  ...x.notes,
                  createSystemNote('Marketplace duplicate check failed.', Date.now()),
                ],
              }
            : x,
        ),
      }));
      toast({
        icon: '⚠',
        title: 'Check failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        tone: 'error',
      });
    }
  },

  addMessage: (id, text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const message: TicketMessage = {
      id: crypto.randomUUID(),
      from: 'agent',
      text: trimmed,
      at: Date.now(),
    };
    set((s) => ({
      tickets: s.tickets.map((t) =>
        t.id === id
          ? {
              ...t,
              messages: [...t.messages, message],
              notes: [
                ...t.notes,
                createSystemNote('Public reply sent to customer.', message.at),
              ],
              contactStatus: 'customer-notified',
            }
          : t,
      ),
    }));
    toast({
      icon: '✉',
      title: 'Reply sent',
      description: `${id} — message delivered to customer.`,
      tone: 'success',
    });
  },

  addNote: (id, text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const note: TicketMessage = {
      id: crypto.randomUUID(),
      from: 'agent',
      text: trimmed,
      at: Date.now(),
    };
    set((s) => ({
      tickets: s.tickets.map((t) =>
        t.id === id
          ? {
              ...t,
              notes: [
                ...t.notes,
                note,
                createSystemNote('Internal note added.', note.at),
              ],
            }
          : t,
      ),
    }));
    toast({
      icon: '📝',
      title: 'Note added',
      description: `${id} — internal note saved.`,
    });
  },

  createTicket: (input) => {
    const now = Date.now();
    const id = nextTicketId(get().tickets);

    const messages: TicketMessage[] = [];
    const description = input.issueDescription?.trim();
    if (description) {
      messages.push({
        id: crypto.randomUUID(),
        from: 'customer',
        text: description,
        at: now,
      });
    }

    const lookupNote =
      input.lookupStatus === 'matched'
        ? ` Order ${input.order.id} matched by contact lookup.`
        : input.lookupStatus === 'unresolved'
          ? ' No order confirmed at intake.'
          : input.lookupStatus === 'manual'
            ? ' Order details entered manually.'
            : '';

    const intake: TicketIntake = {
      channel: input.channel,
      loggedBy: input.loggedBy,
      loggedAt: now,
      rawContact: input.rawContact?.trim() || undefined,
      productUrl: input.productUrl?.trim() || undefined,
      lookupStatus: input.lookupStatus,
      matchedOrderId: input.matchedOrderId,
    };

    const ticket: Ticket = {
      id,
      customer: {
        id: newCustomerId(),
        name: input.customer.name.trim(),
        phone: input.customer.phone.trim(),
        email: input.customer.email?.trim() || undefined,
      },
      order: {
        id: input.order.id,
        marketplace: input.order.marketplace,
        product: input.order.product.trim(),
        sku: input.order.sku?.trim() || '—',
        amount: input.order.amount ?? 0,
        purchasedAt: input.order.purchasedAt ?? now,
        deliveredAt: input.order.deliveredAt,
      },
      status: 'pending',
      requestType: input.requestType,
      issueType: input.issueType,
      riskStatus: 'normal',
      contactStatus: 'reply-received',
      evidence: {
        orderVerified: false,
        deliveryVerified: false,
        photosReviewed: false,
        duplicateCheckPassed: false,
        aiReportReviewed: false,
        customerHistoryReviewed: false,
      },
      priority: input.priority ?? 'normal',
      createdAt: now,
      dupCheck: { status: 'unknown', checked: 'not run', priorClaims: 0 },
      messages,
      notes: [
        createSystemNote(
          `Ticket created manually via ${input.channel} by ${input.loggedBy}.${lookupNote}`,
          now,
        ),
      ],
      channel: input.channel,
      intake,
    };

    // Inject the standard auto-ack reply now (idempotent — stable id), so
    // behaviour is identical before and after the snapshot re-hydrates.
    const [withAck] = ensureClaimAcknowledgementMessages([ticket]);

    // Land on the new ticket in an unfiltered queue. Without this, an active
    // saved view or field filter (e.g. "Fraud flagged") would hide the fresh
    // pending ticket and it would look like nothing was created.
    set((s) => ({
      tickets: [withAck, ...s.tickets],
      selectedId: withAck.id,
      filters: { ...DEFAULT_FILTERS },
      activeView: null,
    }));

    toast({
      icon: '🎫',
      title: 'Ticket created',
      description: `${id} logged via ${input.channel}.`,
      tone: 'success',
    });

    return id;
  },

  updateAttachmentReview: (ticketId, attachmentId, patch) => {
    const now = Date.now();
    set((s) => ({
      tickets: s.tickets.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              issueAttachments: t.issueAttachments?.map((attachment) =>
                attachment.id === attachmentId
                  ? { ...attachment, ...patch }
                  : attachment,
              ),
              notes: [
                ...t.notes,
                createSystemNote(
                  `Attachment ${attachmentId} review updated.`,
                  now,
                ),
              ],
            }
          : t,
      ),
    }));
  },

  updateEvidence: (ticketId, key, value) => {
    const now = Date.now();
    set((s) => ({
      tickets: s.tickets.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              evidence: { ...t.evidence, [key]: value },
              notes: [
                ...t.notes,
                createSystemNote(
                  `Evidence checklist updated: ${key} ${value ? 'checked' : 'unchecked'}.`,
                  now,
                ),
              ],
            }
          : t,
      ),
    }));
  },

  snoozeTicket: (id, until) => {
    const now = Date.now();
    if (!Number.isFinite(until) || until <= now) {
      toast({
        icon: '⚠',
        title: 'Pick a future time',
        description: 'Snooze must be set to a date and time in the future.',
        tone: 'error',
      });
      return;
    }
    const ticket = get().tickets.find((t) => t.id === id);
    if (!ticket || isTerminal(ticket)) {
      toast({
        icon: '⚠',
        title: 'Cannot snooze',
        description: 'Only open tickets can be snoozed.',
        tone: 'error',
      });
      return;
    }
    set((s) => ({
      tickets: s.tickets.map((t) =>
        t.id === id
          ? {
              ...t,
              snoozedUntil: until,
              contactStatus: 'follow-up-scheduled',
              notes: [
                ...t.notes,
                createSystemNote(
                  `Snoozed until ${new Date(until).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}.`,
                  now,
                ),
              ],
            }
          : t,
      ),
    }));
    toast({
      icon: '⏰',
      title: 'Ticket snoozed',
      description: `${id} — hidden behind active tickets until then.`,
      tone: 'success',
    });
  },

  clearSnooze: (id) => {
    const ticket = get().tickets.find((t) => t.id === id);
    if (!ticket?.snoozedUntil) return;
    const now = Date.now();
    set((s) => ({
      tickets: s.tickets.map((t) =>
        t.id === id
          ? {
              ...t,
              snoozedUntil: undefined,
              notes: [
                ...t.notes,
                createSystemNote('Snooze cleared — ticket back in active triage.', now),
              ],
            }
          : t,
      ),
    }));
    toast({
      icon: '⏰',
      title: 'Snooze cleared',
      description: id,
      tone: 'success',
    });
  },

  hydrate: (incoming) => {
    const cloned = incoming.map((t) => ({
      ...t,
      messages: [...t.messages],
      notes: [...t.notes],
      issueAttachments: t.issueAttachments
        ? t.issueAttachments.map((a) => ({ ...a }))
        : undefined,
    }));
    const withAck = ensureClaimAcknowledgementMessages(cloned);
    set({
      tickets: withAck,
      selectedId: withAck[0]?.id ?? null,
    });
  },
}));
