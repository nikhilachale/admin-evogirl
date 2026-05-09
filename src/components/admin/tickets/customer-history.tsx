import { useMemo } from 'react';
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
import { Sparkles, UserRound } from 'lucide-react';
import type { Ticket } from '@/types/domain';

const STATUS_LABEL: Record<Ticket['status'], string> = {
  pending: 'Pending review',
  resolved: 'Resolved',
  rejected: 'Rejected',
  'replacement-issued': 'Replacement issued',
};

const STATUS_VARIANT: Record<
  Ticket['status'],
  'pending' | 'resolved' | 'rejected' | 'secondary'
> = {
  pending: 'pending',
  resolved: 'resolved',
  rejected: 'rejected',
  'replacement-issued': 'secondary',
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

  const { prior, approvalRate } = useMemo(() => {
    const priorTickets = allTickets
      .filter(
        (t) => t.customer.id === ticket.customer.id && t.id !== ticket.id,
      )
      .sort((a, b) => b.createdAt - a.createdAt);

    if (priorTickets.length === 0) {
      return { prior: priorTickets, approvalRate: 0 };
    }

    const approved = priorTickets.filter(
      (t) => t.status === 'resolved' || t.status === 'replacement-issued',
    ).length;

    return {
      prior: priorTickets,
      approvalRate: Math.round((approved / priorTickets.length) * 100),
    };
  }, [allTickets, ticket.customer.id, ticket.id]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <UserRound size={14} className="text-muted-foreground" />
          Customer history
        </CardTitle>
        <CardDescription>
          Prior tickets raised by {ticket.customer.name}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pb-4">
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
                  Prior tickets
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
