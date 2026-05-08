import { apiFetch } from './client';
import type { Marketplace } from '@/types/domain';

interface DupCheckResult {
  status: 'ok' | 'bad';
  details?: string;
  priorClaims: number;
}

/**
 * Check for duplicate claims on an order. Server proxies this to the
 * appropriate marketplace API. Marketplace credentials live on the
 * server, never in the SPA bundle.
 */
export async function checkDuplicateClaim(
  marketplace: Marketplace,
  orderId: string,
): Promise<DupCheckResult> {
  return apiFetch<DupCheckResult>(`/api/marketplaces/${marketplace}/check`, {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  });
}

/**
 * Fetch the full order detail from the marketplace.
 */
export async function fetchOrder(
  marketplace: Marketplace,
  orderId: string,
): Promise<unknown> {
  return apiFetch(`/api/marketplaces/${marketplace}/orders/${orderId}`);
}
