import { useTicketsStore } from '@/store/tickets';
import { Badge } from '@/components/ui/badge';
import { cn, formatRelative } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, Clock3 } from 'lucide-react';
import type { Ticket } from '@/types/domain';

const STATUS_VARIANT: Record<
  Ticket['status'],
  'pending' | 'resolved' | 'rejected' | 'secondary'
> = {
  pending: 'pending',
  resolved: 'resolved',
  rejected: 'rejected',
  'replacement-issued': 'secondary',
};

const DUP_LABEL: Record<Ticket['dupCheck']['status'], string> = {
  ok: 'Verified',
  bad: 'Duplicate risk',
  unknown: 'Unchecked',
  checking: 'Checking',
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getSeverityRail(t: Ticket): string {
  if (
    t.priority === 'urgent' ||
    t.dupCheck.status === 'bad' ||
    t.tag ||
    (t.aiReport?.flags.length ?? 0) > 0
  ) {
    return 'bg-destructive';
  }
  if (t.priority === 'high') return 'bg-brand-gold';
  return 'bg-transparent';
}

export function TicketsList() {
  const tickets = useTicketsStore((s) => s.tickets);
  const filters = useTicketsStore((s) => s.filters);
  const selectedId = useTicketsStore((s) => s.selectedId);
  const select = useTicketsStore((s) => s.select);
  const setFilter = useTicketsStore((s) => s.setFilter);

  const filtered = tickets.filter((t) => {
    if (filters.status !== 'all' && t.status !== filters.status) return false;
    if (filters.type !== 'all' && t.type !== filters.type) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (
        !t.id.toLowerCase().includes(q) &&
        !t.customer.name.toLowerCase().includes(q) &&
        !t.customer.phone.toLowerCase().includes(q) &&
        !t.order.id.toLowerCase().includes(q) &&
        !t.order.product.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  if (filtered.length === 0) {
    const hasFilters =
      filters.status !== 'all' || filters.type !== 'all' || filters.search;
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div className="max-w-xs">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <CheckCircle2 size={22} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold">
            {hasFilters ? 'No matching tickets' : 'Queue is clear'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasFilters
              ? 'Adjust the status, issue type, or search terms to widen the queue.'
              : 'No tickets to triage right now. Take a breather ✨'}
          </p>
          {hasFilters && (
            <button
              onClick={() => {
                setFilter('status', 'all');
                setFilter('type', 'all');
                setFilter('search', '');
              }}
              className="mt-4 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-muted"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2 p-3">
      {filtered.map((t) => {
        const isSelected = selectedId === t.id;
        const rail = getSeverityRail(t);
        const hasRisk =
          t.dupCheck.status === 'bad' ||
          Boolean(t.tag) ||
          (t.aiReport?.flags.length ?? 0) > 0;

        return (
          <li key={t.id}>
            <button
              onClick={() => select(t.id)}
              aria-pressed={isSelected}
              className={cn(
                'group relative flex w-full overflow-hidden rounded-lg border bg-card/65 text-left transition-all',
                'hover:border-primary/45 hover:bg-card hover:shadow-sm',
                isSelected &&
                  'border-primary/70 bg-primary/[0.08] shadow-sm shadow-primary/10 ring-1 ring-primary/40',
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'w-1 shrink-0 transition-colors',
                  rail,
                  rail === 'bg-transparent' && 'group-hover:bg-primary/30',
                )}
              />

              <div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tracking-tight',
                      hasRisk
                        ? 'bg-destructive/15 text-destructive'
                        : 'bg-primary/15 text-primary',
                    )}
                    aria-hidden="true"
                  >
                    {getInitials(t.customer.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold leading-tight">
                        {t.customer.name}
                      </span>
                      <Badge
                        variant={STATUS_VARIANT[t.status]}
                        className="shrink-0"
                      >
                        {t.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {t.order.product}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 font-medium',
                      t.dupCheck.status === 'bad' && 'text-destructive',
                      t.dupCheck.status === 'ok' && 'text-success',
                    )}
                  >
                    {t.dupCheck.status === 'ok' ? (
                      <CheckCircle2 size={13} />
                    ) : (
                      <AlertTriangle size={13} />
                    )}
                    {DUP_LABEL[t.dupCheck.status]}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 tabular-nums">
                    <Clock3 size={13} />
                    {formatRelative(t.createdAt)}
                  </span>
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
