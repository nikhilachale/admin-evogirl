import type { Ticket, TicketResolution } from '@/types/domain';
import { cn, formatINR } from '@/lib/utils';

const RESOLUTION_TONE: Record<TicketResolution, string> = {
  replacement: 'bg-primary/15 text-primary',
  refund: 'bg-success/15 text-success',
  voucher: 'bg-brand-gold/15 text-brand-gold',
  rejection: 'bg-destructive/15 text-destructive',
};

function getLabel(ticket: Ticket): string | null {
  if (!ticket.resolution) return null;
  switch (ticket.resolution) {
    case 'replacement':
      return 'Replaced';
    case 'refund':
      return typeof ticket.resolutionAmount === 'number'
        ? `Refunded ${formatINR(ticket.resolutionAmount)}`
        : 'Refunded';
    case 'voucher':
      return typeof ticket.resolutionAmount === 'number'
        ? `Voucher ${formatINR(ticket.resolutionAmount)}`
        : 'Voucher';
    case 'rejection':
      return 'Rejected';
  }
}

interface ResolutionChipProps {
  ticket: Ticket;
  className?: string;
}

/**
 * Small pill that surfaces WHICH resolution path closed a ticket
 * (replacement / refund / voucher / rejection). Renders nothing if
 * the ticket has no resolution yet.
 */
export function ResolutionChip({ ticket, className }: ResolutionChipProps) {
  const label = getLabel(ticket);
  if (!label || !ticket.resolution) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider',
        RESOLUTION_TONE[ticket.resolution],
        className,
      )}
    >
      {label}
    </span>
  );
}
