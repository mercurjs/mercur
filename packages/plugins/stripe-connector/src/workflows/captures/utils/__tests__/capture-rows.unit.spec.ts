import { CaptureDTO, CaptureStatus } from "../../../../types/common"
import { CaptureDecision } from "../capture-decision"
import { captureStatusFor, planCaptureSync } from "../capture-rows"

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

describe("planCaptureSync", () => {
  const row = (order_group_id: string, status: CaptureStatus) => ({
    order_group_id,
    payment_collection_id: `pc_${order_group_id}`,
    payment_id: `pay_${order_group_id}`,
    currency_code: "eur",
    authorized_amount: 100,
    capturable_amount: 100,
    orders_total: 1,
    orders_decided: 1,
    status,
    authorized_at: null,
    expires_at: null,
  })
  const existing = (order_group_id: string, status: CaptureStatus, status_reason: string | null = null) =>
    ({ ...row(order_group_id, status), id: `scap_${order_group_id}`, status_reason }) as unknown as CaptureDTO

  it("creates unseen groups and refreshes known ones, keeping a failure visible", () => {
    const plan = planCaptureSync(
      [row("og_new", CaptureStatus.PENDING), row("og_failed", CaptureStatus.READY), row("og_ok", CaptureStatus.CAPTURED)],
      [existing("og_failed", CaptureStatus.FAILED, "card_declined"), existing("og_ok", CaptureStatus.READY)]
    )
    expect(plan.create.map((r) => r.order_group_id)).toEqual(["og_new"])
    expect(plan.update).toEqual([
      expect.objectContaining({ id: "scap_og_failed", status: CaptureStatus.FAILED, status_reason: "card_declined" }),
      expect.objectContaining({ id: "scap_og_ok", status: CaptureStatus.CAPTURED, status_reason: null }),
    ])
  })
})
