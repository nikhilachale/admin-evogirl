---
name: port-prototype-feature
description: Use when the user wants to port a specific feature from the original promise-admin.html prototype into the Vite + React codebase. Walks through extracting the data shape, the actions, and the UI faithfully.
---

# Port a feature from the prototype

The original prototype is a single 6,300-line HTML file. It is the source of truth for visual design and interaction patterns — but it cannot just be copy-pasted, because:

- It uses global JS variables (`TICKETS`, `VOUCHERS`) instead of typed stores.
- It uses inline `onclick="..."` handlers instead of React handlers.
- It uses raw CSS classes instead of Tailwind utilities.
- It targets a static phone-frame demo rather than a real React app.

This skill keeps the port faithful where it matters (data, copy, behavior) and modern where it should be (types, React, Tailwind).

## Step 1 — Locate the source

Find the prototype's relevant region. Quick map:

| Feature | Panel ID | JS variable |
| --- | --- | --- |
| Tickets | `a-tickets` | `TICKETS` |
| Vouchers | `a-vouchers` | `VOUCHERS` (look for it) |
| Care Guide | `a-care` | `CARE_GUIDE` (look for it) |
| QR Generator | `a-qr` | uses `QRCode.toDataURL` |
| Analytics | `a-analytics` | static markup mostly |
| Settings | `a-settings` | static markup mostly |

```bash
grep -n 'a-<panel>' promise-admin.html        # find the HTML region
grep -n 'function tk\|function vc\|function cg' promise-admin.html  # find handlers
```

Read the full region — both the HTML and the JS handlers it references.

## Step 2 — Extract the data shape

Find the variable that backs the panel (e.g. `let TICKETS = [ … ]`). Read 2–3 entries to understand the field set, then translate to TypeScript in `src/types/domain.ts`. Example translation:

```js
// Prototype (loose JS)
{ id:'TKT-2401', cust:{name:'Anika',phone:'+91 …'}, type:'damage',
  status:'pending', dupCheck:{status:'ok',checked:'12 mins ago'} }
```

becomes:

```ts
// Typed
interface Ticket {
  id: string;
  customer: Customer;       // sub-type, expand cust → customer
  type: TicketType;         // union type
  status: TicketStatus;
  dupCheck: DupCheck;
}
```

Rename loose abbreviations (`cust` → `customer`, `qty` → `quantity`) — the readability tax is worth paying once.

## Step 3 — Extract the actions

Find the handlers. They follow the prototype's naming conventions (`tkApprove`, `tkReject`, `tkIssueVoucher`, etc.). For each, note:

1. What state it mutates.
2. What toast it shows (the copy is usually keepable).
3. Any side effects (timer, animation, API call mock).

Translate each into a method on the Zustand store (`src/store/<feature>.ts`). The toast copy in the prototype is often the right copy for production — reuse it.

## Step 4 — Translate the UI semantically

Don't copy raw HTML. Translate by intent:

| Prototype | Port to |
| --- | --- |
| `<button class="aside-btn active">` | `<NavLink>` with active state in sidebar |
| `<span class="tx-tag-fraud">` | `<Badge variant="fraud">` |
| `<div class="tx-card">` | `<Card>` |
| `:root { --p: #3D2466 }` | already mapped to `brand.purple` and semantic tokens — use those |
| `onclick="tkApprove('TKT-2401')"` | `onClick={() => approve('TKT-2401')}` |
| Custom keyframes | Tailwind animation in `tailwind.config.ts` |
| qrcodejs CDN | `qrcode` npm package |
| Inline `<style>` | Tailwind utilities |

## Step 5 — Replace data references

The prototype renders directly off its global. Your port should:

1. Stub mock data in `src/data/<feature>.mock.ts` (faithful to the prototype's example data).
2. Hydrate the store from the mock in a `useEffect` in the route component.
3. Leave a TODO at the hydration site noting where the real fetch (via `apiFetch` from `@/lib/api/client`) will go.

## Step 6 — Preserve the small things

The prototype has details that are easy to miss but matter:

- Keyboard shortcuts (j/k/a/x/Esc/`/`) — already wired for tickets via `useTicketShortcuts`. If the panel you're porting has shortcuts, add a similar hook.
- Toast timing (the prototype removes toasts after ~3.2s, the port uses 3.5s — close enough).
- "just now" / "12 mins ago" relative times — `formatRelative` in `src/lib/utils.ts` handles this.
- Currency formatting — `formatINR` from the same file.

## Step 7 — Verify

```bash
npm run typecheck && npm run lint
```

Then click through the ported panel in the dev server. Check against the prototype side-by-side for parity.

## Hard rules

- Never use `dangerouslySetInnerHTML` to shortcut the port.
- Never copy `<style>` blocks or `:root` declarations into a CSS file. Theme tokens live in `globals.css` and Tailwind config — extend those.
- Never preserve global JS variables. Their state belongs in a store.
- Do preserve the toast copy and microcopy. The prototype's wording is intentional.

## When you finish

Document what you ported:
- Prototype line range used.
- Types added or extended in `domain.ts`.
- Store methods created.
- Components created.
- Anything intentionally skipped (and why — usually because it was a demo-only flourish).
