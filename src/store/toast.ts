import { create } from 'zustand';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  tone?: 'default' | 'success' | 'error';
}

interface ToastState {
  toasts: Toast[];
  toast: (input: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  toast: (input) => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { id, ...input }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Convenience function — call from anywhere. */
export const toast = (input: Omit<Toast, 'id'>) =>
  useToastStore.getState().toast(input);
