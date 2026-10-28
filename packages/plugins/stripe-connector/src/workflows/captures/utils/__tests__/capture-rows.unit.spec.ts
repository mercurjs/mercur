import { CaptureStatus } from "../../../../types/common"
import { CaptureDecision } from "../capture-decision"
import { captureStatusFor } from "../capture-rows"

const payment = {
  id: "pay_1",
  amount: 100,
  captured_at: null,
  canceled_at: null,
  created_at: new Date("2026-10-20T10:00:00Z"),
  captures: [],
}

const decision = (action: CaptureDecision["action"]): CaptureDecision => ({
  action,
  capturable_amount: 100,
  orders_decided: 1,
  orders_total: 2,
  expires_at: null,
  past_safety_buffer: false,
})

describe("captureStatusFor", () => {
  it("follows the decision while the payment is only authorized", () => {
    expect(captureStatusFor(payment, decision("wait"))).toBe(CaptureStatus.PENDING)
    expect(captureStatusFor(payment, decision("capture"))).toBe(CaptureStatus.READY)
    expect(captureStatusFor(payment, decision("cancel"))).toBe(CaptureStatus.CANCELABLE)
    expect(captureStatusFor(payment, decision("expired"))).toBe(CaptureStatus.EXPIRED)
  })

  it("closes the row once the payment is captured or canceled, whatever the decision", () => {
    expect(captureStatusFor({ ...payment, captured_at: new Date() }, decision("wait"))).toBe(CaptureStatus.CAPTURED)
    expect(captureStatusFor({ ...payment, captures: [{ amount: 40 }] }, decision("wait"))).toBe(CaptureStatus.CAPTURED)
    expect(captureStatusFor({ ...payment, canceled_at: new Date() }, decision("capture"))).toBe(CaptureStatus.CANCELED)
  })
})
