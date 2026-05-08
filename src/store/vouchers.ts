import { create } from 'zustand';
import type { Marketplace, Voucher, VoucherStatus } from '@/types/domain';
import { toast } from './toast';

export type VoucherStatusFilter = VoucherStatus | 'all';

interface VouchersState {
  vouchers: Voucher[];
  filters: {
    status: VoucherStatusFilter;
    search: string;
  };

  hydrate: (vouchers: Voucher[]) => void;
  setFilter: <K extends keyof VouchersState['filters']>(
    key: K,
    value: VouchersState['filters'][K],
  ) => void;

  manualIssue: (input: {
    customerName: string;
    customerPhone: string;
    amount: number;
    orderId: string;
    marketplace: Marketplace;
  }) => void;
  revoke: (id: string) => void;
  markRedeemed: (id: string) => void;
}

const day = 1000 * 60 * 60 * 24;

function randomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 4; i++) {
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `EVO-WLCM-${s}`;
}

export const useVouchersStore = create<VouchersState>((set) => ({
  vouchers: [],
  filters: { status: 'all', search: '' },

  hydrate: (vouchers) => set({ vouchers }),

  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),

  manualIssue: ({ customerName, customerPhone, amount, orderId, marketplace }) => {
    const code = randomCode();
    const now = Date.now();
    const voucher: Voucher = {
      id: `v-${code.slice(-4)}`,
      code,
      amount,
      status: 'pending',
      issuedAt: now,
      expiresAt: now + day * 45,
      customerName,
      customerPhone,
      order: { id: orderId, marketplace },
    };
    set((s) => ({ vouchers: [voucher, ...s.vouchers] }));
    toast({
      icon: '🎟️',
      title: 'Voucher issued',
      description: `${code} — ₹${amount} sent to ${customerName} on WhatsApp.`,
      tone: 'success',
    });
  },

  revoke: (id) => {
    set((s) => ({
      vouchers: s.vouchers.map((v) =>
        v.id === id ? { ...v, status: 'revoked' } : v,
      ),
    }));
    toast({
      icon: '↺',
      title: 'Voucher revoked',
      description: 'Customer notified — code is no longer redeemable.',
      tone: 'error',
    });
  },

  markRedeemed: (id) => {
    set((s) => ({
      vouchers: s.vouchers.map((v) =>
        v.id === id
          ? { ...v, status: 'redeemed', redeemedAt: Date.now() }
          : v,
      ),
    }));
    toast({
      icon: '✓',
      title: 'Marked as redeemed',
      description: 'Voucher state synced with Shopify.',
      tone: 'success',
    });
  },
}));
