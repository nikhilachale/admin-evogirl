---
name: wire-marketplace-integration
description: Use when the user wants to wire up a marketplace integration (Amazon, Flipkart, Meesho, Myntra) for order lookup or duplicate-claim checks. Walks through the SPA → backend contract, since marketplace credentials cannot live in the SPA bundle.
---

# Wire a marketplace integration

## Important — SPA constraint

This is a Vite SPA. **It cannot hold marketplace API credentials.** Any code that ships to the browser is public, including environment variables. So the integration architecture is:

```
Browser (this SPA)  →  Your backend  →  Marketplace API
                       (holds creds)
```

You need a separate backend service (Node/Express, Go, Python, whatever). This skill assumes the backend exists or will be built; the SPA's job is just to call it correctly.

## Step 1 — Confirm the backend contract

For a duplicate-claim check, your backend should expose:

```
POST {VITE_API_URL}/api/marketplaces/<marketplace>/check
Content-Type: application/json
Cookie: <auth>           ← cookie-based auth, since SPA includes credentials

Body:    { "orderId": "AMZ-IN-887462" }
Returns: { "status": "ok" | "bad", "details"?: string, "priorClaims": number }
```

This contract is already encoded in `src/lib/api/marketplaces.ts`. If your backend differs, update the function there to match.

## Step 2 — Configure the backend URL

In `.env.local` (gitignored — copy from `.env.example`):

```bash
VITE_API_URL=https://your-backend.example.com
```

For local development, point at `http://localhost:8080` (or wherever your backend runs).

The `VITE_` prefix is required — Vite only exposes env vars with that prefix to the browser.

## Step 3 — Verify the API client

Read `src/lib/api/client.ts`. Key behaviors:

- Base URL comes from `import.meta.env.VITE_API_URL`.
- `credentials: 'include'` — sends cookies for cross-origin auth. Your backend must set `Access-Control-Allow-Credentials: true` and an explicit `Access-Control-Allow-Origin` (not `*`).
- Errors throw `ApiError` with `status` and `body`.

If your backend uses bearer tokens instead of cookies, replace `credentials: 'include'` with an `Authorization` header reading from a token store.

## Step 4 — Wire into the tickets store

The store action `runDupCheck` in `src/store/tickets.ts` already calls `checkDuplicateClaim` from `src/lib/api/marketplaces.ts`. Currently it has a fallback — if the API call throws (no backend running), it pretends the call succeeded.

Once your backend is live, **remove the fallback**:

```ts
runDupCheck: async (id) => {
  const t = get().tickets.find((x) => x.id === id);
  if (!t) return;
  toast({ icon: '🔍', title: 'Re-running marketplace check…',
          description: `Polling ${t.order.marketplace} for ${t.order.id}.` });

  set((s) => ({ tickets: s.tickets.map((x) =>
    x.id === id ? { ...x, dupCheck: { ...x.dupCheck, status: 'checking' } } : x) }));

  try {
    const result = await checkDuplicateClaim(t.order.marketplace, t.order.id);
    set((s) => ({ tickets: s.tickets.map((x) =>
      x.id === id
        ? { ...x, dupCheck: { ...x.dupCheck, status: result.status,
            checked: 'just now', details: result.details } }
        : x) }));
    toast({ icon: '✓', title: 'Check complete',
            description: result.status === 'ok' ? 'No duplicate.' : result.details,
            tone: result.status === 'ok' ? 'success' : 'error' });
  } catch (err) {
    toast({ icon: '⚠', title: 'Check failed',
            description: err instanceof Error ? err.message : 'Unknown error',
            tone: 'error' });
  }
},
```

## Step 5 — Add new marketplace endpoints

To add another marketplace operation (e.g. fetch order details, issue refund), extend `src/lib/api/marketplaces.ts`:

```ts
interface RefundRequest { ticketId: string; amount: number; reason: string; }
interface RefundResult  { refundId: string; expectedSettlement: string; }

export async function issueMarketplaceRefund(
  marketplace: Marketplace,
  req: RefundRequest,
): Promise<RefundResult> {
  return apiFetch<RefundResult>(`/api/marketplaces/${marketplace}/refunds`, {
    method: 'POST',
    body: JSON.stringify(req),
  });
}
```

Then call it from the relevant store action. Surface failures via `toast({ tone: 'error' })`.

## Step 6 — Verify

1. Run the backend locally.
2. Set `VITE_API_URL` in `.env.local`.
3. Run `npm run dev`.
4. Click "Re-run" in a ticket detail. Check the network tab — the request should go to your backend, not directly to the marketplace.
5. Test the failure path — temporarily stop the backend and confirm the error toast appears.

## Hard rules

- **Never** put marketplace API keys in `.env`, `.env.local`, or anywhere in the SPA. They live on the backend.
- **Never** call marketplace APIs directly from the browser. The CORS, auth, and credential leak risks are all reasons not to.
- API client lives in `src/lib/api/`. Component code calls store methods, store methods call the API client.
- Use `apiFetch` from `@/lib/api/client` for all backend calls — it handles error normalization and credentials.
- If your backend rejects with a 401, redirect to login. Build that flow in `apiFetch` or in a wrapper hook.

## When this skill is overkill

If you don't have a real marketplace integration yet and just want to mock data, skip this skill — the existing fallback in `runDupCheck` does the trick. Use this skill once a real backend exists.
