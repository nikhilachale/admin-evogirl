import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { lookupPublicTicketById } from '@/lib/public-ticket-lookup';
import { CLAIM_FIRST_RESPONSE_TEXT } from '@/lib/claim-auto-ack';

export function TicketStatusLookup() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');

  const result =
    submitted.trim() === '' ? null : lookupPublicTicketById(submitted);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Track your claim</CardTitle>
        <CardDescription>
          Enter the ticket ID from your confirmation (for example TKT-2401).
          Status updates when you use this device after our team has worked the
          claim in the admin console — connect a backend for live lookup
          everywhere.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(query.trim());
          }}
        >
          <Input
            id="ticket-lookup-id"
            name="ticketId"
            placeholder="e.g. TKT-2401"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            className="font-mono sm:flex-1"
            aria-label="Ticket ID"
          />
          <Button type="submit">Check status</Button>
        </form>

        {submitted && result && !result.found && (
          <p className="text-sm text-muted-foreground" role="status">
            No ticket found for{' '}
            <span className="font-mono font-semibold text-foreground">
              {submitted}
            </span>
            . Check the ID or email us with your order number.
          </p>
        )}

        {result && result.found && (
          <div
            className="space-y-3 rounded-lg border border-border bg-muted/40 p-4"
            role="status"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-mono text-sm font-semibold">{result.id}</p>
              <p className="text-sm font-medium text-foreground">
                {result.statusLabel}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Update:</span>{' '}
              {result.contactLabel}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Order:</span>{' '}
              <span className="font-mono">{result.orderId}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Product:</span>{' '}
              {result.productLabel}
            </p>
            <p className="text-xs text-muted-foreground">
              Last activity {result.lastActivityLabel}
            </p>
          </div>
        )}

        <details className="rounded-md border border-border bg-card/60 px-3 py-2 text-sm">
          <summary className="cursor-pointer font-medium text-foreground">
            What you should see first
          </summary>
          <p className="mt-2 text-muted-foreground">
            {CLAIM_FIRST_RESPONSE_TEXT}
          </p>
        </details>
      </CardContent>
    </Card>
  );
}
