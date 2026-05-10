import { useTicketsStore } from '@/store/tickets';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Search, X } from 'lucide-react';
import { Kbd } from './kbd';
import { SavedViewsRow } from './saved-views';
import type { TicketIssueType, TicketStatus } from '@/types/domain';

const STATUSES: { value: TicketStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'replacement-issued', label: 'Replaced' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'escalated', label: 'Escalated' },
];

const ISSUE_TYPES: { value: TicketIssueType | 'all'; label: string }[] = [
  { value: 'all', label: 'All issues' },
  { value: 'damage', label: 'Damage' },
  { value: 'color-change', label: 'Color change' },
  { value: 'defect', label: 'Defect' },
  { value: 'wrong-item', label: 'Wrong item' },
  { value: 'other', label: 'Other' },
];

export function TicketsFilters() {
  const filters = useTicketsStore((s) => s.filters);
  const setFilter = useTicketsStore((s) => s.setFilter);
  const tickets = useTicketsStore((s) => s.tickets);

  const pendingCount = tickets.filter((t) => t.status === 'pending').length;
  const urgentCount = tickets.filter((t) => t.priority === 'urgent').length;
  const fraudCount = tickets.filter(
    (t) =>
      t.tag ||
      t.riskStatus === 'fraud' ||
      t.riskStatus === 'duplicate' ||
      t.dupCheck.status === 'bad',
  ).length;

  return (
    <div className="flex flex-col gap-4 border-b bg-background/40 p-4">
      <div>
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Ticket queue
          </p>
          <span className="hidden items-center gap-1 text-[10px] font-medium text-muted-foreground/80 md:inline-flex">
            <Kbd>j</Kbd>
            <Kbd>k</Kbd>
            <span className="ml-0.5">to navigate</span>
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <QueueMetric label="Pending" value={pendingCount} tone="primary" />
          <QueueMetric label="Urgent" value={urgentCount} tone="danger" />
          <QueueMetric label="Risk" value={fraudCount} tone="warning" />
        </div>
      </div>

      <SavedViewsRow />

      <label className="relative block">
        <Search
          aria-hidden="true"
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id="ticket-search"
          placeholder="Search by phone, order, SKU, customer…"
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          className="pl-9 pr-12"
        />
        {filters.search ? (
          <button
            type="button"
            onClick={() => setFilter('search', '')}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X size={14} />
          </button>
        ) : (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <Kbd>/</Kbd>
          </span>
        )}
      </label>

      <div className="flex flex-wrap gap-1.5">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilter('status', s.value)}
            className={cn(
              'rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors',
              filters.status === s.value
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'border-transparent bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ISSUE_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => setFilter('issueType', type.value)}
            className={cn(
              'rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors',
              filters.issueType === type.value
                ? 'bg-secondary text-secondary-foreground ring-1 ring-border'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function QueueMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'primary' | 'danger' | 'warning';
}) {
  return (
    <div
      className={cn(
        'rounded-md border bg-card px-3 py-2 transition-colors',
        tone === 'primary' && 'border-primary/30 hover:border-primary/50',
        tone === 'danger' && 'border-destructive/35 hover:border-destructive/55',
        tone === 'warning' && 'border-brand-gold/35 hover:border-brand-gold/55',
      )}
    >
      <p
        className={cn(
          'text-lg font-bold leading-none tabular-nums',
          tone === 'danger' && value > 0 && 'text-destructive',
          tone === 'warning' && value > 0 && 'text-brand-gold',
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
