// Core domain types for the Promise admin console.
// Mirrors the data shapes from the original promise-admin.html prototype.

export type TicketStatus =
  | 'pending'
  | 'resolved'
  | 'rejected'
  | 'replacement-issued'
  | 'escalated';
export type DupCheckStatus = 'ok' | 'bad' | 'unknown' | 'checking' | 'failed';
export type Marketplace =
  | 'amazon'
  | 'flipkart'
  | 'meesho'
  | 'myntra'
  | 'direct';

// Records WHICH resolution path closed a ticket. Set by the store actions
// (issueReplacement / issueRefund / issueVoucher / reject / approve) so
// analytics and the UI can distinguish "Refunded ₹2,499" from "Replaced".
export type TicketResolution =
  | 'replacement'
  | 'refund'
  | 'voucher'
  | 'rejection';

export type TicketRequestType =
  | 'return'
  | 'replacement'
  | 'review-check'
  | 'refund';
export type TicketIssueType =
  | 'damage'
  | 'color-change'
  | 'wrong-item'
  | 'defect'
  | 'other';
export type TicketRiskStatus = 'normal' | 'suspicious' | 'fraud' | 'duplicate';
export type CustomerContactStatus =
  | 'customer-notified'
  | 'awaiting-customer-reply'
  | 'reply-received'
  | 'no-response'
  | 'follow-up-scheduled';
export type TicketAction =
  | 'approve'
  | 'reject'
  | 'escalate'
  | 'resolve'
  | 'reopen';
export type RejectionReasonCategory =
  | 'duplicate-claim'
  | 'invalid-order'
  | 'outside-warranty-window'
  | 'insufficient-proof'
  | 'photo-mismatch'
  | 'product-not-covered'
  | 'suspected-fraud'
  | 'other';

export type AiReportFlag =
  | 'suspicious'
  | 'fraud'
  | 'duplicate'
  | 'photo-mismatch'
  | 'inconsistent-story'
  | 'prior-claims';

// AI analysis is generated upstream (customer-side service) and only
// consumed here. Don't mutate it from the admin app.
export interface AiReport {
  flags: AiReportFlag[];
  summary?: string;
  confidence?: number; // 0–1
  generatedAt: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
}

export interface Order {
  id: string;
  marketplace: Marketplace;
  product: string;
  sku: string;
  amount: number;
  purchasedAt: number;
  deliveredAt?: number;
}

export interface DupCheck {
  status: DupCheckStatus;
  checked: string;
  details?: string;
  priorClaims?: number;
  matchingOrderIds?: string[];
  matchSignals?: {
    phone?: number;
    email?: number;
    address?: number;
    sku?: number;
  };
  confidence?: number;
  severity?: 'low' | 'medium' | 'high';
}

export interface TicketMessage {
  id: string;
  from: 'customer' | 'agent' | 'system';
  text: string;
  at: number;
  attachments?: { type: 'image' | 'video'; url: string }[];
}

export interface TicketAttachmentReview {
  id: string;
  type: 'image' | 'video';
  url: string;
  reviewed: boolean;
  suspicious?: boolean;
  reason?: string;
  imageMismatch?: boolean;
}

export type TicketAttachmentReviewPatch = Partial<TicketAttachmentReview>;

export interface ClaimEvidenceChecklist {
  orderVerified: boolean;
  deliveryVerified: boolean;
  photosReviewed: boolean;
  duplicateCheckPassed: boolean;
  aiReportReviewed: boolean;
  customerHistoryReviewed: boolean;
}

export interface Ticket {
  id: string;
  customer: Customer;
  order: Order;
  status: TicketStatus;
  requestType: TicketRequestType;
  issueType: TicketIssueType;
  riskStatus: TicketRiskStatus;
  contactStatus: CustomerContactStatus;
  evidence: ClaimEvidenceChecklist;
  // Upstream AI analysis. Read-only from this app.
  aiReport?: AiReport;
  // Photos the customer uploaded when raising the issue (damage shots,
  // color mismatch, packaging defect). Display on the detail panel.
  issueAttachments?: TicketAttachmentReview[];
  tag?: string;
  tagCls?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: number;
  resolvedAt?: number;
  // Which resolution path closed this ticket (set when status moves out of
  // `pending`). Optional because in-flight tickets haven't been resolved yet.
  resolution?: TicketResolution;
  // Monetary amount tied to the resolution (refund / voucher). Useful on
  // the resolution chip so agents can see "Refunded ₹2,499" at a glance.
  resolutionAmount?: number;
  dupCheck: DupCheck;
  // Conversation may be empty — some tickets are auto-created with no
  // customer messages (form submission, fraud flag, etc.).
  messages: TicketMessage[];
  notes: TicketMessage[];
  agent?: string;
}

// ── Vouchers ─────────────────────────────────────────────────

export type VoucherStatus =
  | 'pending'
  | 'redeemed'
  | 'expired'
  | 'review-pending'
  | 'revoked';

export interface VoucherOrderRef {
  id: string;
  marketplace: Marketplace;
}

export interface Voucher {
  id: string;
  code: string;
  amount: number;
  status: VoucherStatus;
  issuedAt: number;
  redeemedAt?: number;
  expiresAt: number;
  customerName: string;
  customerPhone: string;
  order: VoucherOrderRef;
  ticketId?: string;
  customerId?: string;
}

// ── Care guides ─────────────────────────────────────────────

export interface CareGuideStep {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
}

export interface CareGuide {
  id: string;
  productCategory: string;
  title: string;
  steps: CareGuideStep[];
  updatedAt: number;
  publishedAt?: number;
}

// ── QR cards ─────────────────────────────────────────────────

export interface QrCard {
  id: string;
  productSku: string;
  productName: string;
  serial: string;
  url: string;
  generatedAt: number;
  printedAt?: number;
}
