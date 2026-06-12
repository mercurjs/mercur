import { describe, expect, test } from "vitest"

import { buildAllocationPayload } from "./utils"

describe("buildAllocationPayload", () => {
  // MER-187: the allocate form used to report success while reserving nothing
  // whenever the resolved payload was empty.
  test("returns no-items for an empty quantity map (false-success regression)", () => {
    expect(buildAllocationPayload({}, {})).toEqual({
      ok: false,
      reason: "no-items",
    })
  })

  test("returns no-items when every line item is deselected", () => {
    expect(
      buildAllocationPayload({ "li_1-iitem_1": 2 }, { li_1: false })
    ).toEqual({ ok: false, reason: "no-items" })
  })

  test("treats an undefined selection as selected", () => {
    const result = buildAllocationPayload({ "li_1-iitem_1": 2 }, {})

    expect(result).toEqual({
      ok: true,
      items: [{ line_item_id: "li_1", inventory_item_id: "iitem_1", quantity: 2 }],
    })
  })

  test("drops the kit root aggregator key but keeps its inventory rows", () => {
    const result = buildAllocationPayload(
      { "li_1-": 3, "li_1-iitem_1": 2, "li_1-iitem_2": 1 },
      { li_1: true }
    )

    expect(result).toEqual({
      ok: true,
      items: [
        { line_item_id: "li_1", inventory_item_id: "iitem_1", quantity: 2 },
        { line_item_id: "li_1", inventory_item_id: "iitem_2", quantity: 1 },
      ],
    })
  })

  test("rejects empty, zero, and non-numeric quantities", () => {
    expect(buildAllocationPayload({ "li_1-iitem_1": "" }, {}).ok).toBe(false)
    expect(buildAllocationPayload({ "li_1-iitem_1": 0 }, {}).ok).toBe(false)
    expect(buildAllocationPayload({ "li_1-iitem_1": "abc" }, {}).ok).toBe(false)
  })

  test("excludes only the deselected line items", () => {
    const result = buildAllocationPayload(
      { "li_1-iitem_1": 2, "li_2-iitem_2": 5 },
      { li_1: false, li_2: true }
    )

    expect(result).toEqual({
      ok: true,
      items: [{ line_item_id: "li_2", inventory_item_id: "iitem_2", quantity: 5 }],
    })
  })

  test("coerces numeric strings to numbers", () => {
    expect(buildAllocationPayload({ "li_1-iitem_1": "3" }, {})).toEqual({
      ok: true,
      items: [{ line_item_id: "li_1", inventory_item_id: "iitem_1", quantity: 3 }],
    })
  })
})
