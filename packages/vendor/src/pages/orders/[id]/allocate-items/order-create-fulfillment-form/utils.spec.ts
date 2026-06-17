import { describe, expect, test } from "vitest"

import { buildAllocationPayload, getAllocatableItems } from "./utils"

type TestItem = {
  id: string
  quantity: number
  detail?: { fulfilled_quantity?: number | null } | null
  offer?: { inventory_item_link?: unknown[] | null } | null
}

const inventoryManaged = (
  over: Partial<TestItem> & { id: string }
): TestItem => ({
  quantity: 1,
  detail: { fulfilled_quantity: 0 },
  offer: { inventory_item_link: [{ inventory_item_id: "iitem_x" }] },
  ...over,
})

describe("getAllocatableItems", () => {
  test("keeps inventory-managed, unfulfilled, unreserved items", () => {
    const item = inventoryManaged({ id: "li_1" })
    expect(getAllocatableItems([item], [])).toEqual([item])
  })

  test("drops items without an offer inventory link", () => {
    const item: TestItem = {
      id: "li_1",
      quantity: 1,
      detail: { fulfilled_quantity: 0 },
      offer: { inventory_item_link: [] },
    }
    expect(getAllocatableItems([item], [])).toEqual([])
  })

  test("drops fully fulfilled items", () => {
    const item = inventoryManaged({
      id: "li_1",
      quantity: 2,
      detail: { fulfilled_quantity: 2 },
    })
    expect(getAllocatableItems([item], [])).toEqual([])
  })

  // MER-187: the form must not re-offer (and re-reserve) an item that already
  // has a reservation — doing so created duplicate reservations and truncated
  // the newly added item out of the order summary's reservation query.
  test("drops items that already have a reservation", () => {
    const item = inventoryManaged({ id: "li_1" })
    expect(getAllocatableItems([item], [{ line_item_id: "li_1" }])).toEqual([])
  })

  test("keeps only the newly added (unreserved) item when another is reserved", () => {
    const reserved = inventoryManaged({ id: "li_existing" })
    const added = inventoryManaged({ id: "li_added" })

    expect(
      getAllocatableItems([reserved, added], [{ line_item_id: "li_existing" }])
    ).toEqual([added])
  })

  test("ignores reservations with no line item id", () => {
    const item = inventoryManaged({ id: "li_1" })
    expect(getAllocatableItems([item], [{ line_item_id: null }])).toEqual([item])
  })
})

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
