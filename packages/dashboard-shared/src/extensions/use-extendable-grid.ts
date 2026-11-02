import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import type { CustomFormField } from "@mercurjs/dashboard-sdk"

import { useExtension } from "./context"
import type { ExtensionRegistry } from "./registry"

export type GridFieldName<TData> = (context: {
  row: { original: TData }
}) => string | null

export type ExtensionGridColumnArgs<TData> = {
  id: string
  field: CustomFormField
  /** Form path the cell edits; `null` renders it read-only. */
  getFieldName: GridFieldName<TData>
}

export type UseExtendableGridProps<TData> = {
  model: string
  zone: string
  tab?: string
  /** Base data-grid columns (built with the panel's `createDataGridHelper`). */
  columns: ColumnDef<TData, unknown>[]
  /** Base column ids that can't be removed or replaced (e.g. the row title). */
  lockedColumnIds?: string[]
  /**
   * Whether config fields the grid doesn't ship become columns. Off for grids
   * whose rows have nowhere to save `additional_data`.
   */
  allowAdd?: boolean
  /**
   * Form path of a row's entry (e.g. `variants.3`); added fields bind to
   * `<path>.additional_data.<id>`. `null` keeps the row read-only. Omit it
   * together with `allowAdd: false`.
   */
  getRowPath?: (row: TData) => string | null
  /**
   * Builds a grid column for a config field. Panels ship their own DataGrid
   * cells, so the cell rendering stays on the panel side.
   */
  createColumn: (args: ExtensionGridColumnArgs<TData>) => ColumnDef<TData, unknown>
}

const columnId = <TData>(col: ColumnDef<TData, unknown>) =>
  (col as { id?: string }).id

const baseFieldName = <TData>(
  col: ColumnDef<TData, unknown>
): GridFieldName<TData> =>
  (col.meta as { field?: GridFieldName<TData> } | undefined)?.field ??
  (() => null)

type ApplyGridExtensionArgs<TData> = Omit<
  UseExtendableGridProps<TData>,
  "model" | "zone" | "tab"
> & { model: string; zone: string; tab?: string }

export function applyGridExtension<TData>(
  extension: ExtensionRegistry,
  {
    model,
    zone,
    tab,
    columns: baseColumns,
    lockedColumnIds,
    allowAdd = true,
    getRowPath,
    createColumn,
  }: ApplyGridExtensionArgs<TData>
): ColumnDef<TData, unknown>[] {
  const locked = new Set(lockedColumnIds)
  const builtInIds = baseColumns.flatMap((c) => columnId(c) ?? [])

  const columns = baseColumns.flatMap((col) => {
    const id = columnId(col)
    if (!id || locked.has(id)) return [col]
    const { overridden, field } = extension.getFormFieldOverride(
      model,
      zone,
      id,
      tab,
      true
    )
    if (!overridden) return [col]
    if (!field) return []
    return [createColumn({ id, field, getFieldName: baseFieldName(col) })]
  })

  const added = allowAdd
    ? extension.getFormFields(model, zone, tab, builtInIds, true)
    : []
  for (const { name, field } of added) {
    columns.push(
      createColumn({
        id: name,
        field,
        getFieldName: (context) => {
          const path = getRowPath?.(context.row.original) ?? null
          return path ? `${path}.additional_data.${name}` : null
        },
      })
    )
  }

  return columns
}

/**
 * Applies a form tab's `forms[].fields` to a data grid, the way
 * `<ExtendableFormField>` does for a regular form: a base column id + `null`
 * removes the column, a base id + field replaces how it renders (it keeps
 * editing the base column's form path), and any other key appends an editable
 * column bound to the row's `additional_data`.
 */
export function useExtendableGrid<TData>(
  props: UseExtendableGridProps<TData>
): ColumnDef<TData, unknown>[] {
  const extension = useExtension()
  const {
    model,
    zone,
    tab,
    columns,
    lockedColumnIds,
    allowAdd,
    getRowPath,
    createColumn,
  } = props

  return useMemo(
    () =>
      applyGridExtension(extension, {
        model,
        zone,
        tab,
        columns,
        lockedColumnIds,
        allowAdd,
        getRowPath,
        createColumn,
      }),
    [
      extension,
      model,
      zone,
      tab,
      columns,
      lockedColumnIds,
      allowAdd,
      getRowPath,
      createColumn,
    ]
  )
}
