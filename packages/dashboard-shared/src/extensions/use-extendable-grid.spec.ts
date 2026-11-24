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

  test("allowAdd: false keeps overrides but drops added editable columns", () => {
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

  test("allowAdd: false still adds columns with a component", () => {
    const Payout = () => null
    const componentRegistry = new ExtensionRegistry({
      customFields: {
        configs: [
          {
            model: "offer",
            forms: [
              {
                zone: "pricing",
                fields: {
                  payout: { validation: {}, component: Payout },
                  note: { validation: {}, type: "text" },
                },
              },
            ],
          },
        ],
      },
    })
    const readOnly = applyGridExtension<Row>(componentRegistry, {
      model: "offer",
      zone: "pricing",
      columns: [column("title")],
      allowAdd: false,
      createColumn: ({ id, getFieldName }) =>
        ({ id, meta: { field: getFieldName } }) as ColumnDef<Row, unknown>,
    })
    expect(readOnly.map((c) => c.id)).toEqual(["title", "payout"])
    const meta = readOnly[1].meta as {
      field: (ctx: CellContext<Row, unknown>) => string | null
    }
    expect(meta.field(contextFor({ id: "p", index: 0 }))).toBeNull()
  })

  describe("a grid without a tab", () => {
    const untabbedRegistry = new ExtensionRegistry({
      customFields: {
        configs: [
          {
            model: "offer",
            forms: [
              {
                zone: "pricing",
                fields: { region_prices: null, note: { validation: {}, type: "text" } },
              },
              { zone: "pricing", tab: "other", fields: { title: null } },
            ],
          },
        ],
      },
    })
    const grid = (allowAdd: boolean) =>
      applyGridExtension<Row>(untabbedRegistry, {
        model: "offer",
        zone: "pricing",
        columns: [column("title"), column("prices.eur"), column("region_prices.reg_eu")],
        allowAdd,
        getRowPath: (row) => `prices.${row.index}`,
        createColumn: ({ id }) => ({ id }) as ColumnDef<Row, unknown>,
      }).map((c) => c.id)

    test("untabbed entries of the zone apply", () => {
      expect(grid(true)).toEqual(["title", "prices.eur", "note"])
    })

    test("entries aimed at a tab don't reach it", () => {
      expect(grid(false)).toEqual(["title", "prices.eur"])
    })
  })

  describe("hidden columns and column groups", () => {
    const groupRegistry = new ExtensionRegistry({
      customFields: {
        configs: [
          {
            model: "offer",
            forms: [
              {
                zone: "create",
                tab: "stockLevelsAndPrices",
                fields: {
                  shipping_profile: {
                    validation: {},
                    hidden: true,
                    defaultValue: "sp_digital",
                  },
                  stock_locations: null,
                  "stock_locations.sloc_keep": { validation: {}, type: "number" },
                  internal_note: { validation: {}, hidden: true },
                },
              },
            ],
          },
        ],
      },
    })

    const grouped = applyGridExtension<Row>(groupRegistry, {
      model: "offer",
      zone: "create",
      tab: "stockLevelsAndPrices",
      columns: [
        column("title"),
        column("shipping_profile"),
        column("stock_locations.sloc_a"),
        column("stock_locations.sloc_keep"),
        column("prices.usd"),
      ],
      lockedColumnIds: ["title"],
      getRowPath: (row) => `variants.${row.index}`,
      createColumn: ({ id }) => ({ id }) as ColumnDef<Row, unknown>,
    })
    const ids = grouped.map((c) => c.id)

    test("a hidden built-in column is dropped", () => {
      expect(ids).not.toContain("shipping_profile")
    })

    test("a group key removes every column of the group", () => {
      expect(ids).not.toContain("stock_locations.sloc_a")
    })

    test("an exact column id beats its group", () => {
      expect(ids).toContain("stock_locations.sloc_keep")
    })

    test("group keys and hidden added fields don't become columns", () => {
      expect(ids).toEqual(["title", "stock_locations.sloc_keep", "prices.usd"])
    })
  })
})
