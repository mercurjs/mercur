import { failedOperationNotification, failedOperationNotificationKey } from "../failed-operation"

describe("failed operation notifications", () => {
  it("describes a failed payout with its order, seller and Stripe's message", () => {
    const notification = failedOperationNotification("payout", {
      id: "pout_1",
      display_id: 7,
      order_id: "order_1",
      amount: 4200,
      currency_code: "eur",
      status: "failed",
      status_reason: "provider_error",
      data: { status_detail: "Insufficient funds in Stripe account" },
      account: { id: "pacc_1", seller: { id: "sel_1" } },
    })

    expect(notification).toEqual({
      type: "payout.failed",
      payload: {
        id: "pout_1",
        display_id: 7,
        order_id: "order_1",
        account_id: "pacc_1",
        seller_id: "sel_1",
        amount: 4200,
        currency_code: "eur",
        status_reason: "provider_error",
        status_detail: "Insufficient funds in Stripe account",
      },
    })
  })

  it("takes a reversal's order, currency and seller from its payout", () => {
    const notification = failedOperationNotification("payout_reversal", {
      id: "prev_1",
      payout_id: "pout_1",
      refund_id: "ref_1",
      amount: 500,
      status: "failed",
      status_reason: "provider_error",
      data: null,
      payout: { order_id: "order_1", currency_code: "eur", account: { id: "pacc_1", seller: { id: "sel_1" } } },
    })

    expect(notification?.type).toBe("payout_reversal.failed")
    expect(notification?.payload).toMatchObject({
      order_id: "order_1",
      currency_code: "eur",
      seller_id: "sel_1",
      status_detail: null,
    })
  })

  it("reads a settlement's bank payout status, not the settlement status", () => {
    const row = {
      id: "stl_1",
      display_id: 3,
      account_id: "pacc_1",
      amount: 9000,
      currency_code: "eur",
      status: "failed",
      payout_status: "failed",
      provider_payout_id: "po_1",
      status_reason: "account_closed: The bank account has been closed",
      payout_account: { seller: { id: "sel_1" } },
    }

    expect(failedOperationNotification("settlement", row)?.type).toBe("settlement.payout_failed")
    expect(
      failedOperationNotification("settlement", { ...row, status: "open", payout_status: "on_hold", status_reason: "account_not_ready" })
    ).toBeNull()
  })

  it("notifies a settlement held because the connected balance cannot cover it", () => {
    const row = {
      id: "stl_2",
      display_id: 4,
      account_id: "pacc_1",
      amount: 9000,
      currency_code: "eur",
      status: "failed",
      payout_status: "on_hold",
      provider_payout_id: null,
      status_reason: "insufficient_available_balance",
      payout_account: { seller: { id: "sel_1" } },
    }

    expect(failedOperationNotification("settlement", row)?.payload).toMatchObject({
      id: "stl_2",
      status_reason: "insufficient_available_balance",
    })
  })

  it("skips records that are gone or no longer failed", () => {
    expect(failedOperationNotification("payout", null)).toBeNull()
    expect(failedOperationNotification("payout", { id: "pout_1", status: "paid" })).toBeNull()
  })

  it("keys a settlement failure by its bank payout, so a later failure of a retried payout is new", () => {
    const first = failedOperationNotificationKey({
      type: "settlement.payout_failed",
      payload: { id: "stl_1", provider_payout_id: "po_1" },
    })
    const refused = failedOperationNotificationKey({
      type: "settlement.payout_failed",
      payload: { id: "stl_1", provider_payout_id: null },
    })

    expect(first).toBe("notified:settlement.payout_failed:stl_1:po_1")
    expect(refused).toBe("notified:settlement.payout_failed:stl_1")
    expect(failedOperationNotificationKey({ type: "payout.failed", payload: { id: "pout_1" } })).toBe(
      "notified:payout.failed:pout_1"
    )
  })
})
