import { create } from 'zustand';
import type {
  Ticket,
  TicketMessage,
  TicketStatus,
  TicketType,
} from '@/types/domain';
import { toast } from './toast';
import { checkDuplicateClaim } from '@/lib/api/marketplaces';

export interface TicketsFilters {
  status: TicketStatus | 'all';
  type: TicketType | 'all';
  search: string;
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
  bulkReject: (reason?: string) => void;
  bulkFlagFraud: () => void;

  approve: (id: string) => void;
  reject: (id: string, reason?: string) => void;
  resolve: (id: string) => void;
  issueReplacement: (id: string) => void;
  issueRefund: (id: string) => void;
  issueVoucher: (id: string, amount: number) => void;
  flagFraud: (id: string) => void;
  escalate: (id: string) => void;
  reassign: (id: string, agent: string) => void;
  runDupCheck: (id: string) => Promise<void>;

  addMessage: (id: string, text: string) => void;
  addNote: (id: string, text: string) => void;

  hydrate: (tickets: Ticket[]) => void;
}

export const useTicketsStore = create<TicketsState>((set, get) => ({
  tickets: [],
  selectedId: null,
  selectedIds: new Set<string>(),
  filters: { status: 'all', type: 'all', search: '' },
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

  bulkReject: (reason) => {
    const ids = Array.from(get().selectedIds);
    if (ids.length === 0) return;
    set((s) => ({
      tickets: s.tickets.map((t) =>
        s.selectedIds.has(t.id)
          ? {
              ...t,
              status: 'rejected',
              resolvedAt: Date.now(),
              resolution: 'rejection',
            }
          : t,
      ),
      selectedIds: new Set<string>(),
    }));
    toast({
      icon: '✗',
      title: `${ids.length} tickets rejected`,
      description: reason,
      tone: 'error',
    });
  },

  bulkFlagFraud: () => {
    const ids = Array.from(get().selectedIds);
    if (ids.length === 0) return;
    set((s) => ({
      tickets: s.tickets.map((t) =>
        s.selectedIds.has(t.id)
          ? {
              ...t,
              type: 'fraud',
              tag: 'FRAUD FLAG',
              tagCls: 'fraud',
              dupCheck: { ...t.dupCheck, status: 'bad' },
            }
          : t,
      ),
      selectedIds: new Set<string>(),
    }));
    toast({
      icon: '🚨',
      title: `${ids.length} tickets flagged`,
      tone: 'error',
    });
  },

  approve: (id) => {
    set((s) => ({
      tickets: s.tickets.map((t) =>
        t.id === id
          ? {
              ...t,
              status: 'replacement-issued',
              resolvedAt: Date.now(),
              resolution: 'replacement',
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

  reject: (id, reason) => {
    set((s) => ({
      tickets: s.tickets.map((t) =>
        t.id === id
          ? {
              ...t,
              status: 'rejected',
              resolvedAt: Date.now(),
              resolution: 'rejection',
            }
          : t,
      ),
    }));
    toast({
      icon: '✗',
      title: 'Claim rejected',
      description: reason
        ? `${id} — ${reason}`
        : `${id} rejected. Notify customer with reason in next reply.`,
      tone: 'error',
    });
  },

  resolve: (id) => {
    set((s) => ({
      tickets: s.tickets.map((t) =>
        t.id === id ? { ...t, status: 'resolved', resolvedAt: Date.now() } : t,
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
    set((s) => ({
      tickets: s.tickets.map((t) =>
        t.id === id
          ? {
              ...t,
              type: 'fraud',
              tag: 'FRAUD FLAG',
              tagCls: 'fraud',
              dupCheck: { ...t.dupCheck, status: 'bad' },
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
    toast({
      icon: '⬆',
      title: 'Escalated',
      description: `${id} routed to senior agent queue.`,
    });
  },

  reassign: (id, agent) => {
    set((s) => ({
      tickets: s.tickets.map((t) => (t.id === id ? { ...t, agent } : t)),
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

    toast({
      icon: '🔍',
      title: 'Re-running marketplace check…',
      description: `Polling ${t.order.marketplace} for ${t.order.id}.`,
    });

    set((s) => ({
      tickets: s.tickets.map((x) =>
        x.id === id
          ? { ...x, dupCheck: { ...x.dupCheck, status: 'checking' } }
          : x,
      ),
    }));

    try {
      // In dev with no backend, this throws — we fall back to a mock result.
      let result: { status: 'ok' | 'bad'; details?: string };
      try {
        result = await checkDuplicateClaim(t.order.marketplace, t.order.id);
      } catch {
        // Mock fallback for local dev — replace with real backend call.
        await new Promise((r) => setTimeout(r, 1200));
        result = { status: 'ok' };
      }

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
                },
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
        t.id === id ? { ...t, messages: [...t.messages, message] } : t,
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
        t.id === id ? { ...t, notes: [...t.notes, note] } : t,
      ),
    }));
    toast({
      icon: '📝',
      title: 'Note added',
      description: `${id} — internal note saved.`,
    });
  },

  hydrate: (tickets) => set({ tickets, selectedId: tickets[0]?.id ?? null }),
}));
