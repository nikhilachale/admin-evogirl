import { apiFetch } from './client';
import type { Marketplace, Ticket } from '@/types/domain';

/**
 * Track down an order for a customer who has no order id.
 *
 * Real resolution needs marketplace credentials, which a static SPA cannot
 * hold (same boundary as `marketplaces.ts`). So the live path is a backend
 * proxy; callers fall back to {@link findOrderCandidatesInTickets} so the
 * offline demo still works.
 */

export interface OrderCandidate {
  orderId: string;
  marketplace: Marketplace;
  product: string;
  sku: string;
  amount: number;
  purchasedAt: number;
  deliveredAt?: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  /** 0–1 — how confident the match is. */
  matchScore: number;
}

export interface FindOrdersInput {
  phone?: string;
  name?: string;
  productUrl?: string;
}

/** Backend proxies marketplace lookups — creds stay server-side. */
export async function findOrdersByContact(
  input: FindOrdersInput,
): Promise<OrderCandidate[]> {
  return apiFetch<OrderCandidate[]>('/api/orders/lookup', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

const STOP_TOKENS = new Set([
  'the',
  'and',
  'for',
  'with',
  'evogirl',
  'www',
  'com',
  'http',
  'https',
  'dp',
  'product',
  'item',
  'p',
]);

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

function phoneMatches(query: string, candidate: string): boolean {
  const q = digitsOnly(query);
  const c = digitsOnly(candidate);
  if (q.length < 4 || c.length < 4) return false;
  // Compare the trailing significant digits so masked/formatted numbers
  // (e.g. "+91 98XXX-XX138") still line up on the part that is present.
  const tail = Math.min(q.length, c.length, 10);
  return q.slice(-tail) === c.slice(-tail);
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOP_TOKENS.has(t));
}

function productUrlMatchesProduct(url: string, product: string): boolean {
  const urlTokens = new Set(tokenize(url));
  if (urlTokens.size === 0) return false;
  const productTokens = tokenize(product);
  if (productTokens.length === 0) return false;
  const overlap = productTokens.filter((t) => urlTokens.has(t)).length;
  return overlap / productTokens.length >= 0.3;
}

/**
 * Offline/demo fallback. Pure search over the tickets already in memory by
 * normalized phone, case-insensitive name, and product-URL token overlap.
 * `matchScore` = matched signals / provided signals. Sorted desc, deduped
 * by orderId.
 */
export function findOrderCandidatesInTickets(
  input: FindOrdersInput,
  tickets: Ticket[],
): OrderCandidate[] {
  const phone = input.phone?.trim();
  const name = input.name?.trim().toLowerCase();
  const productUrl = input.productUrl?.trim();
  const provided = [phone, name, productUrl].filter(Boolean).length;
  if (provided === 0) return [];

  const byOrder = new Map<string, OrderCandidate>();

  for (const t of tickets) {
    let matched = 0;
    if (phone && phoneMatches(phone, t.customer.phone)) matched += 1;
    if (name && t.customer.name.toLowerCase().includes(name)) matched += 1;
    if (productUrl && productUrlMatchesProduct(productUrl, t.order.product))
      matched += 1;

    if (matched === 0) continue;

    const score = matched / provided;
    const existing = byOrder.get(t.order.id);
    if (existing && existing.matchScore >= score) continue;

    byOrder.set(t.order.id, {
      orderId: t.order.id,
      marketplace: t.order.marketplace,
      product: t.order.product,
      sku: t.order.sku,
      amount: t.order.amount,
      purchasedAt: t.order.purchasedAt,
      deliveredAt: t.order.deliveredAt,
      customerName: t.customer.name,
      customerPhone: t.customer.phone,
      customerEmail: t.customer.email,
      matchScore: score,
    });
  }

  return Array.from(byOrder.values()).sort(
    (a, b) => b.matchScore - a.matchScore,
  );
}
