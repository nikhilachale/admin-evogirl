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
import { cn, formatINR, formatRelative } from '@/lib/utils';
import { Kbd } from './kbd';
import { TicketComposer } from './ticket-composer';
import { Bell, CheckCircle2, Inbox, Sparkles, Timer } from 'lucide-react';
import type { AiReportFlag, Ticket } from '@/types/domain';
import { ResolutionChip } from './resolution-chip';
import { CustomerHistory } from './customer-history';
import {
  TicketClosedActions,
  TicketOpenActions,
} from './ticket-action-dialogs';
import { IssueAttachmentsPanel } from './issue-attachments-panel';
import { TicketTimeline } from './ticket-timeline';
import { getSlaState, isSnoozeActive } from './ticket-filtering';

const FLAG_LABEL: Record<AiReportFlag, string> = {
  suspicious: 'Suspicious',
  fraud: 'Fraud',
  duplicate: 'Duplicate',
  'photo-mismatch': 'Photo mismatch',
  'inconsistent-story': 'Inconsistent story',
  'prior-claims': 'Prior claims',
};

const DUP_LABEL: Record<Ticket['dupCheck']['status'], string> = {
  ok: 'Marketplace verified',
  bad: 'Duplicate risk',
  unknown: 'Not checked',
  checking: 'Checking marketplace',
  failed: 'Check failed',
};

const STATUS_LABEL: Record<Ticket['status'], string> = {
  pending: 'Pending review',
  resolved: 'Resolved',
  rejected: 'Rejected',
  'replacement-issued': 'Approved',
  escalated: 'Escalated',
};

const STATUS_VARIANT: Record<
  Ticket['status'],
  'pending' | 'resolved' | 'rejected' | 'secondary'
> = {
  pending: 'pending',
  resolved: 'resolved',
  rejected: 'rejected',
  'replacement-issued': 'resolved',
  escalated: 'secondary',
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

export function TicketDetail() {
  const selectedId = useTicketsStore((s) => s.selectedId);
  const ticket = useTicketsStore((s) =>
    s.tickets.find((t) => t.id === s.selectedId),
  );
  const tickets = useTicketsStore((s) => s.tickets);
  const updateAttachmentReview = useTicketsStore(
    (s) => s.updateAttachmentReview,
  );

  const priorCustomerTickets = useMemo(() => {
    if (!ticket) return [] as Ticket[];
    return tickets.filter(
      (candidate) =>
        candidate.customer.id === ticket.customer.id &&
        candidate.id !== ticket.id,
    );
  }, [tickets, ticket]);

  if (!selectedId || !ticket) {
    const pendingCount = tickets.filter((t) => t.status === 'pending').length;
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Inbox size={26} />
          </div>
          <p className="text-base font-semibold">No ticket selected</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {pendingCount > 0
              ? `${pendingCount} pending ticket${pendingCount === 1 ? '' : 's'} waiting for review.`
              : 'Pick a ticket from the queue to begin reviewing.'}
          </p>
          <div className="mt-6 inline-flex flex-col gap-2 rounded-lg border bg-card/50 p-4 text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Keyboard shortcuts
            </p>
            <ShortcutRow keys={['j', 'k']} label="Navigate queue" />
            <ShortcutRow keys={['/']} label="Focus search" />
            <ShortcutRow keys={['a']} label="Approve selected" />
            <ShortcutRow keys={['x']} label="Reject selected" />
            <ShortcutRow keys={['Esc']} label="Blur input" />
          </div>
        </div>
      </div>
    );
  }

  const resolved =
    ticket.status === 'resolved' ||
    ticket.status === 'rejected' ||
    ticket.status === 'replacement-issued';
  const hasRisk =
    ticket.dupCheck.status === 'bad' ||
    ticket.dupCheck.status === 'failed' ||
    ticket.dupCheck.status === 'unknown' ||
    ticket.riskStatus !== 'normal' ||
    Boolean(ticket.tag) ||
    Boolean(ticket.aiReport?.flags.length);
  const pendingAttachmentReviews =
    ticket.issueAttachments?.filter((attachment) => !attachment.reviewed)
      .length ?? 0;
  const hasPriorRejectedOrFraud = priorCustomerTickets.some(
    (candidate) =>
      candidate.status === 'rejected' ||
      candidate.riskStatus === 'fraud' ||
      candidate.riskStatus === 'duplicate',
  );
  const sla = getSlaState(ticket);
  const hasRequiredPhotoGap =
    (ticket.issueType === 'damage' || ticket.issueType === 'color-change') &&
    (ticket.issueAttachments?.length ?? 0) === 0;
  const approvalWarnings = [
    ticket.dupCheck.status !== 'ok'
      ? `Duplicate check is ${DUP_LABEL[ticket.dupCheck.status].toLowerCase()}`
      : null,
    ticket.aiReport?.flags.some((flag) =>
      ['fraud', 'duplicate', 'suspicious'].includes(flag),
    )
      ? 'AI report has fraud, duplicate, or suspicious flags'
      : null,
    hasRequiredPhotoGap ? 'No issue photos are attached' : null,
    hasPriorRejectedOrFraud
      ? 'Customer has prior rejected or fraud-risk tickets'
      : null,
    pendingAttachmentReviews > 0
      ? `${pendingAttachmentReviews} attachment review${pendingAttachmentReviews === 1 ? '' : 's'} pending`
      : null,
    !ticket.evidence.customerHistoryReviewed
      ? 'Customer history has not been reviewed'
      : null,
  ].filter(Boolean) as string[];
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="border-b bg-background/95 px-6 py-4 backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={cn(
                'mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold tracking-tight',
                hasRisk
                  ? 'bg-destructive/15 text-destructive'
                  : 'bg-primary/15 text-primary',
              )}
              aria-hidden="true"
            >
              {getInitials(ticket.customer.name)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">
                  {ticket.id}
                </span>
                <Badge variant={STATUS_VARIANT[ticket.status]}>
                  {STATUS_LABEL[ticket.status]}
                </Badge>
                {!resolved && isSnoozeActive(ticket) && (
                  <Badge variant="secondary" className="gap-1">
                    <Bell size={11} aria-hidden />
                    Snoozed
                  </Badge>
                )}
                <ResolutionChip ticket={ticket} />
                {ticket.tag && <Badge variant="fraud">{ticket.tag}</Badge>}
                {ticket.channel && (
                  <Badge variant="secondary" className="capitalize">
                    {ticket.channel.replace('-', ' ')}
                  </Badge>
                )}
                {!resolved && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                      sla.tone === 'danger' &&
                        'bg-destructive/15 text-destructive ring-1 ring-inset ring-destructive/30',
                      sla.tone === 'warning' &&
                        'bg-brand-gold/15 text-brand-gold ring-1 ring-inset ring-brand-gold/30',
                      sla.tone === 'muted' &&
                        'bg-muted text-muted-foreground ring-1 ring-inset ring-border',
                    )}
                    title={`Priority ${ticket.priority} · ${sla.targetHours}h target`}
                  >
                    <Timer size={11} />
                    {sla.label}
                  </span>
                )}
              </div>
              <h1 className="mt-1.5 truncate text-2xl font-bold leading-tight">
                {ticket.customer.name}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {ticket.customer.phone}
                {ticket.customer.email && ` · ${ticket.customer.email}`}
              </p>
              {ticket.intake && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Logged by {ticket.intake.loggedBy} via {ticket.intake.channel}
                  {ticket.intake.lookupStatus === 'unresolved' &&
                    ' · order unresolved'}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid gap-4 xl:grid-cols-1">
          <div className="space-y-4">
            <Card>
              <CardHeader className="border-b pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {ticket.order.id} · {ticket.order.marketplace}
                    </p>
                    <CardTitle className="mt-1.5 text-base leading-snug">
                      {ticket.order.product}
                    </CardTitle>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      SKU {ticket.order.sku}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Amount
                    </p>
                    <p className="mt-0.5 text-lg font-bold tabular-nums">
                      {formatINR(ticket.order.amount)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-0 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <OrderTimeline
                    purchasedAt={ticket.order.purchasedAt}
                    deliveredAt={ticket.order.deliveredAt}
                    claimAt={ticket.createdAt}
                  />
                  <div className="border-l pb-4 pl-4">
                    <div className="mb-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Request Type
                      </p>
                      <p className="truncate text-sm font-medium capitalize">
                        {ticket.requestType} ·{' '}
                        {ticket.issueType.replace('-', ' ')}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Customer Note
                      </p>
                      <p className="text-sm leading-relaxed text-foreground">
                        {ticket.messages.find((m) => m.from === 'customer')
                          ?.text ?? 'No customer note was submitted.'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div id={`ticket-photos-${ticket.id}`}>
              <IssueAttachmentsPanel
                attachments={ticket.issueAttachments}
                onUpdate={(attachmentId, patch) =>
                  updateAttachmentReview(ticket.id, attachmentId, patch)
                }
              />
            </div>

            {ticket.aiReport && (
              <Card>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Sparkles size={14} className="text-brand-gold" />
                      AI report
                    </CardTitle>
                    <CardDescription>
                      Generated {formatRelative(ticket.aiReport.generatedAt)}
                      {typeof ticket.aiReport.confidence === 'number' &&
                        ` · ${Math.round(ticket.aiReport.confidence * 100)}% confidence`}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pb-4">
                  {ticket.aiReport.flags.length === 0 ? (
                    <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/5 p-2.5 text-sm">
                      <CheckCircle2 size={16} className="text-success" />
                      <span>No risk flags raised.</span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {ticket.aiReport.flags.map((f) => (
                        <span
                          key={f}
                          className="rounded-md bg-destructive/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive"
                        >
                          {FLAG_LABEL[f]}
                        </span>
                      ))}
                    </div>
                  )}
                  {ticket.aiReport.summary && (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {ticket.aiReport.summary}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <CustomerHistory ticket={ticket} />

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Timeline</CardTitle>
                <CardDescription>
                  Public replies, internal notes, and system events in one audit
                  trail.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
                <TicketTimeline ticket={ticket} />
                {!resolved && <TicketComposer ticket={ticket} />}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {!resolved ? (
        <TicketOpenActions
          key={ticket.id}
          ticket={ticket}
          approvalWarnings={approvalWarnings}
        />
      ) : (
        <TicketClosedActions key={ticket.id} ticket={ticket} />
      )}
    </div>
  );
}

function OrderTimeline({
  purchasedAt,
  deliveredAt,
  claimAt,
}: {
  purchasedAt: number;
  deliveredAt?: number;
  claimAt: number;
}) {
  const steps: { label: string; value: string; state: 'done' | 'active' }[] = [
    {
      label: 'Purchased',
      value: formatRelative(purchasedAt),
      state: 'done',
    },
    ...(deliveredAt
      ? [
          {
            label: 'Delivered',
            value: formatRelative(deliveredAt),
            state: 'done' as const,
          },
        ]
      : []),
    {
      label: 'Claim raised',
      value: formatRelative(claimAt),
      state: 'active',
    },
  ];

  return (
    <div className="relative">
      <div
        className="absolute left-1 right-1 top-[5px] h-px bg-border"
        aria-hidden="true"
      />
      <ol
        className={cn(
          'relative grid gap-3',
          steps.length === 3 ? 'grid-cols-3' : 'grid-cols-2',
        )}
      >
        {steps.map((s) => (
          <li key={s.label} className="min-w-0">
            <span
              className={cn(
                'relative z-10 block h-2.5 w-2.5 rounded-full ring-4 ring-card',
                s.state === 'done' && 'bg-success',
                s.state === 'active' &&
                  'bg-brand-gold ring-brand-gold/20 ring-offset-2 ring-offset-card',
              )}
              aria-hidden="true"
            />
            <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {s.label}
            </p>
            <p className="mt-0.5 text-xs font-medium text-foreground">
              {s.value}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ShortcutRow({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1">
        {keys.map((k) => (
          <Kbd key={k}>{k}</Kbd>
        ))}
      </span>
    </div>
  );
}
