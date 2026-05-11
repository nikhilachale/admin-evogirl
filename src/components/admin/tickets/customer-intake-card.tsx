import {
  MessageSquareText,
  PackageCheck,
  Phone,
  UserRound,
} from 'lucide-react';
import type { ReactNode } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatRelative } from '@/lib/utils';
import type { Ticket } from '@/types/domain';

const REQUEST_LABEL: Record<Ticket['requestType'], string> = {
  return: 'Return',
  replacement: 'Replacement',
  'review-check': 'Review check',
  refund: 'Refund',
};

const ISSUE_LABEL: Record<Ticket['issueType'], string> = {
  damage: 'Damage',
  'color-change': 'Color change',
  'wrong-item': 'Wrong item',
  defect: 'Defect',
  other: 'Other',
};

export function CustomerIntakeCard({ ticket }: { ticket: Ticket }) {
  const firstCustomerMessage = ticket.messages.find(
    (message) => message.from === 'customer',
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Customer intake</CardTitle>
        <CardDescription>
          Form context captured when the claim entered the queue.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pb-4 text-sm">
        <IntakeRow
          icon={<UserRound size={15} />}
          label="Customer"
          value={`${ticket.customer.name} · ${ticket.customer.id}`}
        />
        <IntakeRow
          icon={<Phone size={15} />}
          label="Contact"
          value={
            ticket.customer.email
              ? `${ticket.customer.phone} · ${ticket.customer.email}`
              : ticket.customer.phone
          }
        />
        <IntakeRow
          icon={<PackageCheck size={15} />}
          label="Request"
          value={`${REQUEST_LABEL[ticket.requestType]} · ${ISSUE_LABEL[ticket.issueType]}`}
        />
        <div className="rounded-md border bg-background/50 p-3">
          <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <MessageSquareText size={14} />
            Customer note
          </div>
          <p className="leading-relaxed text-foreground">
            {firstCustomerMessage?.text ?? 'No customer note was submitted.'}
          </p>
          {firstCustomerMessage && (
            <p className="mt-2 text-xs text-muted-foreground">
              Submitted {formatRelative(firstCustomerMessage.at)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function IntakeRow({
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
