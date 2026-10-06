import { describe, expect, test } from "vitest"

import { mergeListFilters } from "./list-filters"

type Filter = { key: string; label: string; type: "select" | "string" | "date" }

const base: Filter[] = [
  { key: "customer_id", label: "Customer", type: "select" },
  { key: "status", label: "Status", type: "select" },
  { key: "created_at", label: "Created", type: "date" },
]

describe("mergeListFilters", () => {
  test("returns the built-in filters untouched without extensions", () => {
    expect(mergeListFilters(base, [])).toBe(base)
  })

  test("appends filters whose key is unknown", () => {
    const merged = mergeListFilters(base, [
      { key: "erp_id", label: "ERP id", type: "string" },
    ])

    expect(merged.map((f) => f.key)).toEqual([
      "customer_id",
      "status",
      "created_at",
      "erp_id",
    ])
  })

  test("replaces a built-in filter with the same key in place", () => {
    const merged = mergeListFilters(base, [
      {
        key: "customer_id",
        label: "Customer email",
        type: "select",
        options: [{ label: "a@b.co", value: "cus_1" }],
        searchable: true,
      },
    ])

    expect(merged.map((f) => f.key)).toEqual([
      "customer_id",
      "status",
      "created_at",
    ])
    expect(merged[0]).toMatchObject({ label: "Customer email", searchable: true })
    expect(merged.filter((f) => f.key === "customer_id")).toHaveLength(1)
  })

  test("removes a built-in filter", () => {
    const merged = mergeListFilters(base, [{ key: "status", remove: true }])

    expect(merged.map((f) => f.key)).toEqual(["customer_id", "created_at"])
  })

  test("ignores a removal for a key that is not built in", () => {
    const merged = mergeListFilters(base, [{ key: "nope", remove: true }])

    expect(merged).toEqual(base)
  })
})
