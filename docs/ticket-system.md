# Ticket system — full guide

This is the **single reference** for how the warranty / claims ticket system works in `promise-admin`: admin queue, data model, actions, safeguards, snooze, persistence, customer status lookup, and what still belongs on the backend.

---

## 1. What the ticket system is for

evogirl support uses the **admin tickets** surface (`/admin/tickets`) to triage **quality promise** work: replacements, refunds, returns, review checks, and fraud-risk signals. Each row is one **ticket** bound to a **customer** and **order** (marketplace or direct).

The **customer** side (`/help`) lets end-users **look up status by ticket ID** and read FAQs. Raising a new claim from the SPA is still expected to be wired to your backend when you ship intake.

---

## 2. Source map (where code lives)

| Area | Location |
| --- | --- |
| Domain types (`Ticket`, messages, `dupCheck`, etc.) | `src/types/domain.ts` |
| Zustand store (all mutations, `hydrate`) | `src/store/tickets.ts` |
| Seed / demo data | `src/data/tickets.mock.ts` |
| Admin route (hydrate + persist subscribe) | `src/routes/admin/tickets.tsx` |
| Queue list, sorting, selection | `src/components/admin/tickets/tickets-list.tsx` |
| Filters + saved views UI | `src/components/admin/tickets/tickets-filters.tsx` |
| Preset views (predicates) | `src/components/admin/tickets/saved-views-config.ts` |
| Detail panel, evidence, timeline, actions | `src/components/admin/tickets/ticket-detail.tsx` |
| Snooze / follow-up card | `src/components/admin/tickets/snooze-card.tsx` |
| Approve / reject / escalate dialogs | `src/components/admin/tickets/ticket-action-dialogs.tsx` |
| Public reply + internal notes + macros | `src/components/admin/tickets/ticket-composer.tsx` |
| Filters, risk score, SLA, recommendations, **snooze sort** | `src/components/admin/tickets/ticket-filtering.ts` |
| Bulk bar | `src/components/admin/tickets/bulk-action-bar.tsx` |
| Keyboard shortcuts | `src/hooks/use-ticket-shortcuts.ts` |
| Dup check API (browser → your backend) | `src/lib/api/marketplaces.ts` |
| **Manual intake dialog** ("log a contact") | `src/components/admin/tickets/log-contact-dialog.tsx` |
| Order lookup (backend contract + offline mock) | `src/lib/api/order-lookup.ts` |
| Client id factories (manual tickets) | `src/lib/id-generators.ts` |
| **Browser ticket snapshot** (admin ↔ help on same device) | `src/lib/tickets-persist.ts` |
| **Auto-acknowledgement** copy + hydrate helper | `src/lib/claim-auto-ack.ts` |
| **Public status lookup** (safe fields for `/help`) | `src/lib/public-ticket-lookup.ts` |
| Customer status UI | `src/components/customer/ticket-status-lookup.tsx` |
| Help / FAQ / layout | `src/routes/customer/help.tsx`, `faq.tsx`, `layout.tsx` |

---

## 3. Core data model (`Ticket`)

| Field | Role |
| --- | --- |
| `id` | Ticket id (e.g. `TKT-2401`), used on `/help` lookup |
| `customer` | Name, phone, email, internal customer id |
| `order` | Marketplace order id, SKU, product title, amounts, dates |
| `status` | `pending` \| `escalated` \| `replacement-issued` \| `resolved` \| `rejected` |
| `requestType` | `return` \| `replacement` \| `review-check` \| `refund` |
| `issueType` | `damage` \| `color-change` \| `wrong-item` \| `defect` \| `other` |
| `riskStatus` | `normal` \| `suspicious` \| `fraud` \| `duplicate` |
| `contactStatus` | Customer comms state (see §10) |
| `evidence` | Six booleans — structured checklist before “clean” approval |
| `issueAttachments` | Proof media + per-file review flags |
| `dupCheck` | Marketplace duplicate-claim result (see §8) |
| `aiReport` | Read-only upstream AI summary/flags |
| `messages` | **Public** thread: `customer` \| `agent` \| `system` |
| `notes` | Internal agent notes + **system audit lines** (`from: system`) |
| `priority` | `low` \| `normal` \| `high` \| `urgent` |
| `agent` | Assignee label (string); bulk/reassign flows |
| `resolution` / `resolutionAmount` | Set when a ticket is closed on a specific path (replacement/refund/voucher/rejection) |
| **`snoozedUntil`** | Optional epoch ms; when in the **future** and ticket is **open**, queue treats it as snoozed (see §6) |
| **`channel`** | Optional intake channel — `phone` \| `email` \| `chat` \| `web-form` \| `marketplace` \| `other`. Set only by manual intake; legacy/seed tickets have none (see §21) |
| **`intake`** | Optional audit block (who logged it, raw contact, product link, lookup outcome). Set only by the "log a contact" flow |

---

## 4. Lifecycle and transitions

Rules live in `canTransition` in `src/store/tickets.ts`.

| Current `status` | Allowed actions |
| --- | --- |
| `pending` | approve, reject, escalate, resolve |
| `escalated` | approve, reject, resolve |
| `replacement-issued` | reopen only |
| `resolved` | reopen only |
| `rejected` | reopen only |

**Semantics**

- **`escalated`** is not a final outcome; it bumps priority and queue label.
- **`replacement-issued`**, **`resolved`**, **`rejected`** are terminal for normal queue actions until **reopen** (reason required).
- **Approve** (current product behaviour) moves to **`replacement-issued`** and sets replacement resolution path.
- **Snooze** is cleared automatically when the ticket becomes terminal or on **reopen** (see store).

---

## 5. Queue UX: filters, views, sort, search

- **Field filters**: status, issue type, search string, priority, marketplace, assignee, contact status, risk, dup check, attachments, evidence slice.
- **Saved views**: user-defined filter snapshots in localStorage (`evogirl.tickets.views`).
- **Preset views** (`saved-views-config.ts`): e.g. *All open*, **Snoozed**, *Pending review*, *Fraud flagged*, *Urgent SLA*, *Needs evidence*, *Attachments review*, *Resolved this week*, *Rejected*.
- **Search** matches id, customer, order, sku, statuses, dup text, AI summary, attachment meta, etc. (`matchesTicketSearch`).
- **Snooze sort**: among visible rows, **active** open tickets appear **above** open tickets that are **snoozed** (`snoozedUntil > now`). Same order drives **`j` / `k`** navigation.

---

## 6. Snooze / follow-up (solo-operator friendly)

**Purpose:** Park a ticket until a datetime so it sorts to the back of the open queue and the recommended action shows a muted “Snoozed until …” line.

**UI:** `SnoozeCard` on the detail panel (hidden for terminal tickets).

**Store:** `snoozeTicket(id, until)` / `clearSnooze(id)` — validates future time, skips terminal tickets, sets `contactStatus` to `follow-up-scheduled`, appends **system** audit notes.

**Clear snooze** when: user clears manually, or ticket is **approved**, **rejected**, **resolved**, **replacement/refund/voucher** issued, **bulk reject**, or **reopened**.

**Preset:** “Snoozed” shows open tickets with `snoozedUntil > Date.now()`.

---

## 7. Browser persistence and customer status

**Not production persistence** — this is for **demo continuity** and **same-browser** sync with `/help`.

- **Key:** `promise-admin:tickets-snapshot-v1` (`src/lib/tickets-persist.ts`).
- **When:** `TicketsPage` subscribes to the store and **debounced-writes** the full `tickets` array after hydrate whenever the list is non-empty.
- **Hydrate order:** if a snapshot exists and has tickets, admin **hydrates from snapshot**; otherwise from **`MOCK_TICKETS`**.

**`/help` “Track your claim”**

- Uses **`getTicketsForPublicLookup()`**: same snapshot if present, else mock data.
- Looks up by ticket id (normalizes with/without `TKT-` prefix).
- Returns **non-sensitive** fields only: status labels, contact summary, order id, product title, last activity time.
- Explains that **live multi-device** status needs your **backend API**.

---

## 8. Auto-acknowledgement (first public message)

On every **`hydrate`**, the store runs **`ensureClaimAcknowledgementMessages`** (`src/lib/claim-auto-ack.ts`):

- If the ticket does **not** already contain the stable message id **`msg-auto-claim-ack`**, an **`agent`** message is inserted **after the first customer message** (or at the start if there is none).
- Copy is the standard “we received your claim … typically within 2 business days …” text.

**Production:** Prefer emitting this from the **server** when a claim is created so email + in-app stay identical.

---

## 9. Decision actions and safeguards

### Approve

Maps to **replacement issued** today. The UI can require **extra confirmation** when `approvalWarnings` fire, including:

- Dup check not `ok`
- AI flags (`fraud` / `duplicate` / `suspicious`)
- Damage / color-change with **no** attachments
- Prior customer tickets rejected / fraud / duplicate risk
- Unreviewed attachments
- Customer history checklist not checked

### Reject

Requires **category** + **reason** + confirm. Categories include `duplicate-claim`, `invalid-order`, `outside-warranty-window`, `insufficient-proof`, `photo-mismatch`, `product-not-covered`, `suspected-fraud`, `other`.

### Escalate

Sets `escalated`, urgent priority, senior queue label, audit note.

### Flag fraud (single + bulk)

Confirmation + reason (bulk); updates risk, tags, dup severity, audit.

### Other resolutions

`resolve`, `issueReplacement`, `issueRefund`, `issueVoucher` set terminal **`resolved`** (or replacement-issued on approve path) and appropriate `resolution` / amounts where applicable.

---

## 10. Evidence checklist

Sidebar checkboxes map to `ClaimEvidenceChecklist`: order verified, delivery verified, photos reviewed, duplicate check passed, AI report reviewed, customer history reviewed. Each toggle writes a **system** audit line.

---

## 11. Attachment review

Each `issueAttachments[]` item: `reviewed`, optional `suspicious`, `reason`, `imageMismatch`. Updates append audit notes.

---

## 12. Duplicate check (marketplace)

`runDupCheck` calls **`checkDuplicateClaim`** → **`VITE_API_URL`** backend only (no marketplace keys in the SPA).

`dupCheck.status`: `ok` | `bad` | `unknown` | `checking` | `failed`. No silent “fake ok” on failure — failed/unknown should drive **manual** review and UI warnings on approve.

---

## 13. Timeline and audit

Unified timeline merges **`messages`** (public) and **`notes`** (internal + **system** events). Anything the store records as operational truth (approve, reject, snooze, dup check, fraud, reassignment, etc.) should continue to append **`from: system`** lines in production for parity.

---

## 14. Customer contact status

| `contactStatus` | Meaning |
| --- | --- |
| `customer-notified` | e.g. after a public agent reply |
| `awaiting-customer-reply` | Waiting on customer |
| `reply-received` | Customer messaged |
| `no-response` | No reply |
| `follow-up-scheduled` | Used when **snooze** is set |

---

## 15. Risk score and recommended next step

`getRiskScore` and `getRecommendation` in `ticket-filtering.ts` combine dup check, AI flags, risk status, priority, missing photos, pending attachment reviews. **Snoozed** open tickets return a muted recommendation (“Snoozed until …”) instead of pushing approve/dup-check until the snooze expires or is cleared.

---

## 16. Bulk actions

- **Bulk reject:** category + reason + confirm; skips terminal; audit per ticket.
- **Bulk fraud flag:** reason + confirm; skips terminal; audit per ticket.

---

## 17. Keyboard shortcuts

| Key | Action |
| --- | --- |
| `j` / `↓` | Next **visible** ticket (same order as list, including snooze sort) |
| `k` / `↑` | Previous visible ticket |
| `/` | Focus queue search |
| `a` | Approve selected (with confirm when risk heuristics say so) |
| `x` | Reject — prompt for reason + confirm |
| `Esc` | Blur focused field |

Disabled while focus is in `input`, `textarea`, or `select`.

---

## 18. Reply macros

Defined in `src/data/macros.mock.ts`. Insert from composer; supports variables `{customerName}`, `{ticketId}`, `{orderId}`, `{reason}`, `{nextStep}`.

---

## 19. Current limitations (read before shipping)

- **Security / authority:** All rules are **client-side**; a real API must enforce transitions, authz, and immutability.
- **Persistence:** Snapshot is **localStorage** for demos; production needs durable storage and optimistic concurrency (version fields).
- **Email/SMS triggers:** Auto-ack is **in-app only** here; wire real “we received your claim” to the backend.
- **Order lookup:** Manual intake order resolution (§21) is **mock/offline** until the backend `POST /api/orders/lookup` exists; the fallback only searches tickets already in the browser.
- **Multi-tab / multi-user:** Last writer wins on the same browser key; no merge for concurrent edits.
- **Lint:** Project ESLint may not parse TypeScript until parser config is fixed — run **`npm run typecheck`** for CI truth on types.

---

## 20. Backend checklist (production)

- Authenticate every admin mutation.
- Validate every state transition server-side.
- Append-only audit / timeline service (not only `notes` in a document).
- Idempotent approve/reject/refund/replace.
- Isolate marketplace credentials; persist dup-check results.
- Public **read-only** ticket status API for `/help` (auth or ticket token).
- Rate limits and abuse controls on status and claim endpoints.

---

## 21. Manual ticket creation ("log a contact")

Zendesk-style multi-channel intake for the **agent** side. When a customer
reaches support by **phone / email / chat / etc.** an agent opens the
**"Log contact"** dialog from the queue header
(`log-contact-dialog.tsx`, reusing the `ActionDialog`/`DialogFooter` shells)
and `useTicketsStore.createTicket(input)` prepends a new `pending` ticket.

- **Channel** (`Ticket.channel`) records *how the contact arrived* and is
  distinct from `order.marketplace` (*where the order was placed*). Both are
  shown as separate pills in the list and detail; both are filterable
  (the old "Channel" filter is now labelled **Marketplace**).
- **No order id?** The agent enters mobile + name + product link and
  *tracks down* the order via `findOrdersByContact()`. Real resolution is a
  backend job (marketplace creds stay server-side); offline it falls back to
  `findOrderCandidatesInTickets()` over tickets already in memory. If nothing
  matches, the agent can "log without a confirmed order" — the ticket gets a
  synthetic `UNRESOLVED-<ts>` order id and `intake.lookupStatus: 'unresolved'`
  surfaced in the detail header.
- **Where the issue text lands:** the description becomes the first
  `from: 'customer'` message; a `from: 'system'` audit note records the
  channel + who logged it; the standard auto-ack agent reply is injected
  immediately (idempotent — identical before and after re-hydrate).
- **`intake`** holds the audit trail (channel, `loggedBy`, raw contact,
  product link, lookup outcome, matched order id).

Persistence is automatic — the existing snapshot subscribe in
`routes/admin/tickets.tsx` saves the new ticket; `/help` status lookup picks
it up on the same browser.

---

*End of ticket system guide. Product or legal warranty language should live in a separate policy document maintained by your team.*
