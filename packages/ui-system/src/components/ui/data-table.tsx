"use client"

import * as React from "react"
import {
  type ColumnDef,
  type RowData,
  type RowSelectionState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { cn } from "../../lib/utils"
import { Checkbox } from "./checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table"
import { Skeleton } from "./skeleton"

declare module "@tanstack/react-table" {
  // Per-column styling: applied to the header cell and every body cell.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string
  }
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  /** Adds a leading checkbox column and enables row selection. */
  selectable?: boolean
  /**
   * Optional row grouping. When set, a full-width section header row is inserted
   * whenever the group `key` changes as rows are rendered. The consumer must
   * order `data` so each group is contiguous. `icon` is rendered before the label.
   */
  groupBy?: (row: TData) => {
    key: string
    label: string
    icon?: React.ReactNode
  }
  /** Render skeleton placeholder rows instead of data (initial load). */
  loading?: boolean
  /** How many skeleton rows to show while `loading` (default 5). */
  loadingRows?: number
}

function DataTable<TData, TValue>({
  columns,
  data,
  selectable = false,
  groupBy,
  loading = false,
  loadingRows = 5,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})

  const tableColumns = React.useMemo<ColumnDef<TData, TValue>[]>(() => {
    if (!selectable) return columns
    const selectColumn: ColumnDef<TData, TValue> = {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) =>
            table.toggleAllPageRowsSelected(!!value)
          }
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    }
    return [selectColumn, ...columns]
  }, [selectable, columns])

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { sorting, rowSelection },
    enableRowSelection: selectable,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const rows = table.getRowModel().rows

  // Group the rendered rows into ordered sections (Overview). Order follows
  // first appearance; the consumer pre-sorts so each group is contiguous. The
  // Row objects are kept so the section checkbox can toggle just its group.
  type RowGroup = {
    key: string
    label: string
    icon?: React.ReactNode
    rows: typeof rows
  }
  const groups: RowGroup[] = []
  if (groupBy) {
    const byKey = new Map<string, RowGroup>()
    for (const row of rows) {
      const { key, label, icon } = groupBy(row.original)
      let group = byKey.get(key)
      if (!group) {
        group = { key, label, icon, rows: [] }
        byKey.set(key, group)
        groups.push(group)
      }
      group.rows.push(row)
    }
  }

  const renderRow = (row: (typeof rows)[number]) => (
    <TableRow
      key={row.id}
      data-state={row.getIsSelected() ? "selected" : undefined}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell
          key={cell.id}
          className={cn(cell.column.columnDef.meta?.className)}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )

  const renderGroupHeader = (group: RowGroup) => {
    const allSelected =
      group.rows.length > 0 && group.rows.every((r) => r.getIsSelected())
    const someSelected = group.rows.some((r) => r.getIsSelected())
    return (
      <TableRow key={`group-${group.key}`} className="hover:bg-transparent">
        {selectable ? (
          <TableCell className="h-14 bg-muted/40">
            <Checkbox
              checked={allSelected ? true : someSelected ? "indeterminate" : false}
              onCheckedChange={(value) =>
                group.rows.forEach((r) => r.toggleSelected(!!value))
              }
              aria-label={`Select all in ${group.label}`}
            />
          </TableCell>
        ) : null}
        <TableCell
          colSpan={tableColumns.length - (selectable ? 1 : 0)}
          className="h-14 bg-muted/40 text-xs font-medium tracking-wide text-muted-foreground uppercase"
        >
          <span className="flex items-center gap-2">
            {group.icon ? (
              <span className="flex shrink-0 items-center [&_svg]:size-4">
                {group.icon}
              </span>
            ) : null}
            {group.label}
            <span className="text-muted-foreground/60 tabular-nums">
              {group.rows.length}
            </span>
          </span>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead
                key={header.id}
                className={cn(header.column.columnDef.meta?.className)}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {loading ? (
          Array.from({ length: loadingRows }).map((_, r) => (
            <TableRow key={`skeleton-${r}`} className="hover:bg-transparent">
              {tableColumns.map((column, c) => (
                <TableCell key={column.id ?? c} className="h-14">
                  {selectable && c === 0 ? (
                    <Skeleton className="size-4 rounded-[4px]" />
                  ) : (
                    <Skeleton className="h-4 w-full max-w-[140px]" />
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : rows.length ? (
          groupBy ? (
            groups.map((group) => (
              <React.Fragment key={group.key}>
                {renderGroupHeader(group)}
                {group.rows.map(renderRow)}
              </React.Fragment>
            ))
          ) : (
            rows.map(renderRow)
          )
        ) : (
          <TableRow>
            <TableCell
              colSpan={tableColumns.length}
              className="h-24 text-center text-muted-foreground"
            >
              No results.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}

export { DataTable, type DataTableProps }
