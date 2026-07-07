import { useMemo } from "react"
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table"
import type { CustomColumn, SectionAction } from "@mercurjs/dashboard-sdk"

import { useExtension } from "./context"

function columnId<TData>(col: ColumnDef<TData, unknown>): string | undefined {
  return (
    (col as { id?: string }).id ??
    (col as { accessorKey?: string }).accessorKey
  )
}

export type UseExtendableTableProps<TData> = {
  /** Model whose custom-fields `list` block extends this table (e.g. `product`). */
  model: string
  /** Base columns to extend. */
  columns: ColumnDef<TData, unknown>[]
}

export type ExtendableTable<TData> = {
  /** Base columns with custom override/add/hide/order applied. */
  columns: ColumnDef<TData, unknown>[]
  /** Extra list filters contributed by custom-fields configs. */
  filters: unknown[]
  /** Extra multi-select bulk actions (rank-sorted). */
  bulkActions: SectionAction[]
}

/**
 * Applies a model's custom-fields `list` block to a table's base columns —
 * mirrors `useExtendableForm` for tables. A `columns[]` entry whose `id` matches
 * a base column **overrides** it (custom header/cell), an unknown `id` **adds** a
 * column, `viewDefaults.columnVisibility[id] === false` **hides** it, and
 * `viewDefaults.columnOrder` reorders. Also surfaces the config's `filters` and
 * `bulkActions` for the caller to render.
 */
export function useExtendableTable<TData>({
  model,
  columns: baseColumns,
}: UseExtendableTableProps<TData>): ExtendableTable<TData> {
  const ext = useExtension().getListExtension(model)

  return useMemo(() => {
    const helper = createColumnHelper<TData>()
    const build = (c: CustomColumn): ColumnDef<TData, unknown> =>
      helper.display({
        id: c.id,
        header: () => c.header ?? c.id,
        cell: ({ row }) => {
          const Comp = c.component
          if (!Comp) return null
          const value = (row.original as Record<string, unknown>)?.[c.id]
          return <Comp row={row.original} value={value} />
        },
      }) as ColumnDef<TData, unknown>

    const overrides = new Map((ext.columns ?? []).map((c) => [c.id, c]))

    // override in place (preserve base position)
    let columns: ColumnDef<TData, unknown>[] = baseColumns.map((col) => {
      const id = columnId(col)
      const o = id ? overrides.get(id) : undefined
      return o ? build(o) : col
    })

    // add columns whose id matches no base column
    const baseIds = new Set(baseColumns.map(columnId))
    for (const c of ext.columns ?? []) {
      if (!baseIds.has(c.id)) columns.push(build(c))
    }

    // hide (viewDefaults.columnVisibility[id] === false)
    const visibility = ext.viewDefaults?.columnVisibility ?? {}
    columns = columns.filter((c) => visibility[columnId(c) ?? ""] !== false)

    // reorder (viewDefaults.columnOrder); unlisted keep relative order after
    const order = ext.viewDefaults?.columnOrder
    if (order?.length) {
      const rank = new Map(order.map((id, i) => [id, i]))
      columns = columns
        .map((c, i) => ({ c, i }))
        .sort((a, b) => {
          const ra = rank.get(columnId(a.c) ?? "") ?? Number.MAX_SAFE_INTEGER
          const rb = rank.get(columnId(b.c) ?? "") ?? Number.MAX_SAFE_INTEGER
          return ra - rb || a.i - b.i
        })
        .map(({ c }) => c)
    }

    return {
      columns,
      filters: ext.filters ?? [],
      bulkActions: ext.bulkActions ?? [],
    }
  }, [baseColumns, ext])
}
