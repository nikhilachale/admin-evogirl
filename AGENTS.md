# AGENTS.md

This file is the cross-tool briefing for any AI coding agent (Claude Code, Cursor, etc.) working in this repo. It mirrors the highlights of `CLAUDE.md` in the standard `AGENTS.md` location.

## What this is

**promise.evogirl.com** — quality-promise / warranty platform for evogirl premium hair products. Two surfaces in one Vite + React SPA:

- **Admin console** at `/admin/*` — agents handle tickets, vouchers, care guides, QR codes, analytics, settings. Dark theme.
- **Customer flow** at `/help/*` — order lookup, FAQ, raise a claim. Light theme.

Theme is controlled by a `.theme-light` wrapper class on the customer layout. Never hardcode colors — always use semantic tokens or the `brand.*` palette.

## Important: this is a SPA

This is a **client-rendered Single Page App**, not Next.js. There is no server, no SSR, no route handler.

- **Marketplace API credentials cannot live here.** All Amazon/Flipkart/Meesho/Myntra calls go through your own backend (configured via `VITE_API_URL`).
- Environment variables must be prefixed `VITE_*` to be exposed to the browser.
- Anything secret has to live on the backend.

## Stack

- Vite + React 18 · TypeScript strict
- React Router v6 with `createBrowserRouter`
- Tailwind CSS with shadcn/ui-style HSL tokens
- Radix primitives + class-variance-authority for components
- Zustand for client state (one store per concern)
- Recharts for analytics charts
- Lucide for icons
- Vitest + Testing Library for tests

## What "done" looks like

```bash
npm run typecheck
npm run lint
```

Both pass with zero warnings. If tests cover the touched area, run `npm test` too.

## Where things live

```
src/
├── main.tsx              app bootstrap — router + Toaster
├── routes/
│   ├── index.tsx         createBrowserRouter — route table
│   ├── admin/            sidebar + 6 admin route files
│   └── customer/         theme-light layout + customer routes
├── components/
│   ├── ui/               shadcn primitives — Button, Card, Badge, Input, Toaster
│   ├── admin/            admin-only composed components
│   ├── customer/         customer-only components
│   └── shared/           shared (Logo, etc.)
├── hooks/                custom hooks (use* prefix)
├── lib/
│   ├── utils.ts          cn, formatINR, formatRelative
│   └── api/              backend-mediated API calls
├── store/                Zustand stores — tickets, toasts
├── types/                domain types — see types/domain.ts
├── data/                 mock data, seeds
└── styles/globals.css    Tailwind + theme tokens
```

Path alias `@/` → `src/`. Always `@/components/ui/button`, never `../../`.

## The five rules

1. **Named exports for route components.** `export function TicketsPage()`, never default.
2. **Stores live in `src/store/`.** Never instantiate Zustand inline.
3. **Semantic tokens for colors.** `bg-primary`, `text-muted-foreground`, `border-border` — not raw scale values.
4. **Don't break the keyboard shortcuts.** `useTicketShortcuts` wires j/k/a/x/Esc/`/` for the tickets queue.
5. **Marketplace calls go through `src/lib/api/`** to your backend. Never directly from the browser.

## Conventions

- Components: lowercase filenames in `src/components/ui/` (`button.tsx`), PascalCase exports, `forwardRef` + `displayName` for native-element wrappers.
- Variants: use `cva`, export `<name>Variants` alongside the component.
- Toasts: call `toast({...})` from `@/store/toast` — don't create a second notification system.
- Icons: `lucide-react` only.
- No CSS-in-JS. No inline `<style>`. No `dangerouslySetInnerHTML`.

## Available subagents (Claude Code)

| Agent | When to use |
| --- | --- |
| `admin-panel-builder` | Adding or extending an admin panel under `/admin/*` |
| `prototype-porter` | Translating a feature from `promise-admin.html` |
| `customer-flow-builder` | Adding or modifying customer-facing screens |

## Available skills

| Skill | When to use |
| --- | --- |
| `add-admin-panel` | Full add cycle for a new admin panel |
| `add-ticket-action` | Adding a new lifecycle action to tickets |
| `add-shadcn-primitive` | Adding a UI primitive to `src/components/ui/` |
| `port-prototype-feature` | Porting from the original HTML prototype |
| `wire-marketplace-integration` | Wiring SPA → backend for marketplace calls |

## Helpful commands

```bash
npm install          # install deps
npm run dev          # http://localhost:5173
npm run build        # production build → dist/
npm run preview      # preview built bundle
npm test             # vitest
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run format       # prettier
```

## What NOT to do

- Don't put marketplace API keys in any `.env*` file. They live on the backend.
- Don't use unprefixed env vars — Vite only exposes `VITE_*` to the browser.
- Don't introduce CSS-in-JS, additional state libraries, or extra icon libraries.
- Don't disable the `react-hooks/exhaustive-deps` rule. Fix the dependency.
- Don't break the documented keyboard shortcuts in the tickets queue.
- Don't copy raw HTML/CSS from the prototype. Translate semantically.
