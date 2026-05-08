import { useTicketsStore } from '@/store/tickets';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { TicketStatus } from '@/types/domain';

const STATUSES: { value: TicketStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'replacement-issued', label: 'Replaced' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
];

export function TicketsFilters() {
  const filters = useTicketsStore((s) => s.filters);
  const setFilter = useTicketsStore((s) => s.setFilter);

  return (
    <div className="flex flex-col gap-3 border-b p-4">
      <Input
        id="ticket-search"
        placeholder='Search by ID, customer, or order #  ( press "/" )'
        value={filters.search}
        onChange={(e) => setFilter('search', e.target.value)}
      />
      <div className="flex flex-wrap gap-1">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilter('status', s.value)}
            className={cn(
              'rounded-md px-3 py-1 text-xs font-semibold transition-colors',
              filters.status === s.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
