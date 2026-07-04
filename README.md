# TrashLab Challenge

## Approach

The approach was to build this **end-to-end**: a single framework that lets me interact
with a backend easily, without standing up a separate Node or Python environment. That's
why I chose **Next.js** — fast backend interaction.

I needed that backend to do real work around the AI on the server — not just to call
**Claude** (a model with OCR) for the bill scanner, but, for example, to **manipulate and
validate the PDF before** sending it, keep the API key server-side, and return **custom
responses** when there's an error.

Also, I know Next's backend has limits — route handlers are serverless functions that time
out (~10s Hobby / 60s Pro on Vercel), so a slow AI call can hit that. If this went to prod,
a dedicated backend would be worth a look.

The challenge asked for the product to **look and feel a lot like Ramp**, using Ramp's own
product as the visual reference. So I split the design system into a **separate package** —
**`ui-system`** (a design module several apps could share) — with **atomic components**,
which lets me consume them directly without much manipulation. It has a **Storybook** inside.

## What's inside

- **Backend** — part of the API, lives in Next (route handlers + server actions).
- **Frontend** — all the frontend.
- **AI** — Claude, via an API key.
- **UI System** — the shared component library (`packages/ui-system`, with Storybook).
  Built on **shadcn** (Tailwind + CSS-variable design tokens; you own the component code),
  which fits reproducing Ramp's tokens.

```
apps/web            → the product (Next.js: frontend + API)
packages/ui-system  → the design system (components + Storybook)
```

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Tailwind v4** + **shadcn** (CSS-variable design tokens)
- **Zustand** (client state) · **TanStack Query** (server cache)
- **Prisma 7** + **Neon** (Postgres)
- **Vercel AI SDK** (`ai` + `@ai-sdk/anthropic`) → **Claude**; **pdf-lib** for PDF validation
- **Storybook 10** (design-system docs) · **Vitest** (unit / store / a DB integration test)

## Architecture

**State management (Zustand)** — used in two flows:

- **`main` flow** — holds the table's **display state**: the search filter (which rows
  show), which **columns** are shown and their order, and the **row selection** used by
  bulk actions; all of that has to be persisted in a state that manages it.
- **`new bill` flow** — same idea: a general preset, like a simple/generic form controller,
  where the whole flow is managed.

**TanStack Query** — used to manage the APIs' cache and have loading state — e.g. when
queries need to be invalidated and data refetched.

**UI System** — the library's components are kept **as stateless as possible**, so they can
be reused as components get requested one way or another.

**Tailwind** — the styling layer (utility-first), with the theme driven by CSS-variable
design tokens shared across the app and the UI System.

**AI — two agents** (orchestrated by `/api/extract`, via the Vercel AI SDK):

- a **classifier** — cheap model (`claude-haiku-4-5`) that decides whether the uploaded
  document is actually a bill, so junk exits early without spending the expensive call;
- an **extractor** — strong model (`claude-opus-4-8`) that pulls the structured fields.

Pattern: **cheap model filters, expensive model works.**

**Database** — very simple relations: **User, Vendor, Bill, Line Items, Payment, Payment
Method** — nothing complex. For persistence I used **Neon** (Postgres), with **Prisma** as
the ORM.

## The flow

The flow relies heavily on managing the **Bill's status** — a bill moves from state to
state:

```
DRAFT → REVIEWED → APPROVED → PAID
```

- **Upload** a bill → if it's valid, it's detected and pre-loaded as a **draft**.
- **Review / confirm** it → **reviewed**.
- **Approve** it → **approved**.
- **Pay** it → **paid**.

On upload, two kinds of errors can surface:

1. the document isn't considered a **valid bill**;
2. it's detected as a **duplicate bill** — surfaced with a badge/banner.

## Out of scope (deliberate)

- **Mobile** — left out on purpose. Handling this much data-dense visualization is genuinely
  complex on mobile (it's typically a desktop/web experience), so I focused on the web view.
  It still renders on mobile, but the flows would need rethinking for a real mobile version.
- **Bulk ingestion** — no multi-PDF or Excel/CSV upload. It's an MVP and I wanted to show
  the core flow — **upload → ingest → recognize** — so bulk was set aside.
- **Advanced table filters** — beyond the status tabs, search, column controls, sorting, and
  CSV **export** that do ship, I didn't build richer filters (by vendor / date range). With the
  view store already in place, they'd slot in the same way.
- **Payment flows** — the concrete payment logic is left out. I wanted to show a normal
  bill-advancement flow (draft → … → paid); the real payment flows and their business rules
  would go deeper than the MVP needs.
- **Auth** — no authentication. To keep it MVP there's just a **single user**; the server
  actions attribute everything to that one user. No login, roles, or multi-tenant.
- **File storage** — PDFs aren't uploaded to external object storage (e.g. **S3**); they're
  stored in the DB as **blobs** (`Bytes` / BYTEA). Fine for the MVP, wouldn't scale.
- **Observability** — no monitoring / APM (e.g. **Datadog** / **New Relic**) and no error
  tracking (e.g. **Sentry**). You'd wire these up for production.

## How it was built

I leaned on **Claude Code** (with **Wispr Flow** for dictation) throughout. For the very
hard or heavy tasks — where I needed
to reason in depth about how the app would interact — I relied on **spec-driven development
(SDD) via [OpenSpec](https://github.com/Fission-AI/OpenSpec)**, which keeps context across
sessions of both the progress and the specs the application has (see `openspec/`).

## Run locally

```bash
npm install

# apps/web/.env
#   DATABASE_URL=<your Neon Postgres URL>
#   ANTHROPIC_API_KEY=<your Claude API key>

npm run db:migrate -w web   # apply migrations
npm run db:seed -w web      # demo data
npm run dev                 # web app  (apps/web)
npm run storybook           # design system (packages/ui-system)
npm run test -w web         # tests (Vitest) — co-located in _tests/ folders
```
