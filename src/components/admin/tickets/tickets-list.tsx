import { useMemo } from 'react';
import { useTicketsStore } from '@/store/tickets';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Check, CheckCircle2 } from 'lucide-react';
import type { Ticket } from '@/types/domain';
import { BulkActionBar } from './bulk-action-bar';
import { ResolutionChip } from './resolution-chip';
import {
  applyVisibleTicketFilters,
  getAgeBucket,
  getSlaState,
  hasActiveTicketFilters,
  isSnoozeActive,
  normalizeTicketsFilters,
  sortQueueTickets,
} from './ticket-filtering';

const STATUS_VARIANT: Record<
  Ticket['status'],
  'pending' | 'resolved' | 'rejected' | 'secondary'
> = {
  pending: 'pending',
  resolved: 'resolved',
  rejected: 'rejected',
  'replacement-issued': 'secondary',
  escalated: 'secondary',
};

const MARKETPLACE_LABEL: Record<Ticket['order']['marketplace'], string> = {
  amazon: 'Amazon',
  flipkart: 'Flipkart',
  meesho: 'Meesho',
  myntra: 'Myntra',
  direct: 'Direct',
};

const CHANNEL_LABEL: Record<NonNullable<Ticket['channel']>, string> = {
  phone: 'Phone',
  email: 'Email',
  chat: 'Chat',
  'web-form': 'Web form',
  marketplace: 'Marketplace',
  other: 'Other',
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
    t.dupCheck.status === 'failed' ||
    t.riskStatus !== 'normal' ||
    t.tag ||
    (t.aiReport?.flags.length ?? 0) > 0
  ) {
    return 'bg-destructive';
  }
  if (t.priority === 'high') return 'bg-brand-gold';
  return 'bg-transparent';
}

/** Subtle middot separator between meta segments. */
function Dot() {
  return (
    <span aria-hidden="true" className="text-muted-foreground/40">
      ·
    </span>
  );
}

export function TicketsList() {
  const tickets = useTicketsStore((s) => s.tickets);
  const filters = useTicketsStore((s) => s.filters);
  const activeView = useTicketsStore((s) => s.activeView);
  const selectedId = useTicketsStore((s) => s.selectedId);
  const select = useTicketsStore((s) => s.select);
  const setFilters = useTicketsStore((s) => s.setFilters);
  const selectedIds = useTicketsStore((s) => s.selectedIds);
  const toggleSelect = useTicketsStore((s) => s.toggleSelect);

  const filtered = useMemo(
    () =>
      sortQueueTickets(
        applyVisibleTicketFilters(tickets, filters, activeView),
      ),
    [tickets, filters, activeView],
  );

  if (filtered.length === 0) {
    const hasFilters = hasActiveTicketFilters(filters, activeView);
    return (
      <div className="flex h-full flex-col">
        <BulkActionBar />
        <div className="flex flex-1 items-center justify-center p-8 text-center">
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
                  setFilters(normalizeTicketsFilters({}));
                  useTicketsStore.getState().setActiveView(null);
                }}
                className="mt-4 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-muted"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <BulkActionBar />
      <ul className="flex flex-col gap-1.5 p-3">
        {filtered.map((t) => {
          const isSelected = selectedId === t.id;
          const isChecked = selectedIds.has(t.id);
          const rail = getSeverityRail(t);
          const sla = getSlaState(t);
          const age = getAgeBucket(t);
          const snoozed = isSnoozeActive(t);
          const dupRisk =
            t.dupCheck.status === 'bad' || t.dupCheck.status === 'failed';
          const hasRisk =
            dupRisk ||
            t.riskStatus !== 'normal' ||
            Boolean(t.tag) ||
            (t.aiReport?.flags.length ?? 0) > 0;

          return (
            <li key={t.id}>
              <div
                className={cn(
                  'group relative flex w-full overflow-hidden rounded-lg border border-border/70 bg-card/50 transition-colors',
                  'hover:border-primary/40 hover:bg-card',
                  isSelected &&
                    'border-primary/60 bg-primary/[0.06] ring-1 ring-primary/30',
                  isChecked && !isSelected && 'border-primary/40',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn('w-0.5 shrink-0', rail)}
                />

                <label
                  className="flex shrink-0 cursor-pointer items-start pl-3 pt-3.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="sr-only">
                    Select ticket {t.id} for bulk action
                  </span>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSelect(t.id)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded border border-border bg-background transition-colors',
                      'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background',
                      isChecked &&
                        'border-primary bg-primary text-primary-foreground',
                    )}
                  >
                    {isChecked && <Check size={11} strokeWidth={3} />}
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => select(t.id)}
                  aria-pressed={isSelected}
                  className="flex min-w-0 flex-1 flex-col gap-1.5 p-3 text-left"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tracking-tight',
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

                  <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 pl-[42px] text-[11px] text-muted-foreground">
                    <span>{MARKETPLACE_LABEL[t.order.marketplace]}</span>
                    {t.channel && (
                      <>
                        <Dot />
                        <span>{CHANNEL_LABEL[t.channel]}</span>
                      </>
                    )}
                    <Dot />
                    <span
                      className={cn(age.bucket === 'stale' && 'text-destructive')}
                    >
                      {age.label}
                    </span>
                    <Dot />
                    <span
                      className={cn(
                        sla.tone === 'danger' && 'text-destructive',
                        sla.tone === 'warning' && 'text-brand-gold',
                      )}
                    >
                      {sla.label}
                    </span>
                    {dupRisk && (
                      <>
                        <Dot />
                        <span className="font-medium text-destructive">
                          Dup risk
                        </span>
                      </>
                    )}
                    {snoozed && (
                      <>
                        <Dot />
                        <span>Snoozed</span>
                      </>
                    )}
                    {t.agent && (
                      <>
                        <Dot />
                        <span className="max-w-[120px] truncate">
                          {t.agent}
                        </span>
                      </>
                    )}
                  </div>

                  {t.resolution && (
                    <div className="flex pl-[42px]">
                      <ResolutionChip ticket={t} />
                    </div>
                  )}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
