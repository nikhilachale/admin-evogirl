/**
 * Analytics-specific types.
 *
 * These types intentionally live outside `domain.ts` to avoid colliding with
 * concurrent edits to the shared domain. If any of these become reusable
 * across surfaces, promote them later.
 */

export type AnalyticsRange = '7' | '30' | '90' | 'ytd';

export interface AnalyticsRangeOption {
  key: AnalyticsRange;
  label: string;
}

export type ChangeDirection = 'up' | 'down';

export interface AnalyticsStat {
  /** Token from the brand palette used to color the value. */
  accent: 'gold' | 'pink' | 'emerald' | 'purple-light';
  value: string;
  label: string;
  /** e.g. "↑ 18% vs last month" — copy lifted verbatim from the prototype. */
  change: string;
  direction: ChangeDirection;
}

export interface DailyRegistration {
  day: string;
  value: number;
  /** Highlight bars (Thu/Fri in the prototype) get the bright gold tone. */
  highlight?: boolean;
}

export interface FunnelStep {
  label: string;
  /** Raw count e.g. 1247 or 834. */
  value: number;
  /** Display string for the value column (often appends "(67%)"). */
  display: string;
  /** Width of the bar as a 0–100 percentage. */
  widthPct: number;
  accent: 'purple' | 'pink' | 'emerald' | 'gold';
}

export interface PlatformShare {
  emoji: string;
  name: string;
  pct: number;
  /** Hex literal — Recharts/SVG needs a literal color, not an HSL var. */
  color: string;
}

export interface LanguageShare {
  language: string;
  pct: number;
}

export type ProductHue = 'g' | 'pk' | 'pl';

export interface ProductPerformanceRow {
  emoji: string;
  name: string;
  warranties: number;
  reviews: number;
  rating: number;
  returns: number;
  voucher: number;
  hue: ProductHue;
}

export type ProductSortKey =
  | 'reviews'
  | 'returns'
  | 'returnRate'
  | 'rating'
  | 'warranties';

export interface ProductCallout {
  emoji: string;
  name: string;
  meta: string;
  tone: 'top' | 'attention';
  badge: string;
}

export interface ReturnReasonSegment {
  label: string;
  pct: number;
  color: string;
}

export interface ProductReturnReasons {
  emoji: string;
  name: string;
  claims: number;
  segments: ReturnReasonSegment[];
}

export interface SentimentBucket {
  label: string;
  pct: number;
  color: string;
}

export interface ReviewPhrase {
  text: string;
  count: number;
  tone: 'positive' | 'negative';
}

export interface ReviewSentiment {
  averageRating: number;
  totalReviews: number;
  buckets: SentimentBucket[];
  phrases: ReviewPhrase[];
}
