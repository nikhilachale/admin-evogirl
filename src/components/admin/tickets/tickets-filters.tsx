import { useState } from 'react';
import { useTicketsStore } from '@/store/tickets';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';
import { Kbd } from './kbd';
import { SavedViewsRow } from './saved-views';
import { LogContactDialog } from './log-contact-dialog';
import type {
  CustomerContactStatus,
  DupCheckStatus,
  Marketplace,
  Ticket,
  TicketChannel,
  TicketIssueType,
  TicketRiskStatus,
  TicketStatus,
} from '@/types/domain';
import type { TicketsFilters } from '@/store/tickets';

const STATUSES: { value: TicketStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'replacement-issued', label: 'Replaced' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'escalated', label: 'Escalated' },
];

const ISSUE_TYPES: { value: TicketIssueType | 'all'; label: string }[] = [
  { value: 'all', label: 'All issues' },
  { value: 'damage', label: 'Damage' },
  { value: 'color-change', label: 'Color change' },
  { value: 'defect', label: 'Defect' },
  { value: 'wrong-item', label: 'Wrong item' },
  { value: 'other', label: 'Other' },
];

const PRIORITIES: { value: Ticket['priority'] | 'all'; label: string }[] = [
  { value: 'all', label: 'All priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
];

const MARKETPLACES: { value: Marketplace | 'all'; label: string }[] = [
  { value: 'all', label: 'All marketplaces' },
  { value: 'amazon', label: 'Amazon' },
  { value: 'flipkart', label: 'Flipkart' },
  { value: 'meesho', label: 'Meesho' },
  { value: 'myntra', label: 'Myntra' },
  { value: 'direct', label: 'Direct' },
];

const CHANNELS: { value: TicketChannel | 'all'; label: string }[] = [
  { value: 'all', label: 'All channels' },
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'chat', label: 'Chat' },
  { value: 'web-form', label: 'Web form' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'other', label: 'Other' },
];

const RISK_STATUSES: { value: TicketRiskStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All risk' },
  { value: 'normal', label: 'Normal' },
  { value: 'suspicious', label: 'Suspicious' },
  { value: 'fraud', label: 'Fraud' },
  { value: 'duplicate', label: 'Duplicate' },
];

const CONTACT_STATUSES: {
  value: CustomerContactStatus | 'all';
  label: string;
}[] = [
  { value: 'all', label: 'All contact' },
  { value: 'reply-received', label: 'Reply received' },
  { value: 'awaiting-customer-reply', label: 'Awaiting reply' },
  { value: 'customer-notified', label: 'Notified' },
  { value: 'no-response', label: 'No response' },
  { value: 'follow-up-scheduled', label: 'Follow-up' },
];

const DUP_CHECKS: { value: DupCheckStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All dup checks' },
  { value: 'ok', label: 'Verified' },
  { value: 'bad', label: 'Duplicate risk' },
  { value: 'unknown', label: 'Unchecked' },
  { value: 'checking', label: 'Checking' },
  { value: 'failed', label: 'Failed' },
];

const ATTACHMENT_FILTERS: {
  value: TicketsFilters['attachments'];
  label: string;
}[] = [
  { value: 'all', label: 'All attachments' },
  { value: 'has', label: 'Has uploads' },
  { value: 'none', label: 'No uploads' },
  { value: 'unreviewed', label: 'Unreviewed' },
  { value: 'suspicious', label: 'Suspicious' },
];

const EVIDENCE_FILTERS: { value: TicketsFilters['evidence']; label: string }[] = [
  { value: 'all', label: 'All evidence' },
  { value: 'incomplete', label: 'Any missing' },
  { value: 'orderVerified', label: 'Order missing' },
  { value: 'deliveryVerified', label: 'Delivery missing' },
  { value: 'photosReviewed', label: 'Photos missing' },
  { value: 'duplicateCheckPassed', label: 'Dup check missing' },
  { value: 'aiReportReviewed', label: 'AI review missing' },
  { value: 'customerHistoryReviewed', label: 'History missing' },
];

export function TicketsFilters() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const filters = useTicketsStore((s) => s.filters);
  const setFilter = useTicketsStore((s) => s.setFilter);
  const tickets = useTicketsStore((s) => s.tickets);
  const assignees = Array.from(
    new Set(
      tickets
        .map((ticket) => ticket.agent)
        .filter((agent): agent is string => Boolean(agent?.trim())),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const pendingCount = tickets.filter((t) => t.status === 'pending').length;
  const urgentCount = tickets.filter((t) => t.priority === 'urgent').length;
  const fraudCount = tickets.filter(
    (t) =>
      t.tag ||
      t.riskStatus === 'fraud' ||
      t.riskStatus === 'duplicate' ||
      t.dupCheck.status === 'bad',
  ).length;
  const activeFilterCount = [
    filters.status !== 'all',
    filters.issueType !== 'all',
    filters.priority !== 'all',
    filters.marketplace !== 'all',
    filters.assignee !== 'all',
    filters.contactStatus !== 'all',
    filters.riskStatus !== 'all',
    filters.dupCheck !== 'all',
    filters.attachments !== 'all',
    filters.evidence !== 'all',
    filters.channel !== 'all',
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-4 border-b bg-background/40 p-4">
      <div>
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Ticket queue
          </p>
          <LogContactDialog open={logOpen} onOpenChange={setLogOpen} />
        </div>
        <div className="mt-3 grid grid-cols-3 divide-x divide-border rounded-lg border bg-background/40">
          <QueueMetric label="Pending" value={pendingCount} tone="primary" />
          <QueueMetric label="Urgent" value={urgentCount} tone="danger" />
          <QueueMetric label="Risk" value={fraudCount} tone="warning" />
        </div>
      </div>

      <SavedViewsRow />

      <label className="relative block">
        <Search
          aria-hidden="true"
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id="ticket-search"
          placeholder="Search by phone, order, SKU, customer…"
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          className="pl-9 pr-12"
        />
        {filters.search ? (
          <button
            type="button"
            onClick={() => setFilter('search', '')}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X size={14} />
          </button>
        ) : (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <Kbd>/</Kbd>
          </span>
        )}
      </label>

      <div className="rounded-lg border border-border bg-card/45">
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-muted/40"
        >
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-foreground">
            <SlidersHorizontal size={14} className="text-muted-foreground" />
            Filters
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                {activeFilterCount} active
              </span>
            )}
          </span>
          <ChevronDown
            size={15}
            className={cn(
              'text-muted-foreground transition-transform',
              filtersOpen && 'rotate-180',
            )}
          />
        </button>

        {filtersOpen && (
          <div className="space-y-3 border-t border-border p-3">
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setFilter('status', s.value)}
                  className={cn(
                    'rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors',
                    filters.status === s.value
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-transparent bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {ISSUE_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFilter('issueType', type.value)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors',
                    filters.issueType === type.value
                      ? 'bg-secondary text-secondary-foreground ring-1 ring-border'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <FilterSelect
                label="Priority"
                value={filters.priority}
                options={PRIORITIES}
                onChange={(value) => setFilter('priority', value)}
              />
              <FilterSelect
                label="Marketplace"
                value={filters.marketplace}
                options={MARKETPLACES}
                onChange={(value) => setFilter('marketplace', value)}
              />
              <FilterSelect
                label="Channel"
                value={filters.channel}
                options={CHANNELS}
                onChange={(value) => setFilter('channel', value)}
              />
              <FilterSelect
                label="Assignee"
                value={filters.assignee}
                options={[
                  { value: 'all', label: 'All assignees' },
                  { value: 'unassigned', label: 'Unassigned' },
                  ...assignees.map((agent) => ({ value: agent, label: agent })),
                ]}
                onChange={(value) => setFilter('assignee', value)}
              />
              <FilterSelect
                label="Contact"
                value={filters.contactStatus}
                options={CONTACT_STATUSES}
                onChange={(value) => setFilter('contactStatus', value)}
              />
              <FilterSelect
                label="Risk"
                value={filters.riskStatus}
                options={RISK_STATUSES}
                onChange={(value) => setFilter('riskStatus', value)}
              />
              <FilterSelect
                label="Dup check"
                value={filters.dupCheck}
                options={DUP_CHECKS}
                onChange={(value) => setFilter('dupCheck', value)}
              />
              <FilterSelect
                label="Attachments"
                value={filters.attachments}
                options={ATTACHMENT_FILTERS}
                onChange={(value) => setFilter('attachments', value)}
              />
              <FilterSelect
                label="Evidence"
                value={filters.evidence}
                options={EVIDENCE_FILTERS}
                onChange={(value) => setFilter('evidence', value)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterSelect<TValue extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: TValue;
  options: { value: TValue; label: string }[];
  onChange: (value: TValue) => void;
}) {
  return (
    <label className="min-w-0">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as TValue)}
        className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs font-medium text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function QueueMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'primary' | 'danger' | 'warning';
}) {
  return (
    <div className="px-3 py-2.5 text-center">
      <p
        className={cn(
          'text-lg font-bold leading-none tabular-nums',
          tone === 'danger' && value > 0 && 'text-destructive',
          tone === 'warning' && value > 0 && 'text-brand-gold',
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
