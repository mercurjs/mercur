import { describe, expect, test } from "vitest"

import { buildAddExistingAttributesQuery } from "./query"

describe("buildAddExistingAttributesQuery", () => {
  const searchParams = { q: "sole", offset: 0, limit: 20 }

  test("scopes the picker to the product's category and its global attributes", () => {
    expect(
      buildAddExistingAttributesQuery(searchParams, "cat_shoes")
    ).toEqual({
      q: "sole",
      offset: 0,
      limit: 20,
      category_id: "cat_shoes",
      scope: "product",
    })
  })

  test("passes no category filter when the product has no category", () => {
    expect(buildAddExistingAttributesQuery(searchParams, undefined)).toEqual({
      q: "sole",
      offset: 0,
      limit: 20,
      category_id: undefined,
      scope: "product",
    })
  })

  test("does not mutate the table search params", () => {
    const params = { ...searchParams }
    buildAddExistingAttributesQuery(params, "cat_shoes")
    expect(params).toEqual(searchParams)
  })
})
