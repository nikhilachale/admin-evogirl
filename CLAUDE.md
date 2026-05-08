# CLAUDE.md

This file is read automatically by Claude Code when working in this repo. It captures the conventions, commands, and constraints of the project so Claude produces code that fits.

## What this is

**promise.evogirl.com** is the quality-promise / warranty management platform for the evogirl premium hair brand. The platform has two surfaces in one Vite + React SPA:

1. **Admin console** (`/admin/*`) — internal tool used by support agents.
   - Tickets queue (claims, defects, fraud flags)
   - Vouchers (issue, track, revoke)
   - Care guide editor (publish customer-facing care instructions)
   - QR card generator (unique codes for product packaging)
   - Analytics (volume, resolve times, fraud signals)
   - Settings (workspace, team, marketplace integrations)
2. **Customer flow** (`/help/*`) — public surfaces for end-customers.
   - Help / order lookup
   - My products
   - FAQ
   - Raise a ticket

The two surfaces share components and types but use **different theme variables** — admin is dark (deep purple + gold), customer is light (white + soft purple). This is handled by a `.theme-light` wrapper class on the customer layout; never hardcode colors.

## Tech stack

- **Vite + React 18** SPA with **TypeScript** strict.
- **React Router v6** (`createBrowserRouter`) — routes defined in `src/routes/index.tsx`.
- **Tailwind CSS** with shadcn/ui-style HSL theme tokens. The brand palette lives in `tailwind.config.ts` under `colors.brand.*` for occasional brand-specific surfaces.
- **shadcn/ui patterns** — components in `src/components/ui/` use `forwardRef` + `cva` + `cn()`. Headless behavior comes from Radix primitives.
- **Zustand** for client state (tickets, toasts). One store per concern in `src/store/`.
- **Recharts** for analytics charts.
- **qrcode** for QR generation.
- **Vitest** + Testing Library for tests.
- **Lucide** for icons. Don't introduce other icon libraries.

## Important: this is a SPA, not Next.js

This is a **client-rendered Single Page App**. There is no server component, no route handler, no `'use client'` directive. Implications:

- **Marketplace API credentials cannot live here.** Any call to Amazon/Flipkart/Meesho/Myntra goes through your own backend. The SPA hits `VITE_API_URL` (a separate server). See `src/lib/api/`.
- Environment variables must be prefixed `VITE_*` to be exposed to the browser. Anything secret has to live on the backend.
- Data fetching happens in `useEffect` hooks (or in router loaders if you adopt them). There is no SSR.
- For SEO-sensitive customer pages, consider migrating to Next.js or pre-rendering with a static export.

## Commands

| Task | Command |
| --- | --- |
| Install | `npm install` |
| Dev server | `npm run dev` (http://localhost:5173) |
| Production build | `npm run build` |
| Preview built bundle | `npm run preview` |
| Type check | `npm run typecheck` |
| Lint | `npm run lint` |
| Format | `npm run format` |
| Tests | `npm test` |

Before declaring any task done: `npm run typecheck && npm run lint`.

## Directory structure

```
src/
├── main.tsx                   App bootstrap — router + Toaster
├── routes/
│   ├── index.tsx              createBrowserRouter — route table
│   ├── admin/
│   │   ├── layout.tsx         sidebar + Outlet
│   │   ├── tickets.tsx
│   │   ├── analytics.tsx
│   │   ├── vouchers.tsx
│   │   ├── care-guide.tsx
│   │   ├── qr-generator.tsx
│   │   └── settings.tsx
│   └── customer/
│       ├── layout.tsx         theme-light wrapper + Outlet
│       ├── help.tsx
│       ├── my-products.tsx
│       └── faq.tsx
├── components/
│   ├── ui/                    shadcn-style primitives (Button, Card, Badge, …)
│   ├── admin/                 admin-only composed components
│   │   ├── sidebar.tsx
│   │   └── tickets/           tickets-list, ticket-detail, tickets-filters
│   ├── customer/              customer-only components
│   └── shared/                shared across surfaces (Logo, etc.)
├── hooks/                     custom hooks (use* prefix)
├── lib/
│   ├── utils.ts               cn, formatINR, formatRelative
│   └── api/
│       ├── client.ts          apiFetch + ApiError
│       └── marketplaces.ts    backend-mediated marketplace calls
├── store/                     Zustand stores (one per domain)
├── types/                     shared types — see types/domain.ts
├── data/                      mock data, seeds
└── styles/
    └── globals.css            Tailwind directives + theme tokens
```

Path alias `@/` → `src/`. Always `@/components/ui/button`, never `../../`.

## Domain model — read before touching tickets

The full domain is in `src/types/domain.ts`. Key concepts:

- A **Ticket** has a `status` (`pending` / `replacement-issued` / `resolved` / `rejected`), a `type` (`damage` / `defect` / `wrong-item` / `fraud` / `inquiry`), and a `priority`.
- Each ticket is bound to a **Customer** and an **Order**, where `Order.marketplace` is one of `amazon | flipkart | meesho | myntra | direct`.
- A ticket has a **DupCheck** — the result of polling the marketplace for prior claims on the same order. `dupCheck.status === 'bad'` is a strong fraud signal.
- Resolutions can be: replacement, refund, voucher, rejection, or escalation. All are actions on `useTicketsStore`.

When you change a ticket field, also check `src/components/admin/tickets/*` — most components subscribe to specific shape.

## Conventions

### Routing

- Routes are declared in `src/routes/index.tsx`. Add new routes there.
- Each route's component lives in `src/routes/<surface>/<name>.tsx` and uses **named exports** (e.g. `export function TicketsPage()`), not default exports.
- Use React Router's `<NavLink>` for nav links so active state works automatically.
- Use `<Navigate to="..." replace />` for redirects.

### Components

- `src/components/ui/` — primitives. PascalCase exports, lowercase filenames (`button.tsx`).
- `src/components/admin/` & `customer/` — domain-specific components. Group by feature folder when it grows (`admin/tickets/`).
- Always `forwardRef` for primitives that wrap a native element.
- Always spread `...props` and merge `className` via `cn()`.
- Set `Component.displayName` on `forwardRef` exports.
- Use `cva` for variant-driven primitives.

### Styling

- Use **semantic tokens** (`bg-primary`, `text-muted-foreground`, `border-border`) over scale values.
- Reach for `colors.brand.*` only for brand-specific surfaces (logo, gold accents in the admin sidebar) — never for general UI.
- Mobile-first. Layout breakpoints: `md:` for tablet, `lg:` for desktop.
- Use `theme-light` wrapper class to flip a subtree to the light palette (already done on customer layout).

### State

- Server state → fetch in a route component or via React Query later.
- Global client state (toasts, current user, ticket filters) → Zustand store in `src/store/`.
- Local UI state (open/closed, hover) → `useState` in the component.
- Don't add new global stores without a clear cross-component reason.

### Accessibility

- Every interactive element is keyboard-reachable.
- The tickets queue has documented shortcuts (j/k, /, a, x, Esc) — see `useTicketShortcuts`. Don't break them.
- Use semantic HTML; reach for ARIA only when needed.

## What NOT to do

- Don't introduce styled-components, emotion, or any CSS-in-JS. Tailwind is the styling system.
- Don't add new global state libraries — Zustand is enough.
- Don't add icon libraries beyond `lucide-react`.
- Don't put marketplace API keys in `.env` or `.env.local`. They belong on your backend, never in the bundle.
- Don't use unprefixed env vars — Vite only exposes `VITE_*` to the browser.
- Don't disable the `react-hooks/exhaustive-deps` rule. Fix the dependency.
- Don't commit `.env`, `.env.local`, or any real credentials.
- Don't hardcode colors. Use theme tokens or `brand.*` palette names.
- Don't break the admin keyboard shortcuts in `useTicketShortcuts`.

## Adding a new admin route

1. Create `src/routes/admin/<feature>.tsx` with a named export.
2. Register it in `src/routes/index.tsx` under the `/admin` children.
3. Add a nav entry in `src/components/admin/sidebar.tsx` (icon from `lucide-react`).
4. If the feature has its own state, add `src/store/<feature>.ts`.
5. Compose the page out of primitives from `src/components/ui/` and feature components in `src/components/admin/<feature>/`.
6. Add types to `src/types/domain.ts` if it introduces new domain concepts.
7. `npm run typecheck && npm run lint`.

## Adding a new ticket action

1. Add the action method to `useTicketsStore` in `src/store/tickets.ts`.
2. Toast the result via `toast({...})` from `@/store/toast`.
3. Wire a button into `src/components/admin/tickets/ticket-detail.tsx`.
4. If the action has a keyboard shortcut, update `src/hooks/use-ticket-shortcuts.ts`.

## Where the prototype lives

The original single-file HTML prototype is the source of truth for visual design and interaction patterns. When porting a feature:

1. Find the relevant section in the prototype (search by panel ID like `a-tickets`, `a-vouchers`).
2. Identify the data shape the prototype's JS uses (variables like `TICKETS`, `VOUCHERS`).
3. Create the typed equivalent in `src/types/domain.ts`.
4. Create mock data in `src/data/<feature>.mock.ts`.
5. Build the components, wire the store, replace mock with real fetch later.

Don't copy the prototype's CSS verbatim — translate it into Tailwind utilities + theme tokens. The brand palette in `tailwind.config.ts` was extracted directly from the prototype's `:root` variables.
