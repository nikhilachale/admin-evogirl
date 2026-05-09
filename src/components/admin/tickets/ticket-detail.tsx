import { useTicketsStore } from '@/store/tickets';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
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
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock3,
  Flag,
  Inbox,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserRound,
  XCircle,
  ZoomIn,
} from 'lucide-react';
import type {
  AiReportFlag,
  Ticket,
  TicketIssue,
  TicketKind,
} from '@/types/domain';
import { ResolutionChip } from './resolution-chip';
import { CustomerHistory } from './customer-history';

const KIND_LABEL: Record<TicketKind, string> = {
  return: 'Return',
  replacement: 'Replacement',
  'review-check': 'Review check',
};

const ISSUE_LABEL: Record<TicketIssue, string> = {
  damage: 'Damage',
  'color-change': 'Color change',
  other: 'Other',
};

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
};

const STATUS_LABEL: Record<Ticket['status'], string> = {
  pending: 'Pending review',
  resolved: 'Resolved',
  rejected: 'Rejected',
  'replacement-issued': 'Replacement issued',
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

function getDecisionCopy(ticket: Ticket) {
  if (ticket.status === 'rejected') return 'Claim rejected';
  if (ticket.status === 'resolved') return 'Ticket resolved';
  if (ticket.status === 'replacement-issued') return 'Replacement is in queue';
  if (ticket.dupCheck.status === 'bad') return 'Review fraud signals first';
  if (ticket.aiReport?.flags.length) return 'Needs manual verification';
  if (ticket.kind === 'replacement') return 'Likely replacement approval';
  return 'Review evidence and choose outcome';
}

export function TicketDetail() {
  const selectedId = useTicketsStore((s) => s.selectedId);
  const ticket = useTicketsStore((s) =>
    s.tickets.find((t) => t.id === s.selectedId),
  );
  const tickets = useTicketsStore((s) => s.tickets);
  const { approve, reject, flagFraud, escalate, runDupCheck } =
    useTicketsStore();

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
    ticket.status === 'resolved' || ticket.status === 'rejected';
  const hasRisk =
    ticket.dupCheck.status === 'bad' ||
    Boolean(ticket.tag) ||
    Boolean(ticket.aiReport?.flags.length);

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
                <Badge variant={resolved ? 'secondary' : 'pending'}>
                  {STATUS_LABEL[ticket.status]}
                </Badge>
                <ResolutionChip ticket={ticket} />
                {ticket.tag && <Badge variant="fraud">{ticket.tag}</Badge>}
              </div>
              <h1 className="mt-1.5 truncate text-2xl font-bold leading-tight">
                {ticket.customer.name}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {ticket.customer.phone}
                {ticket.customer.email && ` · ${ticket.customer.email}`}
              </p>
            </div>
          </div>
          <div
            className={cn(
              'rounded-lg border bg-card px-4 py-3 text-right',
              hasRisk && 'border-destructive/30 bg-destructive/5',
            )}
          >
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Recommended next step
            </p>
            <p
              className={cn(
                'mt-1 text-sm font-semibold',
                hasRisk ? 'text-destructive' : 'text-foreground',
              )}
            >
              {getDecisionCopy(ticket)}
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
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
              <CardContent className="pb-4">
                <OrderTimeline
                  purchasedAt={ticket.order.purchasedAt}
                  deliveredAt={ticket.order.deliveredAt}
                  claimAt={ticket.createdAt}
                />
              </CardContent>
            </Card>

            {(ticket.kind || ticket.issue || ticket.issuePhotos?.length) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Issue raised</CardTitle>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {ticket.kind && (
                      <span className="rounded-md bg-foreground/[0.08] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-foreground">
                        {KIND_LABEL[ticket.kind]}
                      </span>
                    )}
                    {ticket.issue && (
                      <span className="rounded-md bg-brand-gold/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand-gold">
                        {ISSUE_LABEL[ticket.issue]}
                      </span>
                    )}
                    {ticket.issuePhotos && ticket.issuePhotos.length > 0 && (
                      <span className="text-[11px] text-muted-foreground">
                        {ticket.issuePhotos.length} photo
                        {ticket.issuePhotos.length === 1 ? '' : 's'} uploaded
                      </span>
                    )}
                  </div>
                </CardHeader>
                {ticket.issuePhotos && ticket.issuePhotos.length > 0 && (
                  <CardContent className="pb-4">
                    <div className="grid grid-cols-3 gap-2">
                      {ticket.issuePhotos.map((src, i) => (
                        <a
                          key={src}
                          href={src}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Open issue photo ${i + 1}`}
                          className="group relative block aspect-square overflow-hidden rounded-lg border border-border bg-muted"
                        >
                          <img
                            src={src}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <span className="pointer-events-none absolute inset-0 bg-foreground/0 transition-colors group-hover:bg-foreground/30" />
                          <span className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-md bg-background/85 text-foreground opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                            <ZoomIn size={14} />
                          </span>
                          <span className="absolute bottom-1.5 left-1.5 rounded bg-background/85 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-foreground backdrop-blur">
                            {i + 1}/{ticket.issuePhotos!.length}
                          </span>
                        </a>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

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

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Conversation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
                {ticket.messages.length === 0 && (
                  <p className="rounded-md border border-dashed border-border bg-background/40 p-4 text-center text-sm text-muted-foreground">
                    No customer conversation yet. This ticket was created from
                    an automated event.
                  </p>
                )}
                {ticket.messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      'flex gap-2',
                      m.from === 'agent' && 'flex-row-reverse',
                      m.from === 'system' && 'justify-center',
                    )}
                  >
                    {m.from !== 'system' && (
                      <span
                        className={cn(
                          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold uppercase tracking-tight',
                          m.from === 'customer' &&
                            'bg-muted text-muted-foreground',
                          m.from === 'agent' && 'bg-primary/15 text-primary',
                        )}
                        aria-hidden="true"
                      >
                        {m.from === 'customer'
                          ? getInitials(ticket.customer.name)
                          : 'A'}
                      </span>
                    )}
                    <div
                      className={cn(
                        'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                        m.from === 'customer' &&
                          'rounded-tl-sm bg-muted text-foreground',
                        m.from === 'agent' &&
                          'rounded-tr-sm bg-primary/10 text-foreground',
                        m.from === 'system' &&
                          'border border-success/30 bg-success/5 px-3 py-1.5 text-xs text-muted-foreground',
                      )}
                    >
                      <p
                        className={cn(
                          'mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground',
                          m.from === 'system' && 'mb-0 inline-block',
                        )}
                      >
                        {m.from === 'system'
                          ? `system · ${formatRelative(m.at)} — `
                          : `${m.from} · ${formatRelative(m.at)}`}
                      </p>
                      <p className={cn(m.from === 'system' && 'inline')}>
                        {m.text}
                      </p>
                      {m.attachments && m.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {m.attachments.map((a) =>
                            a.type === 'image' ? (
                              <a
                                key={a.url}
                                href={a.url}
                                target="_blank"
                                rel="noreferrer"
                                className="block h-16 w-16 overflow-hidden rounded-md border border-border bg-background transition-transform hover:scale-105"
                              >
                                <img
                                  src={a.url}
                                  alt="attachment"
                                  loading="lazy"
                                  className="h-full w-full object-cover"
                                />
                              </a>
                            ) : (
                              <a
                                key={a.url}
                                href={a.url}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-md border border-border bg-background px-2 py-1 text-[11px] font-semibold transition-colors hover:bg-muted"
                              >
                                Video
                              </a>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {!resolved && <TicketComposer ticketId={ticket.id} />}
              </CardContent>
            </Card>

            {ticket.notes.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Agent notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pb-4">
                  {ticket.notes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-lg border-l-2 border-brand-gold/60 bg-background/50 p-3 text-sm"
                    >
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {note.from} · {formatRelative(note.at)}
                      </p>
                      <p>{note.text}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <aside className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Verification</CardTitle>
                <CardDescription>
                  Marketplace and AI risk signals for this claim.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
                <div
                  className={cn(
                    'rounded-lg border p-3',
                    ticket.dupCheck.status === 'bad' &&
                      'border-destructive/40 bg-destructive/10',
                    ticket.dupCheck.status === 'ok' &&
                      'border-success/40 bg-success/10',
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={cn(
                        'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                        ticket.dupCheck.status === 'ok' &&
                          'bg-success/20 text-success',
                        ticket.dupCheck.status === 'bad' &&
                          'bg-destructive/20 text-destructive',
                        (ticket.dupCheck.status === 'unknown' ||
                          ticket.dupCheck.status === 'checking') &&
                          'bg-brand-gold/20 text-brand-gold',
                      )}
                    >
                      {ticket.dupCheck.status === 'ok' ? (
                        <ShieldCheck size={15} />
                      ) : (
                        <AlertTriangle size={15} />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {DUP_LABEL[ticket.dupCheck.status]}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Last checked {ticket.dupCheck.checked}
                      </p>
                      {ticket.dupCheck.details && (
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          {ticket.dupCheck.details}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => void runDupCheck(ticket.id)}
                  disabled={ticket.dupCheck.status === 'checking'}
                >
                  <RefreshCw
                    size={16}
                    className={cn(
                      'mr-2',
                      ticket.dupCheck.status === 'checking' && 'animate-spin',
                    )}
                  />
                  Re-run marketplace check
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Claim summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pb-4 text-sm">
                <SummaryItem
                  icon={<UserRound size={15} />}
                  label="Customer"
                  value={ticket.customer.id}
                />
                <SummaryItem
                  icon={<PackageCheck size={15} />}
                  label="Request"
                  value={ticket.kind ? KIND_LABEL[ticket.kind] : ticket.type}
                />
                <SummaryItem
                  icon={<Bot size={15} />}
                  label="AI confidence"
                  value={
                    typeof ticket.aiReport?.confidence === 'number'
                      ? `${Math.round(ticket.aiReport.confidence * 100)}%`
                      : 'Not available'
                  }
                />
                <SummaryItem
                  icon={<Clock3 size={15} />}
                  label="Opened"
                  value={formatRelative(ticket.createdAt)}
                />
              </CardContent>
            </Card>

            <CustomerHistory ticket={ticket} />
          </aside>
        </div>
      </div>

      {!resolved ? (
        <div className="border-t bg-background/95 px-6 py-4 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => approve(ticket.id)} className="gap-2">
                <CheckCircle2 size={16} />
                Approve replacement
                <Kbd className="ml-1 border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground/80">
                  a
                </Kbd>
              </Button>
              <Button
                variant="destructive"
                onClick={() => reject(ticket.id)}
                className="gap-2"
              >
                <XCircle size={16} />
                Reject claim
                <Kbd className="ml-1 border-destructive-foreground/30 bg-destructive-foreground/10 text-destructive-foreground/80">
                  x
                </Kbd>
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => flagFraud(ticket.id)}
                className="gap-2"
              >
                <Flag size={16} />
                Flag fraud
              </Button>
              <Button variant="ghost" onClick={() => escalate(ticket.id)}>
                Escalate
              </Button>
            </div>
          </div>
        </div>
      ) : null}
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

function SummaryItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="truncate font-medium">{value}</p>
      </div>
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
