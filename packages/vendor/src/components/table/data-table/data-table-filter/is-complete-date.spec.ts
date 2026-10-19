import { describe, expect, test } from "vitest"

import { isCompleteDate } from "./is-complete-date"

describe("isCompleteDate", () => {
  test("rejects the intermediate years produced while typing a year", () => {
    for (const year of [2, 20, 202]) {
      const date = new Date(2026, 9, 12)
      date.setFullYear(year)
      expect(isCompleteDate(date)).toBe(false)
    }
  })

  test("accepts a fully typed year", () => {
    expect(isCompleteDate(new Date(2026, 9, 12))).toBe(true)
  })

  test("rejects null and invalid dates", () => {
    expect(isCompleteDate(null)).toBe(false)
    expect(isCompleteDate(new Date("nope"))).toBe(false)
  })
})
