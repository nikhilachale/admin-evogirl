import { useTicketsStore } from '@/store/tickets';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock3,
  Headphones,
  ShieldAlert,
  UserRound,
} from 'lucide-react';
import type { Ticket } from '@/types/domain';
import { BulkActionBar } from './bulk-action-bar';
import { ResolutionChip } from './resolution-chip';
import {
  applyVisibleTicketFilters,
  getAgeBucket,
  getSlaState,
  hasActiveTicketFilters,
  normalizeTicketsFilters,
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

const DUP_LABEL: Record<Ticket['dupCheck']['status'], string> = {
  ok: 'Verified',
  bad: 'Duplicate risk',
  unknown: 'Unchecked',
  checking: 'Checking',
  failed: 'Check failed',
};

const MARKETPLACE_LABEL: Record<Ticket['order']['marketplace'], string> = {
  amazon: 'Amazon',
  flipkart: 'Flipkart',
  meesho: 'Meesho',
  myntra: 'Myntra',
  direct: 'Direct',
};

// Marketplace-brand colors so the queue is scannable at a glance.
const MARKETPLACE_CLASS: Record<Ticket['order']['marketplace'], string> = {
  amazon:
    'bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/30',
  flipkart:
    'bg-sky-500/15 text-sky-300 ring-1 ring-inset ring-sky-500/30',
  meesho:
    'bg-pink-500/15 text-pink-300 ring-1 ring-inset ring-pink-500/30',
  myntra:
    'bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-500/30',
  direct:
    'bg-brand-purple/20 text-brand-purple-light ring-1 ring-inset ring-brand-purple/40',
};

const AGE_CLASS: Record<'fresh' | 'aging' | 'stale', string> = {
  fresh:
    'bg-success/15 text-success ring-1 ring-inset ring-success/30',
  aging:
    'bg-brand-gold/15 text-brand-gold ring-1 ring-inset ring-brand-gold/30',
  stale:
    'bg-destructive/15 text-destructive ring-1 ring-inset ring-destructive/30',
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

export function TicketsList() {
  const tickets = useTicketsStore((s) => s.tickets);
  const filters = useTicketsStore((s) => s.filters);
  const activeView = useTicketsStore((s) => s.activeView);
  const selectedId = useTicketsStore((s) => s.selectedId);
  const select = useTicketsStore((s) => s.select);
  const setFilters = useTicketsStore((s) => s.setFilters);
  const selectedIds = useTicketsStore((s) => s.selectedIds);
  const toggleSelect = useTicketsStore((s) => s.toggleSelect);

  const filtered = applyVisibleTicketFilters(tickets, filters, activeView);

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
      <ul className="flex flex-col gap-2 p-3">
        {filtered.map((t) => {
          const isSelected = selectedId === t.id;
          const isChecked = selectedIds.has(t.id);
          const rail = getSeverityRail(t);
          const sla = getSlaState(t);
          const age = getAgeBucket(t);
          const hasRisk =
            t.dupCheck.status === 'bad' ||
            t.dupCheck.status === 'failed' ||
            t.riskStatus !== 'normal' ||
            Boolean(t.tag) ||
            (t.aiReport?.flags.length ?? 0) > 0;

          return (
            <li key={t.id}>
              <div
                className={cn(
                  'group relative flex w-full overflow-hidden rounded-lg border bg-card/65 transition-all',
                  'hover:border-primary/45 hover:bg-card hover:shadow-sm',
                  isSelected &&
                    'border-primary/70 bg-primary/[0.08] shadow-sm shadow-primary/10 ring-1 ring-primary/40',
                  isChecked && 'border-primary/50 bg-primary/[0.06]',
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
                  className="flex min-w-0 flex-1 flex-col gap-2 p-3 text-left"
                >
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
                        (t.dupCheck.status === 'bad' ||
                          t.dupCheck.status === 'failed') &&
                          'text-destructive',
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
                    <span
                      className={cn(
                        'inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider tabular-nums',
                        AGE_CLASS[age.bucket],
                      )}
                      title={`Opened ${age.label} ago`}
                    >
                      <Clock3 size={11} />
                      {age.label}
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5',
                        MARKETPLACE_CLASS[t.order.marketplace],
                      )}
                    >
                      <Headphones size={11} />
                      {MARKETPLACE_LABEL[t.order.marketplace]}
                    </span>
                    <span className="inline-flex min-w-0 items-center gap-1 rounded-md bg-muted px-1.5 py-0.5">
                      <UserRound size={11} />
                      <span className="max-w-[110px] truncate">
                        {t.agent ?? 'Unassigned'}
                      </span>
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5',
                        sla.tone === 'danger' && 'text-destructive',
                        sla.tone === 'warning' && 'text-brand-gold',
                      )}
                    >
                      <ShieldAlert size={11} />
                      {sla.label}
                    </span>
                  </div>

                  {t.resolution && (
                    <div className="flex">
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
