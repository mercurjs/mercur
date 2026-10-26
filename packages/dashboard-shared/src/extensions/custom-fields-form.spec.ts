import { describe, expect, test } from "vitest"
import { z } from "zod"

import {
  buildScopedAdditionalData,
  refineAdditionalData,
} from "./custom-fields-form"
import { ExtensionRegistry } from "./registry"

describe("buildScopedAdditionalData", () => {
  const registry = new ExtensionRegistry({
    customFields: {
      configs: [
        {
          model: "product",
          forms: [
            {
              zone: "create",
              fields: {
                erp_id: { validation: z.string(), defaultValue: "ERP" },
                title: null,
              },
            },
            {
              zone: "create",
              tab: "organize",
              fields: { season: { validation: z.string().optional() } },
            },
            {
              zone: "create",
              tab: "variants",
              fields: {
                barcode: {
                  validation: z.string(),
                  defaultValue: (data: unknown) => (data as { sku: string }).sku,
                },
              },
            },
          ],
        },
      ],
    },
  })

  test("a tabbed form collects its tabs plus untabbed fields, minus built-ins", () => {
    const { schema, defaults } = buildScopedAdditionalData(registry, {
      model: "product",
      zone: "create",
      tabs: ["details", "organize"],
      builtInFieldIds: ["title"],
    })
    expect(Object.keys(schema.shape).sort()).toEqual(["erp_id", "season"])
    expect(defaults).toEqual({ erp_id: "ERP" })
  })

  test("a grid tab describes one row and resolves defaults from it", () => {
    const { schema, defaults } = buildScopedAdditionalData(
      registry,
      { model: "product", zone: "create", tabs: ["variants"], exactTab: true },
      { sku: "SKU-1" }
    )
    expect(Object.keys(schema.shape)).toEqual(["barcode"])
    expect(defaults).toEqual({ barcode: "SKU-1" })
  })

  test("refineAdditionalData reports form and row errors in place", () => {
    const base = z
      .object({ title: z.string(), variants: z.array(z.object({ create: z.boolean() }).passthrough()) })
      .superRefine(() => {})
    const schema = refineAdditionalData(base, {
      additionalData: z.object({ erp_id: z.string() }),
      rows: {
        path: "variants",
        schema: z.object({ barcode: z.string() }),
        include: (row) => row.create === true,
      },
    })

    const result = schema.safeParse({
      title: "T",
      additional_data: {},
      variants: [{ create: true }, { create: false }],
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues.map((i) => i.path.join("."))).toEqual([
      "additional_data.erp_id",
      "variants.0.additional_data.barcode",
    ])
  })
})
