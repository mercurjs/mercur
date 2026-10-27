import { describe, expect, test } from "vitest"

import { getListInitialData } from "./list-initial-data"

const loaderData = { products: [{ id: "prod_1" }], count: 1 }

describe("getListInitialData", () => {
  test("returns the loader data when no query params are set", () => {
    expect(
      getListInitialData({ q: undefined, offset: undefined }, loaderData)
    ).toBe(loaderData)
  })

  test("drops the loader data while searching", () => {
    expect(getListInitialData({ q: "shirt" }, loaderData)).toBeUndefined()
  })

  test("drops the loader data for filters, ordering and pagination", () => {
    expect(getListInitialData({ status: "published" }, loaderData)).toBeUndefined()
    expect(getListInitialData({ order: "title" }, loaderData)).toBeUndefined()
    expect(getListInitialData({ offset: "20" }, loaderData)).toBeUndefined()
  })

  test("treats empty values as unset", () => {
    expect(getListInitialData({ q: "" }, loaderData)).toBe(loaderData)
  })
})
