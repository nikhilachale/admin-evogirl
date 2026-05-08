import { cn } from '@/lib/utils';
import type { VoucherStatus } from '@/types/domain';

const STYLES: Record<VoucherStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-500/15 text-amber-400',
  },
  redeemed: {
    label: 'Redeemed',
    className: 'bg-success/15 text-success',
  },
  expired: {
    label: 'Expired',
    className: 'bg-brand-gray/10 text-brand-gray/70',
  },
  'review-pending': {
    label: 'Review Pending',
    className: 'bg-brand-gold/15 text-brand-gold',
  },
  revoked: {
    label: 'Revoked',
    className: 'bg-rose-500/15 text-rose-400',
  },
};

export function VoucherStatusBadge({ status }: { status: VoucherStatus }) {
  const { label, className } = STYLES[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
        className,
      )}
    >
      {label}
    </span>
  );
}
