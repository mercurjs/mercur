import {
  THIRTY_SECONDS,
  THREE_DAYS,
  TWO_MINUTES,
} from "../complete-cart-with-split-orders"

// acquireLockStep timeout/ttl and the workflow retentionTime are seconds. A
// millisecond value turns a 30 s lock wait into 8 hours and keeps every
// checkout execution for years.
describe("completeCartWithSplitOrdersWorkflow lock settings", () => {
  it("expresses lock timeout, ttl and retention in seconds", () => {
    expect(THIRTY_SECONDS).toBe(30)
    expect(TWO_MINUTES).toBe(120)
    expect(THREE_DAYS).toBe(259_200)
  })
})
