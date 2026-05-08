---
name: add-admin-panel
description: Use when the user wants to add a new admin panel under /admin/. Walks through the route component, route table entry, sidebar entry, types, store, and mock data.
---

# Add an admin panel

A new admin panel touches **six** places. Skipping any leaves the panel broken or invisible.

## Steps

### 1. Add the route component

Create `src/routes/admin/<feature>.tsx`. Use a **named export**, not default. Pick the layout shape based on the panel's job:

- **List + detail** (tickets, vouchers) → two-column grid: `grid-cols-[360px_1fr]`.
- **Single resource** (settings, editor) → single column with `<Card>` sections.
- **Dashboard** (analytics) → grid of stat cards plus charts.

```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function <Feature>Page() {
  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold"><Title></h1>
        <p className="text-muted-foreground"><Subtitle></p>
      </header>
      {/* content */}
    </div>
  );
}
```

### 2. Register in the route table

In `src/routes/index.tsx`, import the page and add it to the `/admin` children array:

```ts
import { <Feature>Page } from '@/routes/admin/<feature>';

// inside the /admin route's children:
{ path: '<feature>', element: <<Feature>Page /> },
```

### 3. Register in the sidebar

In `src/components/admin/sidebar.tsx`, add to the `NAV` array. Pick a Lucide icon:

```ts
import { <Icon> } from 'lucide-react';

const NAV = [
  // …existing entries
  { to: '/admin/<feature>', label: '<Label>', icon: <Icon> },
] as const;
```

### 4. Add domain types

In `src/types/domain.ts`, add or extend the types. Mirror the field names from the prototype if porting one — keeps the mental model consistent.

### 5. Create mock data

`src/data/<feature>.mock.ts`. Three or four realistic entries are enough. Keep timestamps relative (`Date.now() - 1000 * 60 * 60 * 24`) so they always feel fresh.

### 6. Build the store

`src/store/<feature>.ts`. Pattern:

```ts
import { create } from 'zustand';
import type { <Entity> } from '@/types/domain';
import { toast } from './toast';

interface <Feature>State {
  items: <Entity>[];
  selectedId: string | null;
  select: (id: string | null) => void;
  hydrate: (items: <Entity>[]) => void;
  // domain actions — each toasts the result
}

export const use<Feature>Store = create<<Feature>State>((set) => ({
  items: [],
  selectedId: null,
  select: (id) => set({ selectedId: id }),
  hydrate: (items) => set({ items, selectedId: items[0]?.id ?? null }),
}));
```

### 7. Build the components

`src/components/admin/<feature>/`. Compose pages out of these — never inline complex JSX in the page file.

Common shapes:
- `<feature>-list.tsx` — queue/list view
- `<feature>-detail.tsx` — inspector pane
- `<feature>-filters.tsx` — search and filters
- `<feature>-form.tsx` — create/edit (uses Dialog)

### 8. Verify

```bash
npm run typecheck && npm run lint
```

Visit `http://localhost:5173/admin/<feature>` to confirm.

## Hard rules

- Use **named exports** for route components, not default exports.
- Stores live in `src/store/`. Never instantiate Zustand inline.
- Use semantic tokens (`bg-primary`, `text-muted-foreground`) — not raw color classes.
- Icons come from `lucide-react`.
- Toasts go through `toast({...})` from `@/store/toast`.

## When this skill is overkill

If you're just adding a single component to an existing panel, use `add-shadcn-primitive` or just edit the existing files directly.
