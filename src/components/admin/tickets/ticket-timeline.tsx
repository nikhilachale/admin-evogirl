import { ImageOff } from 'lucide-react';
import { cn, formatRelative } from '@/lib/utils';
import type { Ticket, TicketMessage } from '@/types/domain';

export type TicketTimelineItem = TicketMessage & {
  kind: 'public' | 'internal' | 'system';
};

interface TicketTimelineProps {
  ticket: Ticket;
  emptyLabel?: string;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function getTicketTimeline(ticket: Ticket): TicketTimelineItem[] {
  return [
    ...ticket.messages.map((message) => ({
      ...message,
      kind:
        message.from === 'system' ? ('system' as const) : ('public' as const),
    })),
    ...ticket.notes.map((note) => ({
      ...note,
      kind:
        note.from === 'system' ? ('system' as const) : ('internal' as const),
    })),
  ].sort((a, b) => a.at - b.at);
}

export function TicketTimeline({
  ticket,
  emptyLabel = 'No timeline events yet.',
}: TicketTimelineProps) {
  const timeline = getTicketTimeline(ticket);

  if (timeline.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border bg-background/40 p-4 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {timeline.map((item) => (
        <div
          key={`${item.kind}-${item.id}`}
          className={cn(
            'flex gap-2',
            item.from === 'agent' &&
              item.kind === 'public' &&
              'flex-row-reverse',
            item.from === 'system' && 'justify-center',
          )}
        >
          {item.from !== 'system' && (
            <span
              className={cn(
                'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold uppercase tracking-tight',
                item.from === 'customer' && 'bg-muted text-muted-foreground',
                item.from === 'agent' && 'bg-primary/15 text-primary',
              )}
              aria-hidden="true"
            >
              {item.from === 'customer'
                ? getInitials(ticket.customer.name)
                : 'A'}
            </span>
          )}
          <div
            className={cn(
              'max-w-[80%] rounded-lg px-3 py-2 text-sm',
              item.from === 'customer' &&
                'rounded-tl-sm bg-muted text-foreground',
              item.from === 'agent' &&
                item.kind === 'public' &&
                'rounded-tr-sm bg-primary/10 text-foreground',
              item.kind === 'internal' &&
                'border-l-2 border-brand-gold/60 bg-background/50',
              item.from === 'system' &&
                'border border-success/30 bg-success/5 px-3 py-1.5 text-xs text-muted-foreground',
            )}
          >
            <p
              className={cn(
                'mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground',
                item.from === 'system' && 'mb-0 inline-block',
              )}
            >
              {item.from === 'system'
                ? `system · ${formatRelative(item.at)} - `
                : `${item.kind === 'internal' ? 'internal note' : item.from} · ${formatRelative(item.at)}`}
            </p>
            <p className={cn(item.from === 'system' && 'inline')}>
              {item.text}
            </p>
            {item.attachments && item.attachments.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {item.attachments.map((attachment) =>
                  attachment.type === 'image' ? (
                    <a
                      key={attachment.url}
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block h-16 w-16 overflow-hidden rounded-md border border-border bg-background transition-transform hover:scale-105"
                    >
                      <img
                        src={attachment.url}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </a>
                  ) : (
                    <a
                      key={attachment.url}
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-[11px] font-semibold transition-colors hover:bg-muted"
                    >
                      <ImageOff size={12} />
                      Video
                    </a>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
