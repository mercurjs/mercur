import { describe, expect, it } from "bun:test"

import {
  computeExpectedDelivery,
  resolveTransitDays,
} from "../src/offer/delivery"

describe("computeExpectedDelivery", () => {
  it("adds lead time and transit as business days", () => {
    expect(
      computeExpectedDelivery({
        start: "2026-10-27T10:00:00Z",
        leadtimeDays: 2,
        transitMinDays: 1,
        transitMaxDays: 2,
      })
    ).toEqual({
      shipping_deadline: "2026-10-29",
      earliest: "2026-10-30",
      latest: "2026-11-02",
    })
  })

  it("skips weekends for an order placed on Saturday", () => {
    expect(
      computeExpectedDelivery({
        start: "2026-10-31T09:00:00Z",
        leadtimeDays: 0,
        transitMinDays: 0,
        transitMaxDays: 1,
      })
    ).toEqual({
      shipping_deadline: "2026-11-02",
      earliest: "2026-11-02",
      latest: "2026-11-03",
    })
  })

  it("does not count days the seller is closed", () => {
    expect(
      computeExpectedDelivery({
        start: "2026-10-27T10:00:00Z",
        leadtimeDays: 1,
        transitMinDays: null,
        transitMaxDays: null,
        closure: {
          closed_from: "2026-10-28T00:00:00Z",
          closed_to: "2026-10-29T23:59:59Z",
        },
      })
    ).toEqual({
      shipping_deadline: "2026-10-30",
      earliest: null,
      latest: null,
    })
  })

  it("treats a missing lead time as shipping on the first open day", () => {
    expect(
      computeExpectedDelivery({
        start: "2026-10-27T10:00:00Z",
        leadtimeDays: null,
        transitMinDays: 2,
        transitMaxDays: 2,
      }).latest
    ).toEqual("2026-10-29")
  })
})

describe("resolveTransitDays", () => {
  it("prefers the seller's override over the rule", () => {
    expect(
      resolveTransitDays(
        { transit_min_days: 2, transit_max_days: 4 },
        { transit_min_days: 1, transit_max_days: 3 }
      )
    ).toEqual({ min: 2, max: 4 })
  })

  it("falls back to the rule", () => {
    expect(
      resolveTransitDays(null, { transit_min_days: 1, transit_max_days: 3 })
    ).toEqual({ min: 1, max: 3 })
  })
})
