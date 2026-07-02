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
- **`6be37fb`** — Página **`/bill/new`**: layout full-screen de 3 columnas (`bill/layout.tsx`),
  `BillForm`, `DocumentPreview`, `ResizableColumns`; ajustes en `/main`.
- **`0b5a594`** — Componente **Resizable** en el design system (`ui-system`).
- **`7be4b27`** — (commit mal etiquetado "resizeable") en realidad trae el **blob de factura**:
  migración `20260701223522_bill_file_blob`, fixtures PDF y ajustes de seed.
- **`5c3da14`** — Componente **List** en el design system.
- **`d254ebd`** — Toda la sesión de hoy: extracción AI del PDF (`/api/extract`, 2 agentes),
  persistencia del draft + blob, changes OpenSpec archivados y specs sincronizados.

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
- (Nota posterior) `AppShell` fue renombrado a `BackofficeLayout`
  (`components/backoffice-layout.tsx`).

### Archivo de factura como blob (implementado)
- Decisión: para el MVP (sin S3) la factura se guarda como **blob en la DB**, no como
  ruta/URL ni upload real.
- Schema: `Bill.fileUrl String?` → `file Bytes?` (Postgres `BYTEA`).
  Migración `20260701223522_bill_file_blob`.
- Fixtures: dos PDFs de muestra generados en `prisma/fixtures/` (sample-invoice.pdf,
  sample-invoice-2.pdf), embebidos en el seed vía `readFileSync`.
- Seed: 4 bills con adjunto (OCR/EMAIL/CSV → 883–890 bytes) y 2 `MANUAL` con `file = null`
  (para mostrar el estado "sin adjunto" en el UI).
- Gotchas resueltos:
  - `migrate dev` es interactivo cuando el drop de columna tiene datos → se limpió
    `fileUrl` con SQL (`UPDATE "Bill" SET "fileUrl" = NULL`) antes de migrar.
  - El cliente Prisma no se regeneró solo → `npx prisma generate` manual.
  - El dev server y la caché de Turbopack (`.next`) quedaron con el cliente viejo
    (pedían `Bill.fileUrl`) → `rm -rf .next` + restart. `/main` y `/bill/new` → 200.
- **Pendiente UI:** ruta para servir el blob (ej. `/api/bills/[id]/file` con
  `Content-Type: application/pdf`) y botón "Ver factura" que la consuma.

### OpenSpec change: `add-ai-bill-extraction` (propuesto)
- Feature grande: subir un PDF → Claude extrae un draft estructurado que prellena el form de crear bill.
- Decisiones tomadas (vía /opsx:propose):
  - **2 agentes en archivos separados** (revisado desde "1 sola llamada"), orquestados por el endpoint
    `/api/extract`, para separar responsabilidades:
    - `lib/ai/classify.ts` → clasificador (¿es bill?) en modelo barato `claude-haiku-4-5`, corta temprano
    - `lib/ai/extract.ts` → extractor de campos en modelo bueno `claude-opus-4-8`
    - patrón "agente barato filtra, agente caro trabaja"; cada uno con su prompt/schema (`generateObject`+Zod)
    - el "3er agente que devuelve JSON" no existe: `generateObject` ya devuelve JSON validado
  - **Validación**: PDF (magic bytes), ≤ 500KB, ≤ 5 páginas, no encriptado — rechazo temprano sin gastar
    llamada AI. (Fuera de scope: soportar escaneados / subir a 2MB.)
  - **Vendor**: se devuelve crudo por ahora; matching a `Vendor` existente queda para después.
  - **Resultado → store Zustand** que consume el form; **sin escrituras en DB** durante la extracción
    (la persistencia ocurre al submitear el form; el PDF puede ir al blob `Bill.file`).
  - Modelo pineado `claude-opus-4-8` (configurable a sonnet/haiku), Vercel AI SDK (`ai` + `@ai-sdk/anthropic`),
    `pdf-lib` para contar páginas. Requiere `ANTHROPIC_API_KEY`.
  - Claude lee PDFs nativo (sin OCR aparte); límites del modelo 32MB/~100pág, muy por encima de nuestros topes.
- Artefactos en `openspec/changes/add-ai-bill-extraction/` (proposal, design, specs, tasks) — validado OK.

### Implementación (`/opsx:apply`) — 25/25 tasks
- Deps: `ai` v7, `@ai-sdk/anthropic` v4, `zod` v4, `pdf-lib`, `zustand`. `ANTHROPIC_API_KEY` en `.env`
  (cableada desde la key que ya estaba comentada) + `.env.example` + README.
- Archivos nuevos:
  - `lib/ai/config.ts` (modelos por agente + límites), `lib/ai/schema.ts` (Zod + contrato de resultado),
    `lib/ai/prompts.ts`, `lib/ai/classify.ts` (Haiku), `lib/ai/extract.ts` (Opus)
  - `lib/pdf/validate.ts` (magic bytes, tamaño, páginas, encriptado vía pdf-lib)
  - `app/api/extract/route.ts` (POST, orquesta validate → classify → extract, runtime nodejs, no-cache)
  - `stores/bill-draft.ts` (Zustand: form + status + file; mapea extracción → form, suma line items)
    — inicialmente en `lib/store/`, luego movido a una carpeta `stores/` propia a nivel de `apps/app`
    (imports vía `@/stores/bill-draft`).
  - Cableados `document-preview.tsx` (sube a `/api/extract` + overlay "Reading invoice…") y
    `bill-form.tsx` (lee del store, muestra error de extracción)
- Verificación real contra el endpoint (dev server):
  - Happy path: `sample-invoice.pdf` → extrajo vendor "Figma Inc.", FIG-2043, dueDate, $1240, line item ✓
  - Rechazos ejercitados: INVALID_TYPE (txt), TOO_LARGE (>500KB), TOO_MANY_PAGES (6 pág),
    NOT_A_BILL (memo, clasificador Haiku dio razón correcta) ✓
  - ENCRYPTED: cubierto por código (`doc.isEncrypted`), no ejercitado con archivo real (falta qpdf local)
  - Sin escrituras en DB durante extracción (endpoint no importa Prisma; bills siguen en 6) ✓
  - `tsc --noEmit` limpio
- Fix de deprecación (AI SDK v7): `generateObject` está deprecado → migrado a
  `generateText({ output: Output.object({ schema }) })` en `classify.ts` y `extract.ts`
  (mismo comportamiento, salida validada por Zod en `result.output`). Verificado con endpoint real.
### Persistencia del draft + blob (implementado)
- Decisión: el PDF vive **temporalmente en el store de Zustand** (`file`) durante la revisión y se
  **persiste al guardar el draft** (no durante la extracción, no inmediatamente).
- `app/bill/new/actions.ts` → server action `saveDraft(FormData)`: find-or-create Vendor (matching por
  nombre, diferido), atribuye al primer User (sin auth aún), crea el `Bill` (status DRAFT, source OCR si
  hay archivo, `file` = blob del PDF, 1 line item derivado del form) + `revalidatePath`.
- `bill-form.tsx`: botón "Save draft" arma FormData (form del store + `file`) y llama la action; feedback
  saving/saved/error en el footer. ("Create bill" sigue stub — el flujo de aprobación es otro change.)
- Verificado (replicando la lógica de la action con `tsx` contra la DB real): Bill creado con
  `source OCR`, `status DRAFT`, **blob 890 bytes**, vendor y 1 line item; fila de prueba borrada, bills
  vuelven a 6. `tsc --noEmit` limpio.
- No pude hacer el e2e por UI (extensión de browser no conectada); el wiring cliente→action está
  typecheckeado y la escritura Prisma+blob verificada por separado.
- Registrado como mini-change OpenSpec **`add-bill-draft-persistence`** (proposal/design/specs/tasks,
  validado). Capability nueva `bill-draft-persistence`. 8/9 tasks hechas; la 3.3 (e2e por UI) queda
  pendiente hasta tener la extensión de Chrome conectada.

### Archivado (OpenSpec)
- `add-ai-bill-extraction` → `openspec/changes/archive/2026-07-01-add-ai-bill-extraction`; spec
  sincronizado a `openspec/specs/ai-bill-extraction/spec.md` (+4 requisitos).
- `add-bill-draft-persistence` → `archive/2026-07-01-add-bill-draft-persistence`; spec sincronizado a
  `openspec/specs/bill-draft-persistence/spec.md` (+2 requisitos). Archivado con la task **3.3 (e2e por
  UI) pendiente** — hacerla cuando la extensión de Chrome esté conectada.
- No quedan changes activos.

### OpenSpec change: `add-line-items-form` (propuesto + implementado)
- Feature: reemplazar el campo único "Amount" del form por una **lista editable de line items**
  (description + precio por fila), botón **"Add line item"**, e **"Invoice total"** calculado (estilo Ramp).
  Por item solo description + precio (sin los campos extra de Ramp: GL/category/department/class/billable).
- Store `stores/bill-draft.ts`: pasa a tener `lineItems: {description, amount}[]` (se saca el `amount` único),
  mapea la extracción real a filas, actions `setLineItem/addLineItem/removeLineItem`, y `invoiceTotal()`
  derivado (sum de `parseFloat`, NaN→0).
- `bill-form.tsx`: sección "Line items" con filas (description + price + botón borrar), "Add line item",
  e "Invoice total" read-only; `currency` movido a su propio campo en "Bill details".
- `actions.ts`: `saveDraft` recibe el array (JSON en FormData), crea **1 `BillLineItem` por fila no vacía**
  (quantity 1, unitPrice=total=precio, type EXPENSE, order=index) y `Bill.amount` = suma.
- Specs: nueva capability `bill-line-items` + MODIFIED de `bill-draft-persistence` (persistir el array real
  en vez de 1 item sintético).
- Verificado: `tsc` limpio; `/api/extract` devuelve el array de line items; replica tsx persistió 2 items
  con `Bill.amount = 1240.50` = suma (fila de prueba borrada, bills en 6). Pendiente: e2e visual por UI.
- Archivado → `archive/2026-07-02-add-line-items-form`; specs: `bill-line-items` creado (+3),
  `bill-draft-persistence` actualizado (~1 MODIFIED). No quedan changes activos.
