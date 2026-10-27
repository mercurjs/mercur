import { ColumnDef } from "@tanstack/react-table"
import { FieldPath, FieldValues } from "react-hook-form"

import {
  type ExtensionGridColumnArgs,
  resolveFormFieldType,
} from "@mercurjs/dashboard-shared"

import {
  DataGridBooleanCell,
  DataGridNumberCell,
  DataGridReadOnlyCell,
  DataGridSelectCell,
  DataGridTextCell,
} from "../components"
import { DataGridColumnType } from "../types"
import { createDataGridHelper } from "./create-data-grid-column-helper"

/**
 * Data-grid column for a custom-fields `forms[].fields` entry (see
 * `useExtendableGrid`). A field with a `component` renders read-only with the
 * row as `data`; otherwise the cell edits the field's form path by its type.
 */
export const createDataGridExtensionColumn = <
  TData,
  TFieldValues extends FieldValues,
>({
  id,
  field,
  getFieldName,
}: ExtensionGridColumnArgs<TData>): ColumnDef<TData, unknown> => {
  const helper = createDataGridHelper<TData, TFieldValues>()
  const header = field.label ?? id
  const Component = field.component

  if (Component) {
    return helper.column({
      id,
      name: header,
      header,
      cell: (context) => (
        <DataGridReadOnlyCell context={context}>
          <Component data={context.row.original} />
        </DataGridReadOnlyCell>
      ),
    }) as ColumnDef<TData, unknown>
  }

  const inputType = resolveFormFieldType(field)
  const type: DataGridColumnType = inputType === "textarea" ? "text" : inputType
  const options = field.options ?? []

  return helper.column({
    id,
    name: header,
    header,
    field: (context) =>
      getFieldName(context) as FieldPath<TFieldValues> | null,
    type,
    cell: (context) => {
      if (!getFieldName(context)) {
        return <DataGridReadOnlyCell context={context} />
      }
      switch (type) {
        case "number":
          return (
            <DataGridNumberCell context={context} placeholder={field.placeholder} />
          )
        case "boolean":
          return <DataGridBooleanCell context={context} />
        case "select":
          return (
            <DataGridSelectCell
              context={context}
              options={options}
              placeholder={field.placeholder ?? ""}
            />
          )
        default:
          return <DataGridTextCell context={context} />
      }
    },
  }) as ColumnDef<TData, unknown>
}
