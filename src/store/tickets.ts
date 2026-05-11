import { create } from 'zustand';
import type {
  ClaimEvidenceChecklist,
  CustomerContactStatus,
  DupCheckStatus,
  Marketplace,
  RejectionReasonCategory,
  Ticket,
  TicketAction,
  TicketMessage,
  TicketStatus,
  TicketIssueType,
  TicketRiskStatus,
} from '@/types/domain';
import { toast } from './toast';
import { checkDuplicateClaim } from '@/lib/api/marketplaces';

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
  filters: {
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
  },
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

  hydrate: (tickets) => set({ tickets, selectedId: tickets[0]?.id ?? null }),
}));
