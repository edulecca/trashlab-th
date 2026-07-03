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

### OpenSpec change: `add-bill-tax` (propuesto + implementado + archivado)
- Motivación: las facturas separan **subtotal + impuestos**; el `Bill` no tenía campo `tax`, así que el
  extractor metía el IVA/tax como un line item más (ensuciaba la lista y rompía el subtotal).
- Decisión (Opción A): `Bill.amount` **sigue siendo el total** que se paga; se agrega `tax Decimal(12,2)
  @default(0)`. Invariante `amount = Σ line items + tax`. El **subtotal es derivado**, nunca se guarda
  (consistente con "overdue is derived, never stored"). Se descartó la Opción B (`amount` = subtotal) y
  un `LineItemType.TAX` (re-contaminaría el subtotal).
- Migración `20260702171513_bill_tax` (aditiva, default 0 backfillea filas viejas) + client regenerado.
- Seed: helper `lineItems(items, taxRate)` → `amount = subtotal + tax`; Figma (FIG-2043) y AWS (AWS-2042)
  con 8.5% de tax; el resto tax=0. Verificado que las 6 bills cumplen `amount = subtotal + tax`.
- Extracción AI: `bill.tax: number|null` en el Zod schema; prompt actualizado para **sumar todas las
  líneas de impuesto** (VAT/GST/sales tax/surcharge) en un solo `tax`, sacarlas de `lineItems`, y dejar
  shipping/descuentos como items.
- Store `stores/bill-draft.ts`: `tax` como campo del `form` (lo cubre `setField`, sin `setTax` aparte);
  helpers `subtotal(items)` e `invoiceTotal(items, tax) = subtotal + tax`.
- `bill-form.tsx`: desglose **Subtotal / Tax (editable) / Invoice total** en vez del total único;
  "details complete" pasa a basarse en `subtotal > 0`.
- `actions.ts`: `saveDraft` lee `tax` de FormData, setea `Bill.tax` y `Bill.amount = subtotal + tax`.
- Verificación real:
  - `tsc --noEmit` limpio.
  - `/api/extract` con un PDF de prueba (VAT $154 + surcharge $20 + shipping $40) → devolvió `tax: 174`
    (sumó ambos impuestos), shipping quedó como item, ni VAT ni surcharge en `lineItems`; total 1540+174
    = 1714 = "Total due" de la factura. ✓
  - Persistencia replicada con tsx contra la DB real: `amount 1714`, `tax 174`, subtotal 1540, invariante
    OK; fila de prueba borrada, bills vuelven a 6. ✓
- Archivado → `archive/2026-07-02-add-bill-tax`; specs sincronizados vía `openspec archive`: `bill-tax`
  creado (+2), `billpay-data-model` / `ai-bill-extraction` / `bill-draft-persistence` actualizados
  (~3 MODIFIED). `openspec validate --all` → 7 passed, 0 failed. No quedan changes activos.

### Design system: Input / Textarea estilo Ramp (label dentro de la caja)
- Empezamos por shadcn puro (`npx shadcn add field input textarea`), pero el `Field` de shadcn pone el
  **label afuera/arriba** — no matchea la referencia de Ramp (label **dentro** de la caja).
- Reconciliación: se extendieron los `Input`/`Textarea` de shadcn con una variante **enmarcada** — cuando
  reciben `label` (o accessory) rinden la caja Ramp: **60px fija**, esquinas **cuadradas** (`rounded-none`),
  label adentro (13px, muted), valor `text-xl`, `leftAccessory`/`rightAccessory`, foco en toda la caja,
  `invalid`/`disabled`. Sin `label` caen al input/textarea plano de shadcn (compacto), para line items y tax.
- Se borró el `Field`/`FieldLabel`/`Label`/`Separator` de shadcn (código muerto, patrón label-afuera que
  confundía) — queda un solo patrón coherente. Stories `Input`/`Textarea` en Storybook.
- `bill-form.tsx` cableado a `Input label=…` / `Textarea label=…` (sin wrappers Field); line items rehechos
  como **tabla cuadrada** (header Description/Price + celdas borderless + "Add line item" full-width);
  badge "Draft" inline al lado del título.
- `/main`: celda Vendor extraída a `VendorElementRow` (`ListItem` del DS): **avatar circular** (img o
  iniciales fallback) + nombre del vendor + `uploader · fecha`. Tabla full-width, sin card/borde externo.

### OpenSpec change: `add-bills-status-tabs` (propuesto + implementado + archivado)
- Feature: `/main` interactivo con **tabs de status** sobre la tabla, fetch client-side con **TanStack Query**.
- Nuevo estado **`REVIEWED`** en `BillStatus` (`NEEDS_REVIEW → REVIEWED → APPROVED`); migración
  `bill_status_reviewed`, seed con 1 bill REVIEWED (VER-3088) → 7 bills, uno por estado. La lógica compara
  por nombre, no por ordinal del enum.
- **RQ**: `@tanstack/react-query` + `QueryProvider` (client, `QueryClient` estable, `staleTime` 30s) en
  `RootLayout`.
- **Fuente de verdad del row**: `lib/bill-row.ts` (`BillRow` + `toBillRow`, overdue derivado) compartido por
  API y tabla. **API**: `GET /api/bills?status=…` (param repetible, valida contra el enum, sin param = todo).
  **Hook**: `hooks/use-bills.ts` `useBills({ status })`, normaliza a array ordenado, key `["bills", sorted]`.
- **UI**: `bills-view.tsx` (isla cliente) con tabs Overview / Draft (`DRAFT`+`NEEDS_REVIEW`) / For Approval
  (`REVIEWED`) / For Payment (`APPROVED`), sincronizados a `?tab=` (fallback Overview); tabla via `useBills`
  con loading/empty; `page.tsx` ya no toca Prisma. Badge `Reviewed` agregado.
- Verificación: `tsc` limpio; API por curl (all→7 estados, `?status=REVIEWED`→VER-3088, multi
  `DRAFT&NEEDS_REVIEW`→2, `BOGUS`→ignora, overdue derivado OK); `/main` 200 con los 4 tabs y deep-link
  `?tab=approval` 200. Click-through visual no ejercitado (extensión de Chrome sin conectar); filtrado
  verificado en la capa de datos.
- **Gotcha**: la API tiraba 500 en queries que incluían el bill REVIEWED — el dev server corría con el
  cliente Prisma pre-migración. Se resolvió matando procesos `next` viejos + `rm -rf .next` + restart.
- Archivado → `archive/2026-07-03-add-bills-status-tabs`; specs: `bills-api` (+2) y `bills-list-tabs` (+3)
  creados, `billpay-data-model` / `demo-seed-data` actualizados (~2 MODIFIED). `openspec validate --all`
  → 9 passed, 0 failed. No quedan changes activos.

### OpenSpec change: `add-bills-table-toolbar` (propuesto + implementado + archivado)
- Feature: toolbar estilo Ramp arriba de la tabla de `/main`, manejada por un **store Zustand de vista**.
  Alcance: **Search + Columns + Options**. Filtros/calendar/export → placeholders inertes (change aparte).
  Sin "Save as new view" ni persistencia (store en memoria).
- Decisión de arquitectura (charlada con el user):
  - **Opción B**: el store guarda data plana (`search`, `columnVisibility` map, `columnOrder` array) y
    `BillsTable` **deriva afuera** las columnas (filtradas+ordenadas, Vendor pineado) y las filas (filtro de
    search sobre vendor+invoice #), pasándoselas al `DataTable` **intacto**. Se descartó inyectar los modelos
    controlados de TanStack (columnVisibility/columnOrder/globalFilter) para no acoplar el `DataTable`
    genérico del design system.
  - **Row selection** queda dentro del `DataTable` (concern de interacción); se lifta a un store recién
    cuando lleguen bulk-actions. "Single source of truth" es por concern, no "todo en un store".
- Primitivos nuevos en `ui-system` vía shadcn: `DropdownMenu` (Options) + `Popover` (Columns); `Checkbox`
  ya existía. Deps: `@dnd-kit/{core,sortable,utilities}` para el drag-reorder de columnas.
- Store `stores/bills-view.ts` (`useBillsView`) con config `COLUMNS` compartida (vendor `locked`);
  actions `setSearch`/`toggleColumn`/`setColumnOrder`/`resetFilters`/`resetView`.
- Componentes (todos scoped a `/main`, en `app/main/_components/` — se movieron ahí desde `components/` a
  pedido del user): `bills-search.tsx` (borderless, 80px), `columns-menu.tsx` (Popover + dnd-kit sortable,
  Vendor locked/primero), `options-menu.tsx` (Reset filters/Reset view), `bills-toolbar.tsx` (search +
  cluster de íconos con filter/calendar/export disabled). `bills-view.tsx` renderiza la toolbar; el count
  ("N bills · overdue") se movió a `bills-table.tsx` y cuenta las filas **filtradas**.
- Verificación: `tsc` limpio (app + ui-system); `/main` 200 con toolbar (Search/Options/Columns) y los 3
  placeholders `disabled` confirmados, tabs intactos; **lógica del store por tsx (16/16 asserts)**: toggle
  hide/show, vendor locked, reorder con vendor pineado, resetFilters (no toca columnas), resetView (restaura
  orden+visibilidad), matching de search. Click-through visual no ejercitado (extensión de Chrome sin
  conectar).
- Archivado → `archive/2026-07-03-add-bills-table-toolbar`; specs: `bills-table-view` creado (+5),
  `bills-list-tabs` actualizado (+1 ADDED). `openspec validate --all` → 10 passed, 0 failed. No quedan
  changes activos.

### Table UI + design-system polish (`b9adea1`)
- **Tabla `/main`**: el borde de las filas es el default (`border-b` en `TableRow`); se sacó la prop opt-in
  `border-r` por columna y se horneó el divisor vertical entre **todas** las columnas directo en las
  primitivas `TableHead`/`TableCell` (`border-r last:border-r-0`) — comportamiento default, sin config.
- **`SearchField`** extraído: search borderless/transparente con variantes `lg`/`sm` (primero en
  `apps/app/components/search-field.tsx`). El search del toolbar (`bills-search`) y el del rail lo consumen.
- **Botón** `size lg` bajado a `h-11` (más rectangular). Search del rail con `border-y` full-width + más alto.

### Componentización: `/main` y `/bill/new` (`7780d4b`, `8766dff`)
- **`/main/_components/`** reorganizado en subcarpetas: `toolbar/` (search, columns-menu, options-menu,
  bills-toolbar) y `table/` (bills-table + `columns.tsx` + `cells/` con `vendor-cell`, `status-cell`,
  `amount-cell`, `due-date-cell`). `bills-table.tsx` (162 líneas) partido: ensamblador + defs + celdas.
- **`SearchField` y `Skeleton` movidos al `ui-system`** (con story cada uno). `DataTable` sumó
  **agrupación** (prop `groupBy` → fila-encabezado full-width por sección, con checkbox que selecciona solo
  su grupo, ícono y contador) y **estado loading** (`loading`/`loadingRows` → filas skeleton). `IconButton`
  interno para el toolbar.
- **`bill-form.tsx` (302 líneas)** partido en `form/`: `bill-form` (orquestador ~110), `section-badge`,
  `vendor-section`, `details-section`, `line-items-editor`, `totals-summary`, `form-footer`. Las secciones
  pasan a **presentacionales** (data + `disabled` + handlers por props; sin suscribirse al store), para
  poder reusarlas read-only. `VendorAvatar` extraído a `components/`; `bills-rail` extraído.
- **`lib/` nuevos/dedup**: `format.ts` (money tolerante + `formatDate`, mata 3 copias), `bill-status.ts`
  (`STATUS_DISPLAY` + `STATUS_TO_CATEGORY` + `CATEGORY_META` + `categoryRank`), `bills.ts`
  (`matchesBillSearch`, `billHref`). Se sacaron `NEEDS_REVIEW` y `SCHEDULED` del enum (migración
  `drop_needs_review_scheduled`, aditiva-inversa manual). Overview agrupa en 4 secciones (Ready for review /
  Awaiting approval / Ready for release / Paid) con íconos lucide (`Circle`/`CircleCheck`/`CircleDot`/
  `CircleDollarSign`).

### OpenSpec change: `add-bill-view-screen` (`69128dc`, archivado)
- Pantalla read-only **`/bill/view/[id]`**: carga el bill de la DB y renderiza el mismo form del create pero
  **disabled**, prellenado. Draft → `redirect("/bill/new")`; id inexistente → `notFound()`.
- **Reuso, no duplicación**: `ResizableColumns` y `bills-rail` movidos a `@/components/`; las secciones del
  form (ahora presentacionales) se reusan con `disabled`. Panel PDF read-only nuevo (`bill-pdf-panel`) — no
  el `DocumentPreview` (que es upload+extract).
- **Serví el PDF**: `GET /api/bills/[id]/file` (bytes `application/pdf` o 404). Loader `lib/bill-view.ts`
  (bill + vendor + line items, sin traer los bytes; `hasFile` por proyección `file IS NOT NULL`).
- **Navegación**: `onRowClick` en `DataTable` (checkbox/acciones hacen `stopPropagation`) + `<Link>` en el
  rail; `billHref` rutea por status (DRAFT→create, resto→view).
- **Top bar `/bill`** con context (avatar + status + `VENDOR INV# NUMBER`) publicado por cada pantalla vía
  context, e ícono de panel que **colapsa el rail** (coordina `rail-toggle` context + `usePanelRef` del
  resizable; la sección izquierda del header sigue el ancho real del rail para alinear el divisor).
- Gotcha: al mover funciones puras (`subtotal`/`invoiceTotal`) el server las importaba desde el store
  `"use client"` → 500; se movieron a `lib/line-items.ts`. Toaster (`sonner`) sumado al DS.
- Archivado → `archive/2026-07-03-add-bill-view-screen`; specs `bill-view-page` (nuevo) + deltas de
  `bills-table-view` / `bill-create-page`. Verificado por curl: view con/sin PDF, draft→307, unknown→404.

### Vendor find-or-create al escanear (`cb18ec6`)
- Al terminar el scan (`/api/extract`), **find-or-create del Vendor por name+email** (`lib/vendors.ts`); si
  re-escaneás la misma factura, reusa el vendor (no duplica). `saveDraft` usa el mismo helper (antes
  matcheaba solo por name). Verificado: mismo name+email reusa, email distinto crea nuevo.

### Storybook: stories a carpeta propia (`679e253`)
- Los `*.stories.tsx` movidos de `components/ui/` a `src/stories/` (separar componentes de su documentación).

### OpenSpec change: `add-bill-lifecycle-actions` (`cbd68ba`)
- **Máquina de estados** DRAFT → REVIEWED → APPROVED → PAID, con writes guardados (`updateMany` con `where`
  de status origen; `count===0` = estado inesperado). Actions `confirmBill`/`approveBill`/`payBill` en
  `actions.ts`; `payBill` crea el `Payment` (método elegido) en una `$transaction`.
- **Payment method** por bill: campo `Bill.paymentMethod` (slug ach/check, migración aditiva), selector
  `PaymentMethodSection` (ACH / By Check), `lib/payment-methods.ts` (`PAYMENT_METHODS` + `DEFAULT`).
- **Auto-save del draft tras OCR**: `persist-draft.ts` (`persistDraft` compartido); `saveDraft` pasó a
  **upsert** (crea o actualiza por `billId`) y el `DocumentPreview` persiste el DRAFT apenas termina la
  extracción (resumible / aparece en Drafts). Store `bill-draft` guarda `billId`.
- **UI de acciones**: `bill-action-bar` (view) + `pay-bill-cell` (tabla) + hook `use-bill-actions` (mutations
  RQ con invalidación + toast). Footer del create con **Save draft / Confirm**. Toast success en verde del
  token `--success`.
- **Seed** reescrito y alineado al schema/flujo: `paymentMethod` en todos los bills, pagos solo en
  PAID/FAILED, 10 bills repartidos en las 4 secciones, +2 vendors.

### OpenSpec change: `add-duplicate-bill-detection` + soft delete (`65f7463`)
- **Detección de duplicados 100% en UI** (sin persistir): dos bills son duplicados si comparten invoice
  number + vendor; original = `createdAt` más viejo. `lib/duplicates.ts` (`annotateDuplicates` +
  `findDuplicateNumber`) corre en los componentes cliente sobre los bills ya cargados. `BillRow` gana
  `duplicateOf`. Pill **"Duplicate"** (destructive) en tabla y rail; banner destructive arriba del form.
- **Soft delete**: estado nuevo **`DELETED`** en el enum (migración aditiva `bill_status_deleted`).
  `deleteBill` marca DRAFT→DELETED (no borra). Se excluye de **todo fetch** vía `visibleBillsWhere`
  (`/api/bills`, rails, `getBillView`→null→404); `BILL_STATUSES` sin DELETED. "Delete Bill" en el create
  (Options dropdown / footer, solo drafts) → reset store + `/main`. **New Bill** resetea el store.
- Gotcha: importar el **valor** `BillStatus` en `lib/bills` (que usan componentes cliente) arrastraba el
  runtime de Prisma al bundle → se dejó import **type-only** + string literal `"DELETED"`.
- Verificado a nivel DB/lógica: helpers (original no marcado, dup→number, blank/vendor≠ null), soft-delete
  oculto de fetch/tab, `/api/bills` no lo devuelve.

### Validación server-side de `saveDraft` (en curso, sin commitear)
- `lib/bill-draft-input.ts`: schema Zod para el payload de `saveDraft` — valida **bounds/tipos/enums/
  formatos** (no required-ness: el draft puede ser parcial; lo required va en Confirm). El blob PDF se valida
  aparte (tamaño `MAX_FILE_BYTES` + magic bytes `%PDF-`). `saveDraft` rechaza payloads abusivos con detalle.
