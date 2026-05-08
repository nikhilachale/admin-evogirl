---
name: add-shadcn-primitive
description: Use when the user needs a UI primitive (Dialog, Select, Tabs, Tooltip, etc.) that doesn't exist yet in src/components/ui/. Walks through adding it shadcn-style with Radix + cva + cn.
---

# Add a shadcn-style primitive

The `src/components/ui/` folder already includes Button, Card, Badge, Input, and Toaster. Add new primitives the same way.

## Steps

### 1. Confirm the primitive isn't there

Glob `src/components/ui/*.tsx`. If a near-match exists, extend it instead of duplicating.

### 2. Verify the Radix dependency

Most shadcn primitives wrap a Radix primitive. Common ones already in `package.json`:

- `@radix-ui/react-dialog` → Dialog, AlertDialog, Sheet
- `@radix-ui/react-dropdown-menu` → DropdownMenu, ContextMenu
- `@radix-ui/react-popover` → Popover, HoverCard
- `@radix-ui/react-select` → Select
- `@radix-ui/react-tabs` → Tabs
- `@radix-ui/react-tooltip` → Tooltip
- `@radix-ui/react-slot` → asChild prop on Button
- `@radix-ui/react-label` → Label

If you need a primitive that requires a Radix package not yet installed, add it to `dependencies` in `package.json` first. Don't reinvent the headless behavior — Radix handles focus management, escape behavior, ARIA correctly.

### 3. Build the file

Path: `src/components/ui/<name>.tsx` (lowercase). Pattern:

```tsx
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import * as <Radix>Primitive from '@radix-ui/react-<name>';
import { cn } from '@/lib/utils';

const <Name> = <Radix>Primitive.Root;
const <Name>Trigger = <Radix>Primitive.Trigger;

const <Name>Content = forwardRef<
  ElementRef<typeof <Radix>Primitive.Content>,
  ComponentPropsWithoutRef<typeof <Radix>Primitive.Content>
>(({ className, ...props }, ref) => (
  <<Radix>Primitive.Content
    ref={ref}
    className={cn('<Tailwind classes using semantic tokens>', className)}
    {...props}
  />
));
<Name>Content.displayName = <Radix>Primitive.Content.displayName;

export { <Name>, <Name>Trigger, <Name>Content };
```

### 4. Style with semantic tokens

Use `bg-popover`, `text-popover-foreground`, `border-border`, etc. — never hardcoded colors. The primitive must work in both the admin (dark) and customer (light) themes without modification.

### 5. Add animation classes

Most overlays use `tailwindcss-animate` classes. Common patterns:

```
data-[state=open]:animate-in data-[state=closed]:animate-out
data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2
```

These come from `tailwindcss-animate`, already in the Tailwind config.

### 6. Reference the shadcn registry

If unsure about the exact JSX shape, reference the shadcn/ui docs at https://ui.shadcn.com/docs/components/<name>. Adapt the code to use this project's `cn` import path (`@/lib/utils`) and our component file naming.

### 7. Verify

```bash
npm run typecheck && npm run lint
```

Render the primitive in a route to confirm both themes look right.

## Hard rules

- One primitive per file. Compound primitives (Dialog + DialogTrigger + DialogContent) live in the same file.
- Always `forwardRef` and set `displayName`.
- Always merge `className` via `cn()` and spread `...props`.
- Use Radix for headless behavior. Don't roll your own focus trap or escape handler.
- No CSS-in-JS. Tailwind only.

## When this skill is overkill

If you need a one-off composite (e.g. "ticket priority chip"), build it as a domain component in `src/components/admin/<feature>/` instead — primitives are for reusable building blocks.
