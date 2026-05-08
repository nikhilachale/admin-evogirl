// Core domain types for the Promise admin console.
// Mirrors the data shapes from the original promise-admin.html prototype.

export type TicketStatus = 'pending' | 'resolved' | 'rejected' | 'replacement-issued';
export type TicketType = 'damage' | 'defect' | 'wrong-item' | 'fraud' | 'inquiry';
export type DupCheckStatus = 'ok' | 'bad' | 'unknown' | 'checking';
export type Marketplace = 'amazon' | 'flipkart' | 'meesho' | 'myntra' | 'direct';

// ── Real-domain ticket fields (added 2026-05-06) ─────────────────
// Kept additive on `Ticket` so existing components keep working.
// `type` above is the legacy/prototype categorization; `kind` + `issue`
// are how the support team actually thinks about a ticket.

export type TicketKind = 'return' | 'replacement' | 'review-check';
export type TicketIssue = 'damage' | 'color-change' | 'other';

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
  confidence?: number;   // 0–1
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
}

export interface TicketMessage {
  id: string;
  from: 'customer' | 'agent' | 'system';
  text: string;
  at: number;
  attachments?: { type: 'image' | 'video'; url: string }[];
}

export interface Ticket {
  id: string;
  customer: Customer;
  order: Order;
  status: TicketStatus;
  type: TicketType;
  // Real-domain categorization (additive — see TicketKind/TicketIssue above).
  // Optional during migration; required once all tickets are populated.
  kind?: TicketKind;
  issue?: TicketIssue;
  // Upstream AI analysis. Read-only from this app.
  aiReport?: AiReport;
  // Photos the customer uploaded when raising the issue (damage shots,
  // color mismatch, packaging defect). Display on the detail panel.
  issuePhotos?: string[];
  tag?: string;
  tagCls?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: number;
  resolvedAt?: number;
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
