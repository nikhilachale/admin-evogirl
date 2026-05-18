import { useMemo } from 'react';
import { useTicketsStore } from '@/store/tickets';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  cn,
  formatINR,
  formatRelative,
  normalizePhoneDigits,
} from '@/lib/utils';
import { CheckCircle2, ShieldAlert, UserRound } from 'lucide-react';
import type { Order, Ticket } from '@/types/domain';

const MARKETPLACE_LABEL: Record<Order['marketplace'], string> = {
  amazon: 'Amazon',
  flipkart: 'Flipkart',
  meesho: 'Meesho',
  myntra: 'Myntra',
  direct: 'Direct',
};

interface OrderHistoryEntry {
  order: Order;
  /** Claims/returns filed on this order, newest first. */
  claims: Ticket[];
}

type OutcomeTone = 'success' | 'danger' | 'muted';

const OUTCOME_CLASS: Record<OutcomeTone, string> = {
  success: 'text-success',
  danger: 'text-destructive',
  muted: 'text-muted-foreground',
};

/** Human "what happened to this claim" summary from status + resolution. */
function claimOutcome(t: Ticket): { label: string; tone: OutcomeTone } {
  if (t.resolution === 'refund')
    return {
      label: `Refunded ${formatINR(t.resolutionAmount ?? t.order.amount)}`,
      tone: 'success',
    };
  if (t.resolution === 'voucher')
    return {
      label: `Voucher ${formatINR(t.resolutionAmount ?? 0)}`,
      tone: 'success',
    };
  if (t.resolution === 'replacement' || t.status === 'replacement-issued')
    return { label: 'Replaced', tone: 'success' };
  if (t.resolution === 'rejection' || t.status === 'rejected')
    return { label: 'Rejected', tone: 'danger' };
  const kind =
    t.requestType === 'return'
      ? 'Return'
      : t.requestType === 'refund'
        ? 'Refund'
        : t.requestType === 'replacement'
          ? 'Replacement'
          : 'Review';
  return {
    label: `${kind} ${t.status === 'escalated' ? 'escalated' : 'pending'}`,
    tone: 'muted',
  };
}

interface CustomerHistoryProps {
  ticket: Ticket;
}

/**
 * "Account risk" aside card — the customer's order & claim history across
 * every retailer (matched by id / phone / email), plus a compact risk read.
 * Reads from the in-memory tickets array (no backend).
 */
export function CustomerHistory({ ticket }: CustomerHistoryProps) {
  const allTickets = useTicketsStore((s) => s.tickets);
  const select = useTicketsStore((s) => s.select);

  const {
    priorCount,
    approvalRate,
    flaggedCount,
    lastTicketAt,
    orderHistory,
    summary,
  } = useMemo(() => {
    // Same shopper even across retailers / manually-logged contacts (which
    // mint a fresh customer.id): match on id OR phone OR email.
    const phone = normalizePhoneDigits(ticket.customer.phone);
    const email = ticket.customer.email?.trim().toLowerCase();
    const sameCustomer = (t: Ticket) =>
      t.customer.id === ticket.customer.id ||
      (phone && normalizePhoneDigits(t.customer.phone) === phone) ||
      (Boolean(email) && t.customer.email?.trim().toLowerCase() === email);

    const customerTickets = allTickets
      .filter(sameCustomer)
      .sort((a, b) => b.createdAt - a.createdAt);
    const priorTickets = customerTickets.filter((t) => t.id !== ticket.id);

    // One row per order (across every retailer), newest claim first.
    const byOrder = new Map<string, OrderHistoryEntry>();
    for (const t of customerTickets) {
      const entry = byOrder.get(t.order.id);
      if (entry) entry.claims.push(t);
      else byOrder.set(t.order.id, { order: t.order, claims: [t] });
    }
    const history = Array.from(byOrder.values()).sort(
      (a, b) => b.claims[0].createdAt - a.claims[0].createdAt,
    );

    const retailers = new Set(history.map((h) => h.order.marketplace));
    const approved = priorTickets.filter(
      (t) => t.status === 'resolved' || t.status === 'replacement-issued',
    ).length;
    const flagged = priorTickets.filter(
      (t) => t.riskStatus !== 'normal' || Boolean(t.aiReport?.flags.length),
    ).length;

    return {
      priorCount: priorTickets.length,
      approvalRate:
        priorTickets.length === 0
          ? null
          : Math.round((approved / priorTickets.length) * 100),
      flaggedCount: flagged,
      lastTicketAt: priorTickets[0]?.createdAt ?? null,
      orderHistory: history,
      summary: {
        orderCount: history.length,
        retailerCount: retailers.size,
        claimCount: customerTickets.length,
        repeatOrderClaims: history.filter((h) => h.claims.length > 1).length,
      },
    };
  }, [
    allTickets,
    ticket.customer.id,
    ticket.customer.phone,
    ticket.customer.email,
    ticket.id,
  ]);

  const accountRisk =
    ticket.riskStatus !== 'normal' ||
    flaggedCount > 0 ||
    summary.repeatOrderClaims > 0 ||
    ticket.dupCheck.status === 'bad';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound size={14} className="text-muted-foreground" />
              Account risk
            </CardTitle>
            <CardDescription>
              {ticket.customer.name} · {summary.orderCount} order
              {summary.orderCount === 1 ? '' : 's'} across{' '}
              {summary.retailerCount} retailer
              {summary.retailerCount === 1 ? '' : 's'}
            </CardDescription>
          </div>
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider',
              accountRisk
                ? 'bg-destructive/10 text-destructive'
                : 'bg-success/10 text-success',
            )}
          >
            {accountRisk ? (
              <ShieldAlert size={12} />
            ) : (
              <CheckCircle2 size={12} />
            )}
            {accountRisk ? 'Review' : 'Clear'}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-4">
        {/* One quiet metric strip instead of stacked boxes. */}
        <div className="grid grid-cols-3 divide-x divide-border rounded-lg border bg-background/40">
          <Metric label="Prior claims" value={String(priorCount)} />
          <Metric
            label="Approval"
            value={approvalRate === null ? '—' : `${approvalRate}%`}
            tone={
              approvalRate !== null && approvalRate < 30 ? 'danger' : undefined
            }
          />
          <Metric
            label="Risk signals"
            value={String(flaggedCount)}
            tone={flaggedCount > 0 ? 'danger' : undefined}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          {priorCount === 0
            ? 'First-time claimant.'
            : `Last claim ${
                lastTicketAt ? formatRelative(lastTicketAt) : 'unknown'
              }.`}
          {summary.repeatOrderClaims > 0 && (
            <span className="font-semibold text-destructive">
              {' '}
              {summary.repeatOrderClaims} order
              {summary.repeatOrderClaims === 1 ? '' : 's'} with repeat claims.
            </span>
          )}
        </p>

        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Order &amp; claim history
          </p>
          <ul className="max-h-72 divide-y divide-border/60 overflow-y-auto rounded-lg border">
            {orderHistory.map(({ order, claims }) => {
              const latest = claims[0];
              const outcome = claimOutcome(latest);
              const isCurrent = claims.some((c) => c.id === ticket.id);
              return (
                <li key={order.id}>
                  <button
                    type="button"
                    onClick={() => select(latest.id)}
                    className={cn(
                      'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/40',
                      isCurrent &&
                        'border-l-2 border-l-primary bg-primary/[0.04]',
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">
                        {order.product}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {MARKETPLACE_LABEL[order.marketplace]} ·{' '}
                        {formatINR(order.amount)} ·{' '}
                        {formatRelative(order.purchasedAt)}
                        {claims.length > 1 && (
                          <span className="text-destructive">
                            {' '}
                            · {claims.length} claims
                          </span>
                        )}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 text-[11px] font-semibold',
                        OUTCOME_CLASS[outcome.tone],
                      )}
                    >
                      {outcome.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="text-[10px] leading-relaxed text-muted-foreground/60">
          Orders with a claim on file. Full purchase history needs the
          marketplace backend.
        </p>
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'danger';
}) {
  return (
    <div className="px-3 py-2.5 text-center">
      <p
        className={cn(
          'text-lg font-bold tabular-nums leading-none',
          tone === 'danger' && 'text-destructive',
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
