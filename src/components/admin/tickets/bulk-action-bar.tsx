import { AlertTriangle, Ban, X } from 'lucide-react';
import { useTicketsStore } from '@/store/tickets';
import { Button } from '@/components/ui/button';

export function BulkActionBar() {
  const selectedIds = useTicketsStore((s) => s.selectedIds);
  const bulkReject = useTicketsStore((s) => s.bulkReject);
  const bulkFlagFraud = useTicketsStore((s) => s.bulkFlagFraud);
  const clearSelection = useTicketsStore((s) => s.clearSelection);

  const count = selectedIds.size;
  if (count === 0) return null;

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
          onClick={() => bulkReject()}
        >
          <Ban size={13} className="mr-1" aria-hidden="true" />
          Reject all
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => bulkFlagFraud()}
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
