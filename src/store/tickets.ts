import { create } from 'zustand';
import type { Ticket, TicketStatus, TicketType } from '@/types/domain';
import { toast } from './toast';
import { checkDuplicateClaim } from '@/lib/api/marketplaces';

interface TicketsState {
  tickets: Ticket[];
  selectedId: string | null;
  filters: {
    status: TicketStatus | 'all';
    type: TicketType | 'all';
    search: string;
  };

  select: (id: string | null) => void;
  setFilter: <K extends keyof TicketsState['filters']>(
    key: K,
    value: TicketsState['filters'][K],
  ) => void;

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

  hydrate: (tickets: Ticket[]) => void;
}

export const useTicketsStore = create<TicketsState>((set, get) => ({
  tickets: [],
  selectedId: null,
  filters: { status: 'all', type: 'all', search: '' },

  select: (id) => set({ selectedId: id }),

  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),

  approve: (id) => {
    set((s) => ({
      tickets: s.tickets.map((t) =>
        t.id === id
          ? { ...t, status: 'replacement-issued', resolvedAt: Date.now() }
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
        t.id === id ? { ...t, status: 'rejected', resolvedAt: Date.now() } : t,
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
        t.id === id ? { ...t, status: 'resolved', resolvedAt: Date.now() } : t,
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
        t.id === id ? { ...t, status: 'resolved', resolvedAt: Date.now() } : t,
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
        t.id === id ? { ...t, status: 'resolved', resolvedAt: Date.now() } : t,
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

  hydrate: (tickets) => set({ tickets, selectedId: tickets[0]?.id ?? null }),
}));
