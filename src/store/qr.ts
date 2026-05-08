import { create } from 'zustand';
import type { GeneratedQrCard } from '@/types/qr';
import { toast } from './toast';

interface QrState {
  /** Recent runs — newest first. */
  history: GeneratedQrCard[];
  hydrate: (cards: GeneratedQrCard[]) => void;
  recordRun: (card: GeneratedQrCard) => void;
  markPrinted: (id: string, printedAt?: number) => void;
}

export const useQrStore = create<QrState>((set) => ({
  history: [],

  hydrate: (cards) => set({ history: cards }),

  recordRun: (card) =>
    set((s) => {
      // Dedupe by id — re-running the same SKU+batch overwrites in place.
      const next = [card, ...s.history.filter((c) => c.id !== card.id)];
      return { history: next.slice(0, 24) };
    }),

  markPrinted: (id, printedAt = Date.now()) => {
    set((s) => ({
      history: s.history.map((c) =>
        c.id === id ? { ...c, printedAt } : c,
      ),
    }));
    toast({
      icon: '🖨️',
      title: 'Print job sent',
      description: 'Cards queued for the press · 85mm × 54mm at 300 DPI.',
      tone: 'success',
    });
  },
}));
