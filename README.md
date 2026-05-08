# promise.evogirl.com

Quality-promise & warranty management platform for **evogirl premium hair**. Built with Vite + React + TypeScript + Tailwind CSS + shadcn/ui patterns. Pre-configured for Claude Code.

## What's inside

- **Admin console** at `/admin/*` — tickets queue, analytics, vouchers, care guide editor, QR card generator, settings. Dark theme.
- **Customer flow** at `/help/*` — help, my products, FAQ. Light theme.
- **Shared design system** — shadcn-style primitives in `src/components/ui/`, brand palette extracted from the original prototype.
- **Domain model** — typed Tickets, Vouchers, CareGuides, QrCards in `src/types/domain.ts`.
- **Zustand stores** for client state (tickets + toasts).
- **Keyboard shortcuts** for the tickets queue: `j`/`k` to navigate, `a` to approve, `x` to reject, `/` to focus search, `Esc` to blur.

## Quick start

```bash
npm install
cp .env.example .env.local   # set VITE_API_URL when you have a backend
npm run dev
```

Visit http://localhost:5173 — you'll be redirected to the tickets queue.

## Architecture note: SPA + your backend

This is a Vite SPA. It cannot safely hold marketplace API credentials. Architecture:

```
Browser (this SPA)  →  Your backend (you build)  →  Marketplace APIs
                       holds credentials
```

The SPA's API client (`src/lib/api/`) hits whatever URL is set in `VITE_API_URL`. For local development without a backend, the tickets store has a graceful fallback that pretends marketplace checks return "ok". When you have a real backend, see `.claude/skills/wire-marketplace-integration/`.

## Tech stack

- ⚡ **Vite** — fast dev server and bundler
- ⚛️ **React 18** + **TypeScript** strict
- 🛣️ **React Router v6** with `createBrowserRouter`
- 🎨 **Tailwind CSS** with shadcn/ui-style HSL theme tokens (light + dark)
- 🧱 **Radix UI** primitives + **class-variance-authority** for variants
- 🐻 **Zustand** for client state
- 📊 **Recharts** for analytics
- 🔲 **qrcode** for QR generation
- 🎭 **Lucide** icons
- 🧪 **Vitest** + **Testing Library**
- ✅ **ESLint** + **Prettier** (with Tailwind plugin)
- 🤖 **Claude Code ready** — `CLAUDE.md`, three subagents, five skills

## Project structure

```
.
├── CLAUDE.md                          Claude Code project memory
├── AGENTS.md                          Cross-tool agent briefing
├── .claude/
│   ├── agents/
│   │   ├── admin-panel-builder.md
│   │   ├── prototype-porter.md
│   │   └── customer-flow-builder.md
│   └── skills/
│       ├── add-admin-panel/
│       ├── add-ticket-action/
│       ├── add-shadcn-primitive/
│       ├── port-prototype-feature/
│       └── wire-marketplace-integration/
├── src/
│   ├── main.tsx                       app bootstrap
│   ├── routes/
│   │   ├── index.tsx                  route table
│   │   ├── admin/
│   │   │   ├── layout.tsx             sidebar + Outlet
│   │   │   ├── tickets.tsx            fully wired
│   │   │   ├── analytics.tsx          stat cards + chart placeholder
│   │   │   ├── vouchers.tsx           stub
│   │   │   ├── care-guide.tsx         stub
│   │   │   ├── qr-generator.tsx       working QR generation
│   │   │   └── settings.tsx           stub
│   │   └── customer/
│   │       ├── layout.tsx             theme-light wrapper
│   │       ├── help.tsx
│   │       ├── my-products.tsx
│   │       └── faq.tsx
│   ├── components/
│   │   ├── ui/                        Button, Card, Badge, Input, Toaster
│   │   ├── admin/
│   │   │   ├── sidebar.tsx
│   │   │   └── tickets/               list, detail, filters
│   │   └── shared/
│   │       └── logo.tsx
│   ├── hooks/
│   │   └── use-ticket-shortcuts.ts
│   ├── lib/
│   │   ├── utils.ts                   cn, formatINR, formatRelative
│   │   └── api/
│   │       ├── client.ts              apiFetch + ApiError
│   │       └── marketplaces.ts        backend-mediated calls
│   ├── store/
│   │   ├── tickets.ts                 tickets state + actions
│   │   └── toast.ts                   toast queue
│   ├── types/
│   │   └── domain.ts                  Ticket, Customer, Order, Voucher, …
│   ├── data/
│   │   └── tickets.mock.ts
│   └── styles/
│       └── globals.css                Tailwind + theme tokens
├── tailwind.config.ts                 brand palette + shadcn tokens
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Scripts

```bash
npm run dev          # dev server at :5173
npm run build        # production build → dist/
npm run preview      # preview built bundle
npm test             # vitest
npm run typecheck    # tsc --noEmit
npm run lint
npm run format
```

## Theme system

Two themes share the same tokens, mapped differently:

- **Default (admin dark)** — deep purple background, gold primary, pink destructive. Lives at `:root` in `globals.css`.
- **Light (customer)** — soft white background, deep purple primary. Activated by adding the `.theme-light` class to a wrapper element.

The customer route's layout (`src/routes/customer/layout.tsx`) applies `theme-light` automatically. To use the light theme inside the admin (e.g. for a print preview), wrap that subtree in `<div className="theme-light">`.

## Brand palette

Extracted from the original prototype's `:root` CSS variables. Available as Tailwind classes like `bg-brand-purple` or `text-brand-gold`:

| Token | Value | Used for |
| --- | --- | --- |
| `brand.purple-darkest` | `#0F0618` | admin sidebar bg |
| `brand.purple-deep` | `#1A0A2E` | hero gradients |
| `brand.purple` | `#3D2466` | customer primary |
| `brand.purple-mid` | `#6B3FA0` | accents |
| `brand.purple-light` | `#9B6FD0` | highlights |
| `brand.purple-pale` | `#EDE8F5` | soft surfaces |
| `brand.gold` | `#D4AF37` | admin primary, logo |
| `brand.gold-light` | `#F0D878` | active states |
| `brand.gold-dark` | `#A88820` | hover states |
| `brand.pink` | `#FF3D8B` | destructive, fraud flag |
| `brand.pink-light` | `#FF85B3` | accent |
| `brand.white` | `#FAF7FF` | text on dark |
| `brand.gray` | `#8B7AAA` | secondary text on light |

For most UI, prefer the semantic shadcn tokens (`bg-primary`, `text-muted-foreground`, `border-border`) — they automatically respond to theme. Reach for `brand.*` only for brand-specific surfaces (logo, gold accent strips, hero gradients).

## Working with Claude Code

Open the project in Claude Code; `CLAUDE.md` is read automatically. Common asks and which agent/skill kicks in:

- *"Port the vouchers panel from the prototype"* → `prototype-porter` agent + `port-prototype-feature` skill
- *"Add a snooze action to tickets"* → `add-ticket-action` skill
- *"Add a Dialog primitive"* → `add-shadcn-primitive` skill
- *"Build the customer claim form"* → `customer-flow-builder` agent
- *"Wire the backend for duplicate checks"* → `wire-marketplace-integration` skill

## What's stubbed vs done

| Feature | Status |
| --- | --- |
| Admin sidebar + routing | ✅ done |
| Tickets queue (list + detail + filters + shortcuts) | ✅ done |
| Tickets actions (approve, reject, replacement, refund, voucher, fraud, escalate, dup-check) | ✅ done as in-memory store actions |
| QR generator | ✅ working preview |
| Analytics | 🟡 stat cards done, chart placeholder |
| Vouchers | 🟡 page shell done, list + form TODO |
| Care guide editor | 🟡 page shell done, editor TODO |
| Settings | 🟡 sections stubbed |
| Customer help / my-products / FAQ | 🟡 page shells, content TODO |
| Backend integration | ❌ TODO — see `wire-marketplace-integration` skill |
| Auth | ❌ TODO — pick a provider, send cookies via `apiFetch` |
| Persistence | ❌ TODO — replace `data/*.mock.ts` with real fetches |

## Next steps

1. **Run the dev server** and click through the tickets queue. Try the keyboard shortcuts.
2. **Pick an unfinished feature** and use the matching skill — most flows are 30 min of work each.
3. **Build a backend** for marketplace integrations and auth (the SPA can't hold credentials).
4. **Replace mock data** with real fetches via `apiFetch`.

## License

Internal — evogirl team only.
# admin-evogirl
