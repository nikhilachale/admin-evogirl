import { AlertTriangle, Ban, X } from 'lucide-react';
import { useTicketsStore } from '@/store/tickets';
import { Button } from '@/components/ui/button';
import type { RejectionReasonCategory } from '@/types/domain';

const REJECTION_CATEGORIES: {
  value: RejectionReasonCategory;
  label: string;
}[] = [
  { value: 'duplicate-claim', label: 'Duplicate claim' },
  { value: 'invalid-order', label: 'Invalid order' },
  { value: 'outside-warranty-window', label: 'Outside warranty window' },
  { value: 'insufficient-proof', label: 'Insufficient proof' },
  { value: 'photo-mismatch', label: 'Photo mismatch' },
  { value: 'product-not-covered', label: 'Product not covered' },
  { value: 'suspected-fraud', label: 'Suspected fraud' },
  { value: 'other', label: 'Other' },
];

function askRejectionCategory(): RejectionReasonCategory | null {
  const options = REJECTION_CATEGORIES.map(
    (category, index) => `${index + 1}. ${category.label}`,
  ).join('\n');
  const input = window.prompt(`Choose rejection category:\n\n${options}`);
  const index = Number(input) - 1;
  return REJECTION_CATEGORIES[index]?.value ?? null;
}

export function BulkActionBar() {
  const selectedIds = useTicketsStore((s) => s.selectedIds);
  const tickets = useTicketsStore((s) => s.tickets);
  const bulkReject = useTicketsStore((s) => s.bulkReject);
  const bulkFlagFraud = useTicketsStore((s) => s.bulkFlagFraud);
  const clearSelection = useTicketsStore((s) => s.clearSelection);

  const count = selectedIds.size;
  if (count === 0) return null;

  const selectedTickets = tickets.filter((ticket) => selectedIds.has(ticket.id));
  const actionableTickets = selectedTickets.filter(
    (ticket) =>
      ticket.status !== 'resolved' &&
      ticket.status !== 'rejected' &&
      ticket.status !== 'replacement-issued',
  );
  const skippedCount = selectedTickets.length - actionableTickets.length;
  const confirmList = actionableTickets
    .slice(0, 6)
    .map((ticket) => `${ticket.id} (${ticket.customer.name})`)
    .join('\n');

  const handleBulkReject = () => {
    const category = askRejectionCategory();
    if (!category) return;
    const reason = window.prompt('Reason for rejecting selected tickets');
    if (!reason?.trim()) return;
    if (
      !window.confirm(
        `Reject ${actionableTickets.length} selected ticket${
          actionableTickets.length === 1 ? '' : 's'
        }?\n\n${confirmList}${
          skippedCount > 0
            ? `\n\n${skippedCount} terminal ticket${
                skippedCount === 1 ? '' : 's'
              } will be skipped.`
            : ''
        }`,
      )
    ) {
      return;
    }
    bulkReject(category, reason);
  };

  const handleBulkFlagFraud = () => {
    const reason = window.prompt('Reason for flagging selected tickets as fraud');
    if (!reason?.trim()) return;
    if (
      !window.confirm(
        `Flag ${actionableTickets.length} selected ticket${
          actionableTickets.length === 1 ? '' : 's'
        } as fraud?\n\n${confirmList}${
          skippedCount > 0
            ? `\n\n${skippedCount} terminal ticket${
                skippedCount === 1 ? '' : 's'
              } will be skipped.`
            : ''
        }`,
      )
    ) {
      return;
    }
    bulkFlagFraud(reason);
  };

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-primary/30 bg-primary/5 px-3 py-2 backdrop-blur">
      <span className="text-xs font-semibold text-primary">
        {count} selected
      </span>
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="destructive"
          onClick={handleBulkReject}
          disabled={actionableTickets.length === 0}
        >
          <Ban size={13} className="mr-1" aria-hidden="true" />
          Reject all
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleBulkFlagFraud}
          disabled={actionableTickets.length === 0}
        >
          <AlertTriangle size={13} className="mr-1" aria-hidden="true" />
          Flag fraud
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => clearSelection()}
        >
          <X size={13} className="mr-1" aria-hidden="true" />
          Clear
        </Button>
      </div>
    </div>
  );
}
