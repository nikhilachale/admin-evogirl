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
import { formatRelative } from '@/lib/utils';

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

export function isSnoozeActive(ticket: Ticket, now = Date.now()): boolean {
  return (
    isOpenTicket(ticket) &&
    typeof ticket.snoozedUntil === 'number' &&
    ticket.snoozedUntil > now
  );
}

/** Snoozed open tickets sort after active open tickets (Zendesk-style). */
export function sortQueueTickets(tickets: Ticket[], now = Date.now()): Ticket[] {
  return [...tickets].sort((a, b) => {
    const sa = isSnoozeActive(a, now) ? 1 : 0;
    const sb = isSnoozeActive(b, now) ? 1 : 0;
    if (sa !== sb) return sa - sb;
    return b.createdAt - a.createdAt;
  });
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
    hoursRemaining,
    targetHours,
  } as const;
}

export type AgeBucket = 'fresh' | 'aging' | 'stale';

export function getAgeBucket(
  ticket: Ticket,
  now = Date.now(),
): { bucket: AgeBucket; label: string; hours: number } {
  const hours = (now - ticket.createdAt) / (1000 * 60 * 60);
  const label =
    hours < 1
      ? `${Math.max(1, Math.round(hours * 60))}m`
      : hours < 24
        ? `${Math.round(hours)}h`
        : `${Math.round(hours / 24)}d`;
  const bucket: AgeBucket = hours < 4 ? 'fresh' : hours < 24 ? 'aging' : 'stale';
  return { bucket, label, hours };
}

/**
 * Returns a 0–100 "review urgency" score from the signals already on the
 * ticket. Higher = more attention required.
 *
 * Inputs:
 *  - dupCheck status (bad / failed / unknown raises score)
 *  - AI report flags (fraud / duplicate / suspicious weighted higher)
 *  - riskStatus already set on the ticket
 *  - priority
 *  - missing issue photos for damage / color-change
 */
export function getRiskScore(ticket: Ticket): {
  score: number;
  level: 'low' | 'medium' | 'high';
  reasons: string[];
} {
  let score = 0;
  const reasons: string[] = [];

  if (ticket.dupCheck.status === 'bad') {
    score += 40;
    reasons.push('Marketplace duplicate risk');
  } else if (ticket.dupCheck.status === 'failed') {
    score += 25;
    reasons.push('Marketplace check failed');
  } else if (ticket.dupCheck.status === 'unknown') {
    score += 15;
    reasons.push('Marketplace check not run');
  }

  const flags = ticket.aiReport?.flags ?? [];
  if (flags.includes('fraud')) {
    score += 35;
    reasons.push('AI fraud flag');
  }
  if (flags.includes('duplicate')) {
    score += 20;
    reasons.push('AI duplicate flag');
  }
  if (flags.includes('suspicious')) {
    score += 15;
    reasons.push('AI suspicious flag');
  }
  if (flags.includes('photo-mismatch')) {
    score += 15;
    reasons.push('Photo mismatch flagged');
  }
  if (flags.includes('inconsistent-story')) {
    score += 10;
    reasons.push('Story inconsistent');
  }
  if (flags.includes('prior-claims')) {
    score += 10;
    reasons.push('Prior claims on record');
  }

  if (ticket.riskStatus === 'fraud') {
    score += 25;
    reasons.push('Marked fraud');
  } else if (ticket.riskStatus === 'duplicate') {
    score += 15;
    reasons.push('Marked duplicate');
  } else if (ticket.riskStatus === 'suspicious') {
    score += 10;
    reasons.push('Marked suspicious');
  }

  if (ticket.priority === 'urgent') {
    score += 10;
  } else if (ticket.priority === 'high') {
    score += 5;
  }

  if (
    (ticket.issueType === 'damage' || ticket.issueType === 'color-change') &&
    (ticket.issueAttachments?.length ?? 0) === 0
  ) {
    score += 10;
    reasons.push('No issue photos attached');
  }

  const pendingReviews =
    ticket.issueAttachments?.filter((attachment) => !attachment.reviewed)
      .length ?? 0;
  if (pendingReviews > 0) {
    score += Math.min(10, pendingReviews * 3);
    reasons.push(`${pendingReviews} attachment review${pendingReviews === 1 ? '' : 's'} pending`);
  }

  const clamped = Math.max(0, Math.min(100, score));
  const level: 'low' | 'medium' | 'high' =
    clamped >= 60 ? 'high' : clamped >= 30 ? 'medium' : 'low';
  return { score: clamped, level, reasons };
}

export type RecommendedAction =
  | 'approve-replacement'
  | 'run-dup-check'
  | 'review-photos'
  | 'review-risk'
  | 'reject'
  | 'none';

export function getRecommendation(ticket: Ticket): {
  action: RecommendedAction;
  label: string;
  tone: 'primary' | 'danger' | 'muted';
} {
  if (
    ticket.status === 'resolved' ||
    ticket.status === 'rejected' ||
    ticket.status === 'replacement-issued'
  ) {
    return { action: 'none', label: 'Ticket closed', tone: 'muted' };
  }
  if (ticket.status === 'escalated') {
    return {
      action: 'review-risk',
      label: 'Review escalation',
      tone: 'danger',
    };
  }
  if (isSnoozeActive(ticket)) {
    return {
      action: 'none',
      label: `Snoozed until ${formatRelative(ticket.snoozedUntil!)}`,
      tone: 'muted',
    };
  }
  if (ticket.dupCheck.status === 'bad' || ticket.riskStatus === 'fraud') {
    return {
      action: 'reject',
      label: 'Reject — duplicate risk',
      tone: 'danger',
    };
  }
  if (ticket.dupCheck.status === 'unknown') {
    return {
      action: 'run-dup-check',
      label: 'Run marketplace check',
      tone: 'primary',
    };
  }
  if (ticket.dupCheck.status === 'failed') {
    return {
      action: 'run-dup-check',
      label: 'Retry marketplace check',
      tone: 'danger',
    };
  }
  const flags = ticket.aiReport?.flags ?? [];
  if (flags.some((f) => ['fraud', 'duplicate', 'suspicious'].includes(f))) {
    return {
      action: 'review-risk',
      label: 'Review fraud signals',
      tone: 'danger',
    };
  }
  if (
    (ticket.issueType === 'damage' || ticket.issueType === 'color-change') &&
    (ticket.issueAttachments?.length ?? 0) === 0
  ) {
    return {
      action: 'review-photos',
      label: 'Request issue photos',
      tone: 'muted',
    };
  }
  if (ticket.requestType === 'replacement') {
    return {
      action: 'approve-replacement',
      label: 'Approve replacement',
      tone: 'primary',
    };
  }
  return {
    action: 'review-risk',
    label: 'Review evidence',
    tone: 'muted',
  };
}
