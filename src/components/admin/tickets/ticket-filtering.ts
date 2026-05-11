import type {
  ClaimEvidenceChecklist,
  CustomerContactStatus,
  DupCheckStatus,
  Marketplace,
  Ticket,
  TicketRiskStatus,
} from '@/types/domain';
import type { TicketsFilters } from '@/store/tickets';
import { getPresetView } from './saved-views-config';

export type PriorityFilter = Ticket['priority'] | 'all';
export type MarketplaceFilter = Marketplace | 'all';
export type AssigneeFilter = string | 'all' | 'unassigned';
export type ContactFilter = CustomerContactStatus | 'all';
export type RiskFilter = TicketRiskStatus | 'all';
export type DupCheckFilter = DupCheckStatus | 'all';
export type AttachmentsFilter =
  | 'all'
  | 'has'
  | 'none'
  | 'unreviewed'
  | 'suspicious';
export type EvidenceFilter = keyof ClaimEvidenceChecklist | 'incomplete' | 'all';

export const DEFAULT_TICKET_FILTERS: TicketsFilters = {
  status: 'all',
  issueType: 'all',
  search: '',
  priority: 'all',
  marketplace: 'all',
  assignee: 'all',
  contactStatus: 'all',
  riskStatus: 'all',
  dupCheck: 'all',
  attachments: 'all',
  evidence: 'all',
};

export function normalizeTicketsFilters(
  filters: Partial<TicketsFilters>,
): TicketsFilters {
  return { ...DEFAULT_TICKET_FILTERS, ...filters };
}

export function isOpenTicket(ticket: Ticket): boolean {
  return ticket.status === 'pending' || ticket.status === 'escalated';
}

export function hasIncompleteEvidence(ticket: Ticket): boolean {
  return Object.values(ticket.evidence).some((value) => !value);
}

function matchesAttachments(ticket: Ticket, filter: AttachmentsFilter): boolean {
  const attachments = ticket.issueAttachments ?? [];
  if (filter === 'all') return true;
  if (filter === 'has') return attachments.length > 0;
  if (filter === 'none') return attachments.length === 0;
  if (filter === 'unreviewed')
    return attachments.some((attachment) => !attachment.reviewed);
  return attachments.some(
    (attachment) => attachment.suspicious || attachment.imageMismatch,
  );
}

function matchesEvidence(ticket: Ticket, filter: EvidenceFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'incomplete') return hasIncompleteEvidence(ticket);
  return !ticket.evidence[filter];
}

export function matchesTicketSearch(ticket: Ticket, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const searchable = [
    ticket.id,
    ticket.customer.id,
    ticket.customer.name,
    ticket.customer.phone,
    ticket.customer.email,
    ticket.order.id,
    ticket.order.sku,
    ticket.order.product,
    ticket.order.marketplace,
    ticket.status,
    ticket.issueType,
    ticket.requestType,
    ticket.priority,
    ticket.riskStatus,
    ticket.contactStatus,
    ticket.agent,
    ticket.tag,
    ticket.dupCheck.status,
    ticket.dupCheck.details,
    ticket.aiReport?.summary,
    ...(ticket.aiReport?.flags ?? []),
    ...(ticket.dupCheck.matchingOrderIds ?? []),
    ...(ticket.issueAttachments ?? []).flatMap((attachment) => [
      attachment.id,
      attachment.type,
      attachment.reason,
      attachment.suspicious ? 'suspicious attachment' : undefined,
      attachment.imageMismatch ? 'image mismatch' : undefined,
      attachment.reviewed ? 'reviewed attachment' : 'unreviewed attachment',
    ]),
  ];

  return searchable
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLowerCase().includes(q));
}

export function applyFieldFilters(
  tickets: Ticket[],
  filters: TicketsFilters,
): Ticket[] {
  const normalized = normalizeTicketsFilters(filters);
  return tickets.filter((ticket) => {
    if (normalized.status !== 'all' && ticket.status !== normalized.status)
      return false;
    if (
      normalized.issueType !== 'all' &&
      ticket.issueType !== normalized.issueType
    )
      return false;
    if (
      normalized.priority !== 'all' &&
      ticket.priority !== normalized.priority
    )
      return false;
    if (
      normalized.marketplace !== 'all' &&
      ticket.order.marketplace !== normalized.marketplace
    )
      return false;
    if (
      normalized.assignee === 'unassigned' &&
      ticket.agent?.trim()
    )
      return false;
    if (
      normalized.assignee !== 'all' &&
      normalized.assignee !== 'unassigned' &&
      ticket.agent !== normalized.assignee
    )
      return false;
    if (
      normalized.contactStatus !== 'all' &&
      ticket.contactStatus !== normalized.contactStatus
    )
      return false;
    if (
      normalized.riskStatus !== 'all' &&
      ticket.riskStatus !== normalized.riskStatus
    )
      return false;
    if (
      normalized.dupCheck !== 'all' &&
      ticket.dupCheck.status !== normalized.dupCheck
    )
      return false;
    if (!matchesAttachments(ticket, normalized.attachments)) return false;
    if (!matchesEvidence(ticket, normalized.evidence)) return false;
    if (!matchesTicketSearch(ticket, normalized.search)) return false;
    return true;
  });
}

export function applyVisibleTicketFilters(
  tickets: Ticket[],
  filters: TicketsFilters,
  activeView: string | null,
): Ticket[] {
  const fieldFiltered = applyFieldFilters(tickets, filters);
  const preset = getPresetView(activeView);
  if (!preset?.predicate) return fieldFiltered;
  return fieldFiltered.filter(preset.predicate);
}

export function hasActiveTicketFilters(
  filters: TicketsFilters,
  activeView: string | null,
): boolean {
  const normalized = normalizeTicketsFilters(filters);
  return (
    Boolean(activeView) ||
    Object.entries(DEFAULT_TICKET_FILTERS).some(
      ([key, value]) =>
        normalized[key as keyof TicketsFilters] !== value,
    )
  );
}

export function getSlaState(ticket: Ticket, now = Date.now()) {
  const hoursOpen = (now - ticket.createdAt) / (1000 * 60 * 60);
  const targetHours =
    ticket.priority === 'urgent'
      ? 4
      : ticket.priority === 'high'
        ? 12
        : ticket.priority === 'normal'
          ? 24
          : 48;
  const hoursRemaining = targetHours - hoursOpen;
  return {
    label:
      hoursRemaining <= 0
        ? `${Math.ceil(Math.abs(hoursRemaining))}h overdue`
        : `${Math.ceil(hoursRemaining)}h SLA`,
    tone:
      hoursRemaining <= 0
        ? 'danger'
        : hoursRemaining <= 2
          ? 'warning'
          : 'muted',
  } as const;
}
