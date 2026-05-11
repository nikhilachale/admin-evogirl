# Ticket System

This document explains the admin ticket system in `promise-admin`: the data model, lifecycle rules, review safeguards, and how agents should process claims.

## Source Files

| Area | File |
| --- | --- |
| Ticket domain types | `src/types/domain.ts` |
| Ticket state and actions | `src/store/tickets.ts` |
| Mock ticket data | `src/data/tickets.mock.ts` |
| Ticket route | `src/routes/admin/tickets.tsx` |
| Queue list | `src/components/admin/tickets/tickets-list.tsx` |
| Filters and saved views | `src/components/admin/tickets/tickets-filters.tsx`, `saved-views*.ts*` |
| Detail and decision workflow | `src/components/admin/tickets/ticket-detail.tsx` |
| Reply/note composer | `src/components/admin/tickets/ticket-composer.tsx` |
| Bulk actions | `src/components/admin/tickets/bulk-action-bar.tsx` |
| Keyboard shortcuts | `src/hooks/use-ticket-shortcuts.ts` |
| Marketplace API calls | `src/lib/api/marketplaces.ts` |

## Purpose

The ticket system is used by evogirl support agents to review warranty, replacement, refund, return, review-check, and fraud-risk claims.

It is currently implemented as an in-memory Zustand store using mock ticket data. The frontend is structured to be backend-ready, but real persistence and authorization still need to be enforced server-side.

## Core Ticket Model

Each ticket is represented by the `Ticket` type in `src/types/domain.ts`.

Important fields:

| Field | Purpose |
| --- | --- |
| `status` | Workflow state: `pending`, `escalated`, `replacement-issued`, `resolved`, or `rejected` |
| `requestType` | What the customer wants: `return`, `replacement`, `review-check`, or `refund` |
| `issueType` | What went wrong: `damage`, `color-change`, `wrong-item`, `defect`, or `other` |
| `riskStatus` | Risk classification: `normal`, `suspicious`, `fraud`, or `duplicate` |
| `contactStatus` | Customer communication state |
| `evidence` | Structured claim verification checklist |
| `issueAttachments` | Customer photos/videos plus review state |
| `dupCheck` | Marketplace duplicate-check result and match details |
| `aiReport` | Upstream AI risk report |
| `messages` | Public customer/agent conversation |
| `notes` | Internal notes and system audit events |
| `resolution` | Final outcome path, only when actually closed by refund, replacement, voucher, or rejection |

## Lifecycle Rules

Allowed transitions are centralized in `canTransition` inside `src/store/tickets.ts`.

Current workflow:

| From | Allowed actions |
| --- | --- |
| `pending` | approve, reject, escalate, resolve |
| `escalated` | approve, reject, resolve |
| `replacement-issued` | reopen only |
| `resolved` | reopen only |
| `rejected` | reopen only |

Important behavior:

- `escalated` is not a final resolution. It is a queue/state change.
- `replacement-issued`, `resolved`, and `rejected` are terminal for normal actions.
- Reopening requires a reason and moves the ticket back to `pending`.
- Escalation sets `status: escalated`, raises priority to urgent, assigns the senior support queue, and adds an audit event.

## Decision Actions

### Approve

Approval currently means approving a replacement and changes the ticket to `replacement-issued`.

The UI requires confirmation when approval warnings exist, including:

- Duplicate check is `bad`, `failed`, `unknown`, or `checking`
- AI flags include `fraud`, `duplicate`, or `suspicious`
- Damage/color-change claims have no issue attachments
- Customer has prior rejected, fraud, or duplicate-risk tickets
- Attachments still need review
- Customer history has not been reviewed

### Reject

Rejection requires:

- A structured category
- A free-text reason
- Confirmation before applying

Supported rejection categories:

| Category | Meaning |
| --- | --- |
| `duplicate-claim` | Claim duplicates an existing/prior claim |
| `invalid-order` | Order cannot be verified or is invalid |
| `outside-warranty-window` | Claim is outside policy window |
| `insufficient-proof` | Evidence is missing or inadequate |
| `photo-mismatch` | Uploaded proof does not match claim/order |
| `product-not-covered` | Product or issue is not covered |
| `suspected-fraud` | Fraud indicators are strong |
| `other` | Manual category fallback |

### Escalate

Escalation moves the ticket into the senior support queue:

- `status` becomes `escalated`
- `priority` becomes `urgent`
- `agent` becomes `Senior support queue`
- A system audit event is added

Escalation does not set `resolution`.

### Flag Fraud

Fraud flagging:

- Requires confirmation in the detail view
- Requires a reason for bulk fraud flagging
- Sets `riskStatus: fraud`
- Sets a visible `FRAUD FLAG`
- Marks duplicate check severity as high
- Adds a system audit event

## Evidence Checklist

Each ticket has a structured `evidence` object:

| Field | Meaning |
| --- | --- |
| `orderVerified` | Marketplace/order identity has been checked |
| `deliveryVerified` | Delivery state/date has been checked |
| `photosReviewed` | Uploaded proof has been reviewed |
| `duplicateCheckPassed` | Duplicate marketplace check returned clean |
| `aiReportReviewed` | Agent reviewed AI report |
| `customerHistoryReviewed` | Agent reviewed prior claims for customer |

The checklist appears in the ticket detail sidebar. Changing a checklist item creates a system audit event.

## Attachment Review

Customer proof is stored in `issueAttachments`.

Each attachment tracks:

| Field | Meaning |
| --- | --- |
| `reviewed` | Agent has reviewed the file |
| `suspicious` | Agent marked the file suspicious |
| `reason` | Review comment or suspicious reason |
| `imageMismatch` | File appears inconsistent with order/story |

Attachment updates add system events to the audit timeline.

## Duplicate Check

Duplicate checks are performed through `checkDuplicateClaim` in `src/lib/api/marketplaces.ts`.

The browser never calls marketplace APIs directly. It calls the backend, and the backend should call Amazon/Flipkart/Meesho/Myntra/etc.

`dupCheck` stores:

| Field | Meaning |
| --- | --- |
| `status` | `ok`, `bad`, `unknown`, `checking`, or `failed` |
| `priorClaims` | Number of prior related claims |
| `matchingOrderIds` | Related order IDs found |
| `matchSignals` | Match counts by phone/email/address/SKU |
| `confidence` | Backend confidence score from 0 to 1 |
| `severity` | `low`, `medium`, or `high` |
| `details` | Human-readable backend explanation |

There is no mock success fallback. If the API fails, the ticket becomes `dupCheck.status: failed`, and approval should require manual confirmation.

## Audit Timeline

The detail screen shows a unified timeline built from:

- Public customer/agent messages
- Internal notes
- System events

System events are appended to `notes` with `from: system`.

Actions that create audit events:

- Approval
- Rejection
- Escalation
- Reopen
- Resolve
- Duplicate check start/pass/fail
- Fraud flag
- Public reply sent
- Internal note added
- Reassignment
- Attachment review update
- Evidence checklist update

## Customer Contact Status

Tickets track `contactStatus`:

| Status | Meaning |
| --- | --- |
| `customer-notified` | Agent/system has notified customer |
| `awaiting-customer-reply` | Team needs customer input |
| `reply-received` | Customer replied |
| `no-response` | Customer did not respond |
| `follow-up-scheduled` | Follow-up is planned |

Sending a public reply currently sets `contactStatus: customer-notified`.

## Bulk Actions

Bulk actions are intentionally guarded.

Bulk reject:

- Requires category
- Requires free-text reason
- Shows confirmation with selected ticket list
- Skips terminal tickets
- Adds audit events to affected tickets

Bulk fraud flag:

- Requires reason
- Shows confirmation with selected ticket list
- Skips terminal tickets
- Adds audit events to affected tickets

## Keyboard Shortcuts

The ticket queue supports:

| Shortcut | Action |
| --- | --- |
| `j` or ArrowDown | Next visible ticket |
| `k` or ArrowUp | Previous visible ticket |
| `/` | Focus search |
| `a` | Approve selected ticket, with safeguard confirmation when needed |
| `x` | Reject selected ticket, with reason prompt and confirmation |
| `Esc` | Blur active input |

Shortcuts are disabled while typing in inputs, textareas, or selects.

## Macros

Reply macros live in `src/data/macros.mock.ts`.

Supported variables:

| Variable | Replaced with |
| --- | --- |
| `{customerName}` | Ticket customer name |
| `{ticketId}` | Ticket ID |
| `{orderId}` | Marketplace order ID |
| `{reason}` | Duplicate-check details, AI summary, or manual-review fallback |
| `{nextStep}` | A next-step phrase based on verification state |

Selecting a macro applies variables before inserting text into the composer.

## Current Limitations

- Ticket changes are in-memory only and reset when mock data is rehydrated.
- Real approval/rejection/fulfillment must be persisted through a backend.
- Browser-side checks are workflow safeguards, not security controls.
- Marketplace duplicate checks require `VITE_API_URL` pointing to a backend.
- The unified timeline stores system events in `notes`; a backend should eventually model timeline events as a dedicated entity.
- The ESLint config currently lacks a TypeScript parser, so linting fails before meaningful TS/TSX lint checks run.

## Backend Requirements

Before production use, the backend should enforce:

- Authentication and authorization for all admin actions
- Server-side lifecycle transition validation
- Immutable audit log entries
- Idempotency keys for destructive actions
- Marketplace credential isolation
- Duplicate-check result persistence
- Attachment review persistence
- Reopen and rejection reason persistence
- Concurrency/version checks so two agents cannot overwrite each other silently

