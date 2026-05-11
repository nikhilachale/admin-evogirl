import { useMemo, type ReactNode } from 'react';
import { useTicketsStore } from '@/store/tickets';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn, formatRelative } from '@/lib/utils';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  History,
  ShieldAlert,
  Sparkles,
  UserRound,
} from 'lucide-react';
import type {
  CustomerContactStatus,
  Ticket,
  TicketRiskStatus,
} from '@/types/domain';

const STATUS_LABEL: Record<Ticket['status'], string> = {
  pending: 'Pending review',
  resolved: 'Resolved',
  rejected: 'Rejected',
  'replacement-issued': 'Replacement issued',
  escalated: 'Escalated',
};

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

const CONTACT_LABEL: Record<CustomerContactStatus, string> = {
  'customer-notified': 'Customer notified',
  'awaiting-customer-reply': 'Awaiting reply',
  'reply-received': 'Reply received',
  'no-response': 'No response',
  'follow-up-scheduled': 'Follow-up scheduled',
};

const RISK_LABEL: Record<TicketRiskStatus, string> = {
  normal: 'Normal',
  suspicious: 'Suspicious',
  fraud: 'Fraud',
  duplicate: 'Duplicate',
};

interface CustomerHistoryProps {
  ticket: Ticket;
}

/**
 * "Customer history" aside card — surfaces prior tickets for the same
 * customer so the agent can see whether they're looking at a first-time
 * claimant or a repeat case. Reads from the in-memory tickets array
 * (no backend) and lets the agent jump to any prior ticket.
 */
export function CustomerHistory({ ticket }: CustomerHistoryProps) {
  const allTickets = useTicketsStore((s) => s.tickets);
  const select = useTicketsStore((s) => s.select);

  const {
    prior,
    approvalRate,
    rejectedCount,
    flaggedCount,
    unresolvedCount,
    lastTicketAt,
  } = useMemo(() => {
    const priorTickets = allTickets
      .filter((t) => t.customer.id === ticket.customer.id && t.id !== ticket.id)
      .sort((a, b) => b.createdAt - a.createdAt);

    if (priorTickets.length === 0) {
      return {
        prior: priorTickets,
        approvalRate: 0,
        rejectedCount: 0,
        flaggedCount: 0,
        unresolvedCount: 0,
        lastTicketAt: null,
      };
    }

    const approved = priorTickets.filter(
      (t) => t.status === 'resolved' || t.status === 'replacement-issued',
    ).length;
    const rejected = priorTickets.filter((t) => t.status === 'rejected').length;
    const flagged = priorTickets.filter(
      (t) =>
        t.riskStatus === 'fraud' ||
        t.riskStatus === 'duplicate' ||
        t.riskStatus === 'suspicious' ||
        Boolean(t.aiReport?.flags.length),
    ).length;
    const unresolved = priorTickets.filter(
      (t) => t.status === 'pending' || t.status === 'escalated',
    ).length;

    return {
      prior: priorTickets,
      approvalRate: Math.round((approved / priorTickets.length) * 100),
      rejectedCount: rejected,
      flaggedCount: flagged,
      unresolvedCount: unresolved,
      lastTicketAt: priorTickets[0]?.createdAt ?? null,
    };
  }, [allTickets, ticket.customer.id, ticket.id]);

  const accountRisk =
    ticket.riskStatus !== 'normal' ||
    flaggedCount > 0 ||
    rejectedCount > 0 ||
    ticket.dupCheck.status === 'bad';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound size={14} className="text-muted-foreground" />
              Account risk
            </CardTitle>
            <CardDescription>
              Customer status and prior tickets for {ticket.customer.name}.
            </CardDescription>
          </div>
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wider',
              accountRisk
                ? 'border-destructive/40 bg-destructive/10 text-destructive'
                : 'border-success/40 bg-success/10 text-success',
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
      <CardContent className="space-y-3 pb-4">
        <div className="grid grid-cols-2 gap-2">
          <StatusPreview
            icon={<Clock3 size={14} />}
            label="Contact"
            value={CONTACT_LABEL[ticket.contactStatus]}
            tone={
              ticket.contactStatus === 'reply-received'
                ? 'success'
                : ticket.contactStatus === 'no-response'
                  ? 'danger'
                  : 'muted'
            }
          />
          <StatusPreview
            icon={<AlertTriangle size={14} />}
            label="Current risk"
            value={RISK_LABEL[ticket.riskStatus]}
            tone={ticket.riskStatus === 'normal' ? 'success' : 'danger'}
          />
        </div>

        {prior.length === 0 ? (
          <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/5 p-2.5 text-sm">
            <Sparkles size={16} className="text-success" />
            <span>First-time claimant</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md border bg-background/50 p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Prior
                </p>
                <p className="mt-0.5 text-lg font-bold tabular-nums">
                  {prior.length}
                </p>
              </div>
              <div className="rounded-md border bg-background/50 p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Approval rate
                </p>
                <p
                  className={cn(
                    'mt-0.5 text-lg font-bold tabular-nums',
                    approvalRate >= 60 && 'text-success',
                    approvalRate < 30 && 'text-destructive',
                  )}
                >
                  {approvalRate}%
                </p>
              </div>
              <div className="rounded-md border bg-background/50 p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Flagged
                </p>
                <p
                  className={cn(
                    'mt-0.5 text-lg font-bold tabular-nums',
                    flaggedCount > 0 && 'text-destructive',
                  )}
                >
                  {flaggedCount}
                </p>
              </div>
              <div className="rounded-md border bg-background/50 p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Open
                </p>
                <p
                  className={cn(
                    'mt-0.5 text-lg font-bold tabular-nums',
                    unresolvedCount > 0 && 'text-brand-gold',
                  )}
                >
                  {unresolvedCount}
                </p>
              </div>
            </div>

            <div
              className={cn(
                'flex items-start gap-2 rounded-md border p-2.5 text-xs',
                accountRisk
                  ? 'border-destructive/30 bg-destructive/10 text-destructive'
                  : 'border-border bg-background/50 text-muted-foreground',
              )}
            >
              <History size={14} className="mt-0.5 shrink-0" />
              <p>
                Last prior ticket{' '}
                {lastTicketAt ? formatRelative(lastTicketAt) : 'not found'}.
                {rejectedCount > 0 &&
                  ` ${rejectedCount} prior rejection${rejectedCount === 1 ? '' : 's'}.`}
                {flaggedCount > 0 &&
                  ` ${flaggedCount} prior risk signal${flaggedCount === 1 ? '' : 's'}.`}
              </p>
            </div>

            <ul className="space-y-1.5">
              {prior.slice(0, 3).map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => select(t.id)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-md border bg-background/50 px-2.5 py-2 text-left transition-colors',
                      'hover:border-primary/40 hover:bg-card',
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {t.id}
                      </span>
                      <Badge
                        variant={STATUS_VARIANT[t.status]}
                        className="shrink-0 text-[10px]"
                      >
                        {STATUS_LABEL[t.status]}
                      </Badge>
                    </div>
                    <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                      {formatRelative(t.createdAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            {prior.length > 3 && (
              <p className="text-center text-[11px] text-muted-foreground">
                +{prior.length - 3} more prior ticket
                {prior.length - 3 === 1 ? '' : 's'}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface StatusPreviewProps {
  icon: ReactNode;
  label: string;
  value: string;
  tone: 'success' | 'danger' | 'muted';
}

function StatusPreview({ icon, label, value, tone }: StatusPreviewProps) {
  return (
    <div
      className={cn(
        'rounded-md border bg-background/50 p-2.5',
        tone === 'success' && 'border-success/30 bg-success/5',
        tone === 'danger' && 'border-destructive/30 bg-destructive/10',
      )}
    >
      <div
        className={cn(
          'flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground',
          tone === 'success' && 'text-success',
          tone === 'danger' && 'text-destructive',
        )}
      >
        {icon}
        {label}
      </div>
      <p className="mt-1 text-sm font-semibold leading-tight">{value}</p>
    </div>
  );
}
