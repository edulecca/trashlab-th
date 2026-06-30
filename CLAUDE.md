@AGENTS.md

# trashlab-th — Payables (Bill Pay)

Take-home for **Silver.dev**: build an **accounts payable / Bill Pay** product, inspired by
[Ramp Bill Pay](https://support.ramp.com/hc/en-us/articles/27579228841875-Managing-bills-and-payments-on-Bill-Pay).
End-to-end: data models, backend, frontend.

**Track: Design Engineer.** The baseline requirement is that the product **looks and feels like Ramp** —
we reproduce Ramp's *design system* (color, type, spacing, component craft, microinteractions) and apply it
to our own scoped MVP. We are not cloning all of Ramp's features; we are demonstrating product taste, scope
judgment, UX quality, and the ability to grok a complex payables workflow. We come with opinions on where the
Ramp baseline can be improved (documented in the README).

## What the product does (working definition)

A company receives **bills** (invoices) from **vendors** and needs to review, approve, and pay them on time.
The product is the workflow that turns an incoming invoice into a paid, reconciled bill:

```
Vendor → Bill (draft) → Review/Approve → Schedule payment → Pay → Paid/Reconciled
```

Core entities (to be finalized via spec): **Vendor**, **Bill** (line items, amounts, due date, status),
**Payment**, **Approval**. Status drives most of the UI (pills/badges, filters, tabs).

> Scope, prioritized workflows, and what we deliberately left out are tracked in the README and in OpenSpec
> changes — not assumed here.

## Repository structure — two workspaces

This is a **monorepo** with two workspaces. Keep the product and the design system separate so the visual
language is reusable and reviewable on its own.

```
/app          → the application (the actual Bill Pay product)
/ui-system    → the design system: atomic components, documented in Storybook
```

### `/app` — the product

- **Next.js (default scaffold)**, App Router, React 19, Tailwind v4, TypeScript.
- Holds routes, pages, product-specific layout, data models, and backend (route handlers / server actions).
- Consumes components from `/ui-system`; does **not** define low-level primitives itself.

### `/ui-system` — the design system

- **Atomic components** (buttons, inputs, table, badge/status pill, modal, sidebar, etc.) that encode the
  **Ramp design system** — tokens (color, type, spacing, radius, shadow), states, and microinteractions.
- **Storybook** is the dev surface and living documentation for these components.
- This is where the Design Engineer craft lives. Build and refine primitives here, then compose them in `/app`.

## Specs — OpenSpec

For **large or ambiguous specifications**, use **OpenSpec**: write a change proposal (intent, design, specs,
tasks) before implementing, then implement against it. Use it to lock down the data model, the bill lifecycle
state machine, and any non-trivial workflow before building. Small, obvious changes don't need a spec.

## Conventions & guardrails

- Heed the Next.js 16 warning in `AGENTS.md`: this version has breaking changes — consult
  `node_modules/next/dist/docs/` before writing Next.js code, don't rely on training-data assumptions.
- Design system primitives live in `/ui-system` and are documented in Storybook; `/app` composes them.
- Prefer realistic demo data and clarity over breadth. Optimize for taste and judgment, per the brief.
