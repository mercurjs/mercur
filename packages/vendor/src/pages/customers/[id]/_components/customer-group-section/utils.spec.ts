import { HttpTypes } from "@medusajs/types"
import { describe, expect, test } from "vitest"

import { filterAndSortCustomerGroups } from "./utils"

const group = (
  partial: Partial<HttpTypes.AdminCustomerGroup>
): HttpTypes.AdminCustomerGroup =>
  ({
    id: partial.name ?? "id",
    ...partial,
  }) as HttpTypes.AdminCustomerGroup

const groups = [
  group({ name: "VIP Customers", created_at: "2025-05-03" }),
  group({ name: "B2B Customers", created_at: "2025-05-01" }),
  group({ name: "Wholesale", created_at: "2025-05-02" }),
]

describe("filterAndSortCustomerGroups", () => {
  // MER-205: the section rendered customer.groups in insertion order with no
  // default sort. It should default to sorting by name ascending.
  test("defaults to sorting by name ascending", () => {
    const result = filterAndSortCustomerGroups(groups)

    expect(result.map((g) => g.name)).toEqual([
      "B2B Customers",
      "VIP Customers",
      "Wholesale",
    ])
  })

  test("sorts by name descending when order is -name", () => {
    const result = filterAndSortCustomerGroups(groups, { order: "-name" })

    expect(result.map((g) => g.name)).toEqual([
      "Wholesale",
      "VIP Customers",
      "B2B Customers",
    ])
  })

  test("sorts by an alternate key such as created_at", () => {
    const result = filterAndSortCustomerGroups(groups, { order: "created_at" })

    expect(result.map((g) => g.name)).toEqual([
      "B2B Customers",
      "Wholesale",
      "VIP Customers",
    ])
  })

  // MER-207: the search box updated the URL but never filtered the rows.
  test("filters by name case-insensitively on the search query", () => {
    const result = filterAndSortCustomerGroups(groups, { q: "customers" })

    expect(result.map((g) => g.name)).toEqual([
      "B2B Customers",
      "VIP Customers",
    ])
  })

  test("trims the search query and returns nothing when no group matches", () => {
    expect(filterAndSortCustomerGroups(groups, { q: "  nope  " })).toEqual([])
  })

  test("does not mutate the input array", () => {
    const input = [...groups]
    filterAndSortCustomerGroups(input)

    expect(input.map((g) => g.name)).toEqual([
      "VIP Customers",
      "B2B Customers",
      "Wholesale",
    ])
  })
})
