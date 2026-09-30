import { describe, expect, test } from "vitest"
import { SEARCH_AREA_PERMISSIONS, SEARCH_AREAS } from "../constants"

const UNGATED = ["all", "command", "navigation"]

describe("search area permissions", () => {
  test("every area backed by an API query is gated", () => {
    const ungated = SEARCH_AREAS.filter(
      (area) => !UNGATED.includes(area) && !SEARCH_AREA_PERMISSIONS[area]
    )

    expect(ungated).toEqual([])
  })
})
