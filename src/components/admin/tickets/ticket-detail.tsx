import { useTicketsStore } from '@/store/tickets';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatINR, formatRelative } from '@/lib/utils';
import { CheckCircle2, XCircle, Flag, Sparkles } from 'lucide-react';
import type { AiReportFlag, TicketIssue, TicketKind } from '@/types/domain';

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

export function TicketDetail() {
  const selectedId = useTicketsStore((s) => s.selectedId);
  const ticket = useTicketsStore((s) =>
    s.tickets.find((t) => t.id === s.selectedId),
  );
  const { approve, reject, flagFraud, escalate } = useTicketsStore();

  if (!selectedId || !ticket) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Select a ticket to view details.
        </p>
      </div>
    );
  }

  const resolved =
    ticket.status === 'resolved' || ticket.status === 'rejected';

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-muted-foreground">{ticket.id}</p>
          <h1 className="mt-1 text-xl font-bold">{ticket.customer.name}</h1>
          <p className="text-sm text-muted-foreground">
            {ticket.customer.phone}
            {ticket.customer.email && ` · ${ticket.customer.email}`}
          </p>
        </div>
        {ticket.tag && <Badge variant="fraud">{ticket.tag}</Badge>}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Order</CardTitle>
          <CardDescription>
            {ticket.order.id} · {ticket.order.marketplace.toUpperCase()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 pb-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Product</span>
            <span className="font-medium">{ticket.order.product}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">SKU</span>
            <span className="font-mono text-xs">{ticket.order.sku}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold">
              {formatINR(ticket.order.amount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Purchased</span>
            <span>{formatRelative(ticket.order.purchasedAt)}</span>
          </div>
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
                  · {ticket.issuePhotos.length} photo
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
                    className="group relative block aspect-square overflow-hidden rounded-lg border border-border bg-muted"
                  >
                    <img
                      src={src}
                      alt={`Issue photo ${i + 1}`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
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
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span>No risk flags raised.</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {ticket.aiReport.flags.map((f) => (
                  <span
                    key={f}
                    className="rounded-md bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-400"
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
            <p className="text-sm text-muted-foreground">
              No messages yet.
            </p>
          )}
          {ticket.messages.map((m) => (
            <div
              key={m.id}
              className={
                m.from === 'customer'
                  ? 'rounded-lg bg-muted p-3 text-sm'
                  : m.from === 'agent'
                    ? 'rounded-lg bg-primary/10 p-3 text-sm'
                    : 'rounded-lg border-l-2 border-emerald-400/50 bg-emerald-400/5 p-3 text-xs'
              }
            >
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {m.from} · {formatRelative(m.at)}
              </p>
              <p>{m.text}</p>
              {m.attachments && m.attachments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.attachments.map((a) =>
                    a.type === 'image' ? (
                      <a
                        key={a.url}
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block h-16 w-16 overflow-hidden rounded-md border border-border bg-background"
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
                        className="rounded-md border border-border bg-background px-2 py-1 text-[11px] font-semibold"
                      >
                        🎬 Video
                      </a>
                    ),
                  )}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {!resolved && (
        <div className="sticky bottom-0 -mx-6 -mb-6 flex flex-wrap gap-2 border-t bg-background/95 p-4 backdrop-blur">
          <Button onClick={() => approve(ticket.id)}>
            <CheckCircle2 size={16} className="mr-2" />
            Approve & ship replacement
          </Button>
          <Button variant="destructive" onClick={() => reject(ticket.id)}>
            <XCircle size={16} className="mr-2" />
            Reject claim
          </Button>
          <Button variant="outline" onClick={() => flagFraud(ticket.id)}>
            <Flag size={16} className="mr-2" />
            Flag fraud
          </Button>
          <Button variant="ghost" onClick={() => escalate(ticket.id)}>
            Escalate
          </Button>
        </div>
      )}
    </div>
  );
}
