import { describe, expect, test } from "vitest"

import { ExtensionRegistry } from "./registry"
import { resolveBuiltInFieldDefault } from "./use-built-in-field-defaults"

const scope = {
  model: "offer",
  zone: "create",
  tab: "stockLevelsAndPrices",
  exactTab: true,
}

const registry = new ExtensionRegistry({
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
                defaultValue: async () => "sp_digital",
              },
              condition: { validation: {}, defaultValue: "cond_new" },
              leadtime_to_ship: {
                validation: {},
                defaultValue: async () => {
                  throw new Error("offline")
                },
              },
              sku: null,
            },
          },
        ],
      },
    ],
  },
})

describe("resolveBuiltInFieldDefault", () => {
  test("awaits an async default", async () => {
    await expect(
      resolveBuiltInFieldDefault(registry, scope, "shipping_profile")
    ).resolves.toEqual("sp_digital")
  })

  test("returns a static default", async () => {
    await expect(
      resolveBuiltInFieldDefault(registry, scope, "condition")
    ).resolves.toEqual("cond_new")
  })

  test("a failing resolver yields no default", async () => {
    await expect(
      resolveBuiltInFieldDefault(registry, scope, "leadtime_to_ship")
    ).resolves.toBeUndefined()
  })

  test("removed and untouched fields have no default", async () => {
    await expect(resolveBuiltInFieldDefault(registry, scope, "sku")).resolves.toBeUndefined()
    await expect(resolveBuiltInFieldDefault(registry, scope, "title")).resolves.toBeUndefined()
  })
})
