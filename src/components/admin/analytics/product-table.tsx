import { useMemo } from 'react';
import { cn, formatINR } from '@/lib/utils';
import type {
  ProductHue,
  ProductPerformanceRow,
  ProductSortKey,
} from '@/types/analytics';

// CSS-var driven so the bars retheme with the brand palette.
const HUE_HEX: Record<ProductHue, string> = {
  g: 'hsl(var(--brand-gold))',
  pk: 'hsl(var(--brand-pink))',
  pl: 'hsl(var(--brand-purple-light))',
};

const SORT_OPTIONS: { value: ProductSortKey; label: string }[] = [
  { value: 'reviews', label: 'Most Reviewed' },
  { value: 'returns', label: 'Most Returned' },
  { value: 'returnRate', label: 'Highest Return Rate' },
  { value: 'rating', label: 'Lowest Rating' },
  { value: 'warranties', label: 'Most Warranties' },
];

interface Props {
  rows: ProductPerformanceRow[];
  sortBy: ProductSortKey;
  onSortChange: (next: ProductSortKey) => void;
}

export function ProductTable({ rows, sortBy, onSortChange }: Props) {
  const computed = useMemo(() => {
    const enriched = rows.map((p) => ({
      ...p,
      returnRate: (p.returns / Math.max(p.warranties, 1)) * 100,
    }));
    enriched.sort((a, b) => {
      switch (sortBy) {
        case 'reviews':
          return b.reviews - a.reviews;
        case 'returns':
          return b.returns - a.returns;
        case 'returnRate':
          return b.returnRate - a.returnRate;
        case 'rating':
          return a.rating - b.rating;
        case 'warranties':
          return b.warranties - a.warranties;
        default:
          return 0;
      }
    });
    const maxReviews = Math.max(...enriched.map((p) => p.reviews));
    const maxReturns = Math.max(...enriched.map((p) => p.returns));
    return { list: enriched, maxReviews, maxReturns };
  }, [rows, sortBy]);

  return (
    <>
      <div className="mb-3.5 mt-7 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-[22px] font-bold uppercase tracking-[0.18em] text-foreground">
            Product Performance
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Per-SKU breakdown · Reviews, returns &amp; warranty health
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold tracking-wider text-muted-foreground">
            SORT
          </span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as ProductSortKey)}
            className="cursor-pointer rounded-lg border border-border bg-foreground/[0.04] px-2.5 py-1.5 text-xs font-semibold text-foreground outline-none focus:border-brand-gold/40"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-card">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card/50">
        <div className="grid grid-cols-[2.2fr_0.9fr_1.1fr_1.1fr_1fr_0.9fr] gap-3 border-b border-border bg-foreground/[0.02] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
          <span>Product</span>
          <span>Warranties</span>
          <span>Reviews · Rating</span>
          <span>Returns</span>
          <span>Return Rate</span>
          <span className="text-right">Voucher ₹</span>
        </div>

        {computed.list.map((p) => {
          const rateColor =
            p.returnRate < 3
              ? 'text-success bg-success/10'
              : p.returnRate < 8
                ? 'text-brand-gold bg-brand-gold/10'
                : 'text-brand-pink bg-brand-pink/10';
          const ratingColor =
            p.rating >= 4.5
              ? 'text-success'
              : p.rating >= 4.2
                ? 'text-brand-gold'
                : 'text-brand-pink';
          const sku = `SKU EVO-${p.name.split(' ')[0].toUpperCase().slice(0, 4)}`;
          return (
            <div
              key={p.name}
              className="grid grid-cols-[2.2fr_0.9fr_1.1fr_1.1fr_1fr_0.9fr] items-center gap-3 border-b border-border/40 px-4 py-3.5 transition-colors last:border-b-0 hover:bg-foreground/[0.03]"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.05] text-lg">
                  {p.emoji}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-bold text-foreground">
                    {p.name}
                  </div>
                  <div className="text-[10.5px] text-muted-foreground">{sku}</div>
                </div>
              </div>
              <div className="text-[13px] font-bold text-foreground">
                {p.warranties.toLocaleString()}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-bold text-foreground">
                    {p.reviews}
                  </span>
                  <span className={cn('text-[11px] font-bold', ratingColor)}>
                    {p.rating}★
                  </span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-foreground/[0.05]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(p.reviews / computed.maxReviews) * 100}%`,
                      background: HUE_HEX[p.hue],
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="text-[13px] font-bold text-foreground">{p.returns}</div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-foreground/[0.05]">
                  <div
                    className="h-full rounded-full bg-brand-pink/55"
                    style={{ width: `${(p.returns / computed.maxReturns) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <span
                  className={cn(
                    'inline-block rounded-full px-2 py-0.5 text-[11px] font-extrabold',
                    rateColor,
                  )}
                >
                  {p.returnRate.toFixed(1)}%
                </span>
              </div>
              <div className="text-right text-[13px] font-bold text-foreground">
                {formatINR(p.voucher)}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
