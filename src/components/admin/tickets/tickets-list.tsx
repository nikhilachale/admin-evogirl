import { useTicketsStore } from '@/store/tickets';
import { Badge } from '@/components/ui/badge';
import { cn, formatRelative } from '@/lib/utils';
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

const KIND_LABEL: Record<NonNullable<Ticket['kind']>, string> = {
  return: 'Return',
  replacement: 'Replacement',
  'review-check': 'Review check',
};

export function TicketsList() {
  const tickets = useTicketsStore((s) => s.tickets);
  const filters = useTicketsStore((s) => s.filters);
  const selectedId = useTicketsStore((s) => s.selectedId);
  const select = useTicketsStore((s) => s.select);

  const filtered = tickets.filter((t) => {
    if (filters.status !== 'all' && t.status !== filters.status) return false;
    if (filters.type !== 'all' && t.type !== filters.type) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (
        !t.id.toLowerCase().includes(q) &&
        !t.customer.name.toLowerCase().includes(q) &&
        !t.order.id.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  if (filtered.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No tickets match your filters.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {filtered.map((t) => (
        <li key={t.id}>
          <button
            onClick={() => select(t.id)}
            className={cn(
              'flex w-full flex-col gap-2 p-4 text-left transition-colors hover:bg-accent/30',
              selectedId === t.id && 'bg-accent/50',
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-muted-foreground">
                {t.id}
              </span>
              <Badge variant={STATUS_VARIANT[t.status]}>{t.status}</Badge>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-semibold">
                {t.customer.name}
              </span>
              {t.tag && <Badge variant="fraud">{t.tag}</Badge>}
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {t.order.product}
            </p>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="uppercase">{t.order.marketplace}</span>
                {t.kind && (
                  <>
                    <span aria-hidden>·</span>
                    <span className="rounded-sm bg-foreground/[0.06] px-1.5 py-px text-[10px] font-bold uppercase tracking-wider text-foreground/80">
                      {KIND_LABEL[t.kind]}
                    </span>
                  </>
                )}
                {t.aiReport && t.aiReport.flags.length > 0 && (
                  <span
                    title={t.aiReport.flags.join(', ')}
                    className="rounded-sm bg-rose-500/15 px-1.5 py-px text-[10px] font-bold uppercase tracking-wider text-rose-400"
                  >
                    AI · {t.aiReport.flags.length}
                  </span>
                )}
              </span>
              <span>{formatRelative(t.createdAt)}</span>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
