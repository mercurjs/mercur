import { describe, expect, test } from "vitest"

import { CreateProductVariantSchema } from "./constants"

describe("CreateProductVariantSchema", () => {
  test("rejects an empty title", () => {
    const result = CreateProductVariantSchema.safeParse({
      title: "",
      sku: "",
      options: {},
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.join(".") === "title")).toBe(
        true
      )
    }
  })

  test("rejects an unselected variant option", () => {
    const result = CreateProductVariantSchema.safeParse({
      title: "XS / Green",
      options: { size: "XS", color: "" },
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path.join(".") === "options.color")
      ).toBe(true)
    }
  })

  test("accepts a valid payload with every option selected", () => {
    const result = CreateProductVariantSchema.safeParse({
      title: "XS / Green",
      sku: "SKU-1",
      options: { size: "XS", color: "Green" },
    })

    expect(result.success).toBe(true)
  })

  test("accepts a variant with no options", () => {
    const result = CreateProductVariantSchema.safeParse({
      title: "Default variant",
      options: {},
    })

    expect(result.success).toBe(true)
  })
})
