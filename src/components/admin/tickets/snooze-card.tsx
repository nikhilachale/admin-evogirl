import { useState } from 'react';
import { useTicketsStore } from '@/store/tickets';
import type { Ticket } from '@/types/domain';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatRelative } from '@/lib/utils';
import { Bell } from 'lucide-react';
import { isSnoozeActive } from '@/components/admin/tickets/ticket-filtering';

function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultSnoozeLocalValue(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return toDatetimeLocalValue(d);
}

export function SnoozeCard({ ticket }: { ticket: Ticket }) {
  const snoozeTicket = useTicketsStore((s) => s.snoozeTicket);
  const clearSnooze = useTicketsStore((s) => s.clearSnooze);

  const resolved =
    ticket.status === 'resolved' ||
    ticket.status === 'rejected' ||
    ticket.status === 'replacement-issued';

  const [localUntil, setLocalUntil] = useState(defaultSnoozeLocalValue);

  const snoozeActive = isSnoozeActive(ticket);

  if (resolved) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell size={15} className="text-muted-foreground" />
          Snooze / follow-up
        </CardTitle>
        <CardDescription>
          Hide this ticket behind active work until a date. Clears when you
          resolve, reject, or reopen.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pb-4">
        {snoozeActive && ticket.snoozedUntil != null && (
          <p className="text-sm text-muted-foreground">
            Active until{' '}
            <span className="font-semibold text-foreground">
              {formatRelative(ticket.snoozedUntil)}
            </span>
            .
          </p>
        )}
        <div className="space-y-1.5">
          <label
            htmlFor={`snooze-until-${ticket.id}`}
            className="text-xs font-semibold text-muted-foreground"
          >
            Resume on
          </label>
          <Input
            id={`snooze-until-${ticket.id}`}
            type="datetime-local"
            value={localUntil}
            onChange={(e) => setLocalUntil(e.target.value)}
            className="font-mono text-xs"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              const ms = new Date(localUntil).getTime();
              snoozeTicket(ticket.id, ms);
            }}
          >
            Set snooze
          </Button>
          {snoozeActive && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => clearSnooze(ticket.id)}
            >
              Clear snooze
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
