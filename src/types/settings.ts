// Settings-specific types for the admin /settings panel.
// Mirrors the prototype's #a-settings region (promise-admin.html lines 2254-2308).
//
// NOTE: kept separate from src/types/domain.ts on purpose — settings is a
// configuration surface that does not bleed into the ticket / voucher domain.

export type ConnectionStatus = 'connected' | 'disconnected' | 'running';

/** WhatsApp — Meta Cloud API (direct integration, no BSP). */
export interface WhatsAppSettings {
  status: ConnectionStatus;
  /** Masked Phone Number ID — only the last 4 digits are ever shown. */
  phoneNumberIdMasked: string;
  /** Free-text fallback used when the AI is unsure. */
  fallbackMessage: string;
}

/** Shopify — evogirl.com Admin API integration + voucher rules. */
export interface ShopifySettings {
  status: ConnectionStatus;
  voucherAmount: number; // INR
  minimumCartValue: number; // INR
  voucherValidityDays: number;
  autoReleaseOnVerify: boolean;
}

/** Action to take after the review-scraper retry window expires. */
export type ScraperAfterAction =
  | 'flag-for-manual-review'
  | 'auto-reject'
  | 'send-customer-whatsapp';

/** Review scraper — platform-side review verification. */
export interface ReviewScraperSettings {
  status: ConnectionStatus;
  checkFrequency: string; // e.g. "Every 6 hours"
  visionConfidenceThreshold: number; // percentage 0-100
  maxRetryDays: number;
  afterAction: ScraperAfterAction;
}

export type LanguageCode = 'en' | 'hi' | 'ta' | 'kn' | 'te';

export interface LanguageRow {
  code: LanguageCode;
  label: string;
  enabled: boolean;
  /** English-locked: cannot be turned off (matches prototype behaviour). */
  locked?: boolean;
}

/** Top-level admin settings shape. */
export interface AdminSettings {
  whatsapp: WhatsAppSettings;
  shopify: ShopifySettings;
  scraper: ReviewScraperSettings;
  languages: LanguageRow[];
}

export const SCRAPER_AFTER_ACTION_LABELS: Record<ScraperAfterAction, string> = {
  'flag-for-manual-review': 'Flag for manual review',
  'auto-reject': 'Auto-reject',
  'send-customer-whatsapp': 'Send customer WhatsApp',
};
