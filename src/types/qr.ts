// QR-card-specific types. Keeps `src/types/domain.ts` untouched
// (other agents are editing it concurrently). The existing `QrCard`
// type in domain.ts can be imported and reused; this file extends it
// with the prototype-specific structure for the generator panel.

import type { QrCard } from '@/types/domain';

export type QrProductCategory =
  | 'clips'
  | 'bands'
  | 'scrunchies'
  | 'headbands';

export interface QrProductPreset {
  /** SKU — also the product id printed on the card. */
  sku: string;
  /** Customer-facing display name. */
  name: string;
  /** Which dropdown bucket this preset shows up under. */
  category: QrProductCategory;
}

/**
 * The card configuration the generator panel collects.
 * Mirrors the prototype's `qrCategory`, `qrProduct`, `qrProductId`,
 * `qrBatch`, and "Quantity to Print" inputs.
 */
export interface QrCardConfig {
  category: QrProductCategory;
  productSku: string;
  productName: string;
  /** Free-text batch / print run label, e.g. `BATCH-2025-04`. */
  batch: string;
  /** Number of cards to print. */
  quantity: number;
}

/**
 * The two URLs encoded on a finished card. Side A is the reward link,
 * Side B is the help link — matches `generateQR()` in the prototype JS.
 */
export interface QrCardUrls {
  sideA: string;
  sideB: string;
}

/**
 * A generated card pair, captured for the in-memory history. Re-exports
 * the base `QrCard` type from `domain.ts` (so route code can keep importing
 * it from `@/types/qr`) and adds the side-aware fields the prototype
 * surfaces in the "Embedded QR Data" preview.
 */
export interface GeneratedQrCard extends Omit<QrCard, 'url'> {
  batch: string;
  category: QrProductCategory;
  urls: QrCardUrls;
  /** The reward-side URL — kept on the base type for compatibility. */
  url: string;
  /** Data URLs for the rendered QR images, both sides. */
  qrImages: { sideA: string; sideB: string };
}

export type { QrCard };
