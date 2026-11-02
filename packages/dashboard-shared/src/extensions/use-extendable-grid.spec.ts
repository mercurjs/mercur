import { describe, expect, test } from "vitest"
import type { CellContext, ColumnDef } from "@tanstack/react-table"

import { ExtensionRegistry } from "./registry"
import { applyGridExtension } from "./use-extendable-grid"

type Row = { id: string; index: number | null }

const column = (id: string, field?: (ctx: CellContext<Row, unknown>) => string | null) =>
  ({ id, meta: { field } }) as ColumnDef<Row, unknown>

const contextFor = (row: Row) => ({ row: { original: row } }) as CellContext<Row, unknown>

describe("applyGridExtension", () => {
  const registry = new ExtensionRegistry({
    customFields: {
      configs: [
        {
          model: "offer",
          forms: [
            { zone: "create", fields: { sku: null, erp_id: { validation: {} } } },
            {
              zone: "create",
              tab: "stockLevelsAndPrices",
              fields: {
                title: null,
                condition: null,
                sku: { validation: {}, type: "text" },
                warranty_months: { validation: {}, type: "number" },
              },
            },
          ],
        },
      ],
    },
  })

  const columns = applyGridExtension<Row>(registry, {
    model: "offer",
    zone: "create",
    tab: "stockLevelsAndPrices",
    columns: [
      column("title"),
      column("sku", (ctx) => `variants.${ctx.row.original.index}.sku`),
      column("condition"),
    ],
    lockedColumnIds: ["title"],
    getRowPath: (row) => (row.index === null ? null : `variants.${row.index}`),
    createColumn: ({ id, getFieldName }) =>
      ({ id, meta: { field: getFieldName, extension: true } }) as ColumnDef<Row, unknown>,
  })

  const fieldOf = (id: string, row: Row) => {
    const meta = columns.find((c) => c.id === id)!.meta as {
      field: (ctx: CellContext<Row, unknown>) => string | null
    }
    return meta.field(contextFor(row))
  }

  test("removes, replaces and appends columns; locked columns stay", () => {
    expect(columns.map((c) => c.id)).toEqual(["title", "sku", "warranty_months"])
    expect((columns[1].meta as { extension?: boolean }).extension).toBe(true)
  })

  test("a replaced column keeps editing the base form path", () => {
    expect(fieldOf("sku", { id: "v", index: 2 })).toEqual("variants.2.sku")
  })

  test("added columns bind to the row's additional_data, read-only without a path", () => {
    expect(fieldOf("warranty_months", { id: "v", index: 1 })).toEqual(
      "variants.1.additional_data.warranty_months"
    )
    expect(fieldOf("warranty_months", { id: "g", index: null })).toBeNull()
  })

  test("untabbed entries of the zone don't reach the grid", () => {
    expect(columns.map((c) => c.id)).not.toContain("erp_id")
  })

  test("allowAdd: false keeps overrides but drops added columns", () => {
    const readOnly = applyGridExtension<Row>(registry, {
      model: "offer",
      zone: "create",
      tab: "stockLevelsAndPrices",
      columns: [column("title"), column("condition")],
      allowAdd: false,
      getRowPath: () => null,
      createColumn: ({ id }) => ({ id }) as ColumnDef<Row, unknown>,
    })
    expect(readOnly.map((c) => c.id)).toEqual([])
  })
})
