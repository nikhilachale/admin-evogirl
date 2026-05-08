---
name: add-ticket-action
description: Use when the user wants to add a new lifecycle action to tickets (e.g. "snooze ticket for 24h", "request more photos"). Updates the store, the detail panel, and optionally the keyboard shortcuts.
---

# Add a ticket action

A ticket action is anything an agent can do to change a ticket's state or notify a customer. Each action lives in three places.

## Steps

### 1. Add the method to the tickets store

In `src/store/tickets.ts`, add the method to the `TicketsState` interface and implement it:

```ts
// Interface
<actionName>: (id: string, ...args) => void;

// Implementation
<actionName>: (id, ...args) => {
  set((s) => ({
    tickets: s.tickets.map((t) =>
      t.id === id ? { ...t, /* mutations */ } : t,
    ),
  }));
  toast({
    icon: '<emoji>',
    title: '<Past-tense title>',
    description: `${id} — <human description>.`,
    tone: 'success' | 'error' | 'default',
  });
},
```

**Patterns to follow:**
- Toast copy uses past tense ("Claim approved", "Voucher issued") because the action just happened.
- Always include the ticket ID in the toast description.
- If the action resolves the ticket, set `status` and `resolvedAt`.
- If the action shouldn't be reversible, that's enforced in the UI, not the store — the store stays simple.

### 2. Wire a button in the detail panel

In `src/components/admin/tickets/ticket-detail.tsx`, add the action to the action bar at the bottom:

```tsx
import { <Icon> } from 'lucide-react';

<Button variant="<variant>" onClick={() => <actionName>(ticket.id)}>
  <<Icon> size={16} className="mr-2" />
  <Label>
</Button>
```

Variant guidance:
- `default` (gold) → primary positive action (approve, ship)
- `destructive` → reject, refund, anything that closes the ticket negatively
- `outline` → secondary actions (re-run check, flag fraud)
- `ghost` → tertiary (escalate, reassign)

If the action shouldn't be available after the ticket is resolved, gate it on the existing `resolved` boolean.

### 3. Add a keyboard shortcut (optional)

If the action is high-frequency, add it to `src/hooks/use-ticket-shortcuts.ts`. Existing bindings:

| Key | Action |
| --- | --- |
| j / ↓ | next |
| k / ↑ | previous |
| / | focus search |
| a | approve |
| x | reject |
| Esc | blur input |

Keep the shortcut a single character. Update the `<TicketsFilters>` placeholder text if you want it documented in the UI.

### 4. Verify

```bash
npm run typecheck && npm run lint
```

Click through the action in `npm run dev`. Confirm:
- The ticket state changes correctly
- The toast appears with the right copy
- The action is hidden / disabled when it shouldn't apply

## Hard rules

- Don't bypass the store. Every state change goes through a method.
- Don't `console.log` instead of toasting — agents need feedback.
- Don't add UI-only actions ("collapse details") to the tickets store. Local UI state stays in `useState`.
- If the action calls an external system (refund, courier label), the store method should be `async` — call `apiFetch` from `@/lib/api/client` and show a loading state.

## When this skill is overkill

If the "action" is purely visual (open a popover, expand a section), use local component state instead.
