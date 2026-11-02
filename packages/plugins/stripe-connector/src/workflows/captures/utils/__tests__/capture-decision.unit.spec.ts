import { decideCapture } from "../capture-decision"

const DAY = 24 * 3600 * 1000
const now = new Date("2026-10-22T10:00:00Z")

const base = {
  authorized_amount: 280,
  authorized_at: new Date(now.getTime() - DAY),
  now,
  capture_before_acceptance: false,
  required_fulfillment_status: "fulfilled" as const,
  authorization_window_ms: 7 * DAY,
  safety_buffer_ms: DAY,
}

const order = (id: string, fulfillment_status: string, status = "pending") => ({
  id,
  status,
  canceled_at: status === "canceled" ? now : null,
  fulfillment_status,
  total: id === "a" ? 180 : 100,
})

describe("decideCapture", () => {
  it("waits while an order is undecided", () => {
    const decision = decideCapture({ ...base, orders: [order("a", "fulfilled"), order("b", "not_fulfilled")] })
    expect(decision.action).toBe("wait")
    expect(decision.orders_decided).toBe(1)
  })

  it("captures the full amount once every order is fulfilled", () => {
    const decision = decideCapture({ ...base, orders: [order("a", "fulfilled"), order("b", "shipped")] })
    expect(decision.action).toBe("capture")
    expect(Number(decision.capturable_amount)).toBe(280)
  })

  it("deducts canceled orders from the capture", () => {
    const decision = decideCapture({ ...base, orders: [order("a", "fulfilled"), order("b", "not_fulfilled", "canceled")] })
    expect(decision.action).toBe("capture")
    expect(Number(decision.capturable_amount)).toBe(180)
  })

  it("cancels when every order is canceled", () => {
    const decision = decideCapture({ ...base, orders: [order("a", "not_fulfilled", "canceled"), order("b", "not_fulfilled", "canceled")] })
    expect(decision.action).toBe("cancel")
  })

  it("captures on acceptance alone when configured", () => {
    const decision = decideCapture({
      ...base,
      capture_before_acceptance: true,
      orders: [{ ...order("a", "not_fulfilled"), accepted: true }, { ...order("b", "not_fulfilled"), accepted: null }],
    })
    expect(decision.action).toBe("capture")
  })

  it("captures what is decided once inside the safety buffer", () => {
    const decision = decideCapture({
      ...base,
      authorized_at: new Date(now.getTime() - 6.5 * DAY),
      orders: [order("a", "fulfilled"), order("b", "not_fulfilled")],
    })
    expect(decision.action).toBe("capture")
    expect(decision.past_safety_buffer).toBe(true)
  })

  it("reports an expired authorization", () => {
    const decision = decideCapture({
      ...base,
      authorized_at: new Date(now.getTime() - 8 * DAY),
      orders: [order("a", "fulfilled")],
    })
    expect(decision.action).toBe("expired")
  })
})
