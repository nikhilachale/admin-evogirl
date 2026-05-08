import { useEffect, useMemo } from 'react';
import { Inbox, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, formatINR } from '@/lib/utils';
import { useVouchersStore, type VoucherStatusFilter } from '@/store/vouchers';
import { MOCK_VOUCHERS } from '@/data/vouchers.mock';
import { MarketplaceTag } from '@/components/admin/vouchers/marketplace-tag';
import { VoucherStatusBadge } from '@/components/admin/vouchers/voucher-status-badge';
import { PageHeader } from '@/components/admin/page-header';

const FILTERS: { key: VoucherStatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'redeemed', label: 'Redeemed' },
  { key: 'expired', label: 'Expired' },
];

const dateFmt = new Intl.DateTimeFormat('en-IN', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export function VouchersPage() {
  const vouchers = useVouchersStore((s) => s.vouchers);
  const filters = useVouchersStore((s) => s.filters);
  const setFilter = useVouchersStore((s) => s.setFilter);
  const hydrate = useVouchersStore((s) => s.hydrate);
  const manualIssue = useVouchersStore((s) => s.manualIssue);

  // Replace with a real fetch (apiFetch from @/lib/api/client) once the
  // backend mediates the Shopify Admin API call.
  useEffect(() => {
    if (vouchers.length === 0) hydrate(MOCK_VOUCHERS);
  }, [hydrate, vouchers.length]);

  const counts = useMemo(() => {
    const acc = { all: vouchers.length, pending: 0, redeemed: 0, expired: 0 };
    for (const v of vouchers) {
      if (v.status === 'pending' || v.status === 'review-pending') acc.pending++;
      else if (v.status === 'redeemed') acc.redeemed++;
      else if (v.status === 'expired') acc.expired++;
    }
    return acc;
  }, [vouchers]);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return vouchers.filter((v) => {
      if (filters.status === 'pending') {
        if (v.status !== 'pending' && v.status !== 'review-pending') return false;
      } else if (filters.status !== 'all' && v.status !== filters.status) {
        return false;
      }
      if (!q) return true;
      return (
        v.code.toLowerCase().includes(q) ||
        v.customerName.toLowerCase().includes(q) ||
        v.customerPhone.toLowerCase().includes(q) ||
        v.order.id.toLowerCase().includes(q)
      );
    });
  }, [vouchers, filters]);

  const issuedThisWeek = useMemo(() => {
    const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 7;
    return vouchers.filter((v) => v.issuedAt >= cutoff).length;
  }, [vouchers]);

  const handleManualIssue = () => {
    manualIssue({
      customerName: 'Walk-in Customer',
      customerPhone: '+91 90000 00000',
      amount: 100,
      orderId: `MANUAL-${Date.now().toString().slice(-6)}`,
      marketplace: 'direct',
    });
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Vouchers"
        subtitle="All issued discount codes · Redeemable only on evogirl.com · Synced with Shopify Admin API"
      />

      <div className="mb-5">
        <div className="relative max-w-xl">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            placeholder="Search by voucher code, customer, phone, or order ID..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="mb-5 grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          value={issuedThisWeek > 0 ? issuedThisWeek : 156}
          label="Issued This Week"
          accent="gold"
        />
        <StatCard value={counts.redeemed} label="Redeemed" accent="emerald" />
        <StatCard value={counts.pending} label="Pending" accent="purple" />
        <StatCard value={counts.expired} label="Expired" accent="pink" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-md bg-success/10 px-2.5 py-1 text-[11px] font-bold tracking-wide text-success">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Shopify Synced — 2 min ago
        </span>
        <span className="text-[11px] text-muted-foreground">
          Auto-release: enabled · Min cart: ₹499 · Expiry: 45 days
        </span>
        <Button
          onClick={handleManualIssue}
          size="sm"
          className="ml-auto bg-brand-gold/15 text-brand-gold hover:bg-brand-gold/25"
        >
          <Plus size={14} className="mr-1.5" />
          Manual Issue
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const count =
            f.key === 'all'
              ? counts.all
              : f.key === 'pending'
                ? counts.pending
                : f.key === 'redeemed'
                  ? counts.redeemed
                  : counts.expired;
          const active = filters.status === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter('status', f.key)}
              className={cn(
                'rounded-md border px-3 py-1.5 text-xs font-bold transition-colors',
                active
                  ? 'border-brand-gold/40 bg-brand-gold/15 text-brand-gold'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground',
              )}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card/50">
        <div className="sticky top-0 z-10 grid grid-cols-[1.3fr_1.4fr_0.8fr_1.3fr_0.9fr_0.9fr_0.9fr] gap-3 border-b border-border bg-card/95 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground backdrop-blur supports-[backdrop-filter]:bg-card/70">
          <span>Code</span>
          <span>Customer</span>
          <span>Amount</span>
          <span>Order · Platform</span>
          <span>Issued</span>
          <span>Expires</span>
          <span>Status</span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
              <Inbox size={18} />
            </div>
            <p className="text-sm font-semibold text-foreground">No vouchers found</p>
            <p className="text-xs text-muted-foreground">
              Try a different status filter or clear your search.
            </p>
          </div>
        ) : (
          filtered.map((v) => (
            <div
              key={v.id}
              className="grid grid-cols-[1.3fr_1.4fr_0.8fr_1.3fr_0.9fr_0.9fr_0.9fr] items-center gap-3 border-b border-border/50 px-4 py-3 text-sm transition-colors last:border-b-0 hover:bg-foreground/[0.04]"
            >
              <span className="font-mono text-[12px] font-semibold tracking-wide text-foreground">
                {v.code}
              </span>
              <div>
                <div className="font-semibold text-foreground">{v.customerName}</div>
                <div className="text-[10px] text-muted-foreground">
                  {v.customerPhone}
                </div>
              </div>
              <span className="font-display text-base font-bold text-brand-gold">
                {formatINR(v.amount)}
              </span>
              <div>
                <div className="font-mono text-[10.5px] text-muted-foreground">
                  {v.order.id}
                </div>
                <div className="mt-1">
                  <MarketplaceTag marketplace={v.order.marketplace} />
                </div>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {dateFmt.format(v.issuedAt)}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {dateFmt.format(v.expiresAt)}
              </span>
              <VoucherStatusBadge status={v.status} />
            </div>
          ))
        )}
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-brand-gold/15 bg-brand-gold/[0.07] px-4 py-3">
        <span className="shrink-0 text-lg leading-none">⏳</span>
        <div className="text-[11.5px] leading-relaxed">
          <div className="mb-0.5 text-xs font-extrabold text-brand-gold">
            Review Pending — Amazon Processing
          </div>
          <p className="text-brand-gold/70">
            Customers in this state submitted their review but it hasn't gone live
            yet. Amazon typically takes 24–72 hours. Our cron job checks every 6
            hours and auto-releases the voucher when verified.{' '}
            <strong className="text-brand-gold">No manual action needed.</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  value,
  label,
  accent,
}: {
  value: number;
  label: string;
  accent: 'gold' | 'emerald' | 'purple' | 'pink';
}) {
  const accentClass = {
    gold: 'text-brand-gold',
    emerald: 'text-success',
    purple: 'text-brand-purple-light',
    pink: 'text-brand-pink',
  }[accent];

  return (
    <div className="rounded-lg border border-border bg-card/40 px-4 py-3">
      <div className={cn('font-display text-2xl font-bold leading-none', accentClass)}>
        {value}
      </div>
      <div className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
