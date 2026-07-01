This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Database (Prisma + PostgreSQL)

The Bill Pay data model lives in `prisma/schema.prisma` (see
`openspec/changes/add-billpay-data-model` for the design).

1. **Set the connection string.** Copy `.env.example` to `.env` and set
   `DATABASE_URL` to your PostgreSQL instance (local, or a hosted free tier
   such as Neon / Supabase). `.env` is gitignored — never commit it.

   ```bash
   cp .env.example .env   # then edit DATABASE_URL
   ```

2. **Create the schema and seed demo data:**

   ```bash
   npm run db:migrate -w app   # creates the schema (prisma migrate dev)
   npm run db:seed    -w app   # loads realistic demo data
   ```

Scripts: `db:generate` (client), `db:migrate` (dev migration), `db:deploy`
(apply migrations, prod), `db:seed`, `db:reset` (drop + re-migrate + reseed).

> The seed **resets** the database to a known state — point `DATABASE_URL` at a
> dedicated demo database, not one with data you care about.

## AI bill extraction

Uploading an invoice PDF on the create-bill page runs it through Claude (via the
Vercel AI SDK) to pre-fill the form. Set an Anthropic API key in `.env`:

```bash
ANTHROPIC_API_KEY="sk-ant-..."   # https://console.anthropic.com/
```

The endpoint lives at `POST /api/extract`; see
`openspec/changes/add-ai-bill-extraction` for the design.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
