import { cn } from '@/lib/utils';
import type { Marketplace } from '@/types/domain';

const PALETTE: Record<Marketplace, { label: string; className: string }> = {
  amazon: {
    label: 'Amazon',
    className: 'bg-[#FF9900]/15 text-[#FF9900]',
  },
  flipkart: {
    label: 'Flipkart',
    className: 'bg-[#4CAF50]/15 text-[#4CAF50]',
  },
  meesho: {
    label: 'Meesho',
    className: 'bg-brand-pink/15 text-brand-pink',
  },
  myntra: {
    label: 'Myntra',
    className: 'bg-[#FF3F6C]/15 text-[#FF3F6C]',
  },
  direct: {
    label: 'evogirl.com',
    className: 'bg-brand-gold/15 text-brand-gold',
  },
};

export function MarketplaceTag({ marketplace }: { marketplace: Marketplace }) {
  const { label, className } = PALETTE[marketplace];
  return (
    <span
      className={cn(
        'inline-block rounded-[4px] px-1.5 py-px text-[9px] font-bold uppercase tracking-wider',
        className,
      )}
    >
      {label}
    </span>
  );
}
