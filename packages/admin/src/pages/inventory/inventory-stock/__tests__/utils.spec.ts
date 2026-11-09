import { describe, expect, test } from "vitest"

import {
  StockGridItem,
  StockGridLocation,
  getOfferTitle,
  isForeignLocation,
  scopeLocationsToItems,
} from "../utils"

const item = (overrides: Partial<StockGridItem>): StockGridItem =>
  ({ id: "iitem_1", ...overrides }) as StockGridItem

const location = (id: string, sellerId?: string): StockGridLocation =>
  ({ id, name: id, seller: sellerId ? { id: sellerId } : null }) as StockGridLocation

const urbanStep = location("sloc_urban", "sel_urban")
const peakPace = location("sloc_peak", "sel_peak")
const kickz = location("sloc_kickz", "sel_kickz")
const platform = location("sloc_platform")

const boots = item({ id: "iitem_boots", seller: { id: "sel_urban" } })
const offerItem = item({
  id: "iitem_offer",
  offers: [
    {
      seller_id: "sel_peak",
      product_variant: { product: { title: "Apex Cloud Runner" } },
    },
  ],
})
const orphan = item({ id: "iitem_orphan" })

describe("isForeignLocation", () => {
  test("a location owned by another store is foreign", () => {
    expect(isForeignLocation(boots, kickz)).toBe(true)
    expect(isForeignLocation(boots, peakPace)).toBe(true)
    expect(isForeignLocation(offerItem, urbanStep)).toBe(true)
  })

  test("the item's own store locations are not foreign", () => {
    expect(isForeignLocation(boots, urbanStep)).toBe(false)
    expect(isForeignLocation(offerItem, peakPace)).toBe(false)
  })

  test("locations without a store are never foreign", () => {
    expect(isForeignLocation(boots, platform)).toBe(false)
  })

  test("items without a store can be stocked anywhere", () => {
    expect(isForeignLocation(orphan, kickz)).toBe(false)
  })
})

describe("scopeLocationsToItems", () => {
  test("keeps the union of the selected items' store locations", () => {
    const scoped = scopeLocationsToItems(
      [boots, offerItem],
      [urbanStep, peakPace, kickz, platform]
    )

    expect(scoped.map((l) => l.id)).toEqual(["sloc_urban", "sloc_peak"])
  })

  test("includes locations of an item linked to a store without offers", () => {
    const scoped = scopeLocationsToItems([boots], [urbanStep, kickz])

    expect(scoped.map((l) => l.id)).toEqual(["sloc_urban"])
  })
})

describe("getOfferTitle", () => {
  test("reads the offer's product title", () => {
    expect(getOfferTitle(offerItem)).toBe("Apex Cloud Runner")
    expect(getOfferTitle(boots)).toBeUndefined()
  })
})
