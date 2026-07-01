# DEVLOG — trashlab-th (Payables / Bill Pay)

Registro cronológico de decisiones y trabajo, para luego volcarlo al README / entrega.

---

## Historia previa (según commits)

- **`85fcf4e`** — Scaffold inicial de Create Next App.
- **`72c78c6`** — Setup del monorepo con npm workspaces (`app` + `ui-system`).
- **`5d0b2c1`** — Storybook configurado en `ui-system`.
- **`4ed5401`** — Componentes **Button** y **Tabs** en el design system.
- **`35d09a3`** — Componente **Badge** (status pill).
- **`f66d93a`** — **Table** y **DataTable** en el design system.
- **`3d66be9` / `a066261`** — **Prisma**: schema + modelos (Vendor, Bill, Payment, Approval…),
  migración `init`, seed con datos demo, y specs OpenSpec del data model.
- **`f920185`** — Reorg a `apps/` + `packages/` y primeras vistas del producto
  (`/main`, `AppShell`, `bills-table`).

---

## Sesión 2026-07-01

### Reorganización a convención `apps/` + `packages/`
- Movidos los workspaces: `app/` → `apps/app/`, `ui-system/` → `packages/ui-system/`
  (con `git mv`, se conserva el historial).
- Raíz `package.json`: `workspaces` pasó de rutas explícitas a globs `["apps/*", "packages/*"]`.
- `npm install` recreó los symlinks (`node_modules/app → ../apps/app`,
  `node_modules/ui-system → ../packages/ui-system`).
- **No** hizo falta tocar configs internas (referencias por nombre de workspace o
  relativas al propio paquete): `next.config.ts` (`transpilePackages: ["ui-system"]`),
  tsconfigs, `vite.config.ts`, `components.json`, `.storybook`.
- **Fix pendiente detectado en runtime:** `apps/app/app/globals.css` referenciaba al
  design system por ruta relativa; se corrigió la profundidad
  (`../../ui-system/...` → `../../../packages/ui-system/...`) en el `@import` y el `@source`.

### Base de datos local (Docker)
- Levantado Postgres desechable: contenedor `trashlab-pg` en `localhost:5439`
  (`postgres:16`, user/pass/db = `trashlab`).
- `npm run db:migrate` (aplicó `20260701031136_init`) + `npm run db:seed`
  (6 bills, 4 payments, 4 payment methods, 3 users, 6 vendors).
- `DATABASE_URL` activa apunta al contenedor local; verificado `GET /main → 200`.

### Refactor de componentes
- `AppShell` (chrome general: sidebar + nav + drawer móvil) movido de
  `app/main/_components/app-shell.tsx` → `apps/app/components/app-shell.tsx`,
  reutilizable vía alias `@/components/*`.
- `bills-table.tsx` se queda en el `_components/` de la ruta (es específico de Bills).
- Import en `app/main/layout.tsx` actualizado a `@/components/app-shell`.
- Verificado: `tsc --noEmit` limpio, `GET /main → 200`.
