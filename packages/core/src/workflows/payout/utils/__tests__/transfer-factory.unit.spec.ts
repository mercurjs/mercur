import { TransferStatus } from "@mercurjs/types"

import { decideOrderTransfer, decideReversal, fulfillmentReached } from "../transfer-factory"

const order = (overrides: Partial<Parameters<typeof decideOrderTransfer>[0]["order"]> = {}) => ({
  id: "order_1",
  seller_id: "sel_1",
  status: "pending",
  canceled_at: null,
  fulfillment_status: "fulfilled",
  total: 180,
  tax_total: 30,
  currency_code: "eur",
  created_at: new Date("2026-10-21T14:12:00Z"),
  ...overrides,
})

const account = { id: "pacc_1", payouts_enabled: true, ignored: false }
const payment = {
  id: "pay_1",
  provider_id: "pp_stripe-connector_stripe",
  captured: true,
  canceled: false,
  fully_refunded: false,
  data: { id: "pi_1", latest_charge: "ch_1" },
}

const base = {
  order: order(),
  account,
  payment,
  commission_total: 18,
  required_fulfillment_status: "fulfilled" as const,
  tax_split: false,
}

describe("decideOrderTransfer", () => {
  it("holds when the seller has no account", () => {
    const decision = decideOrderTransfer({ ...base, account: null })
    expect(decision.status).toBe(TransferStatus.ON_HOLD)
    expect(decision.status_reason).toBe("Cannot find payout account for seller sel_1")
  })

  it("holds when payouts are disabled on the account", () => {
    const decision = decideOrderTransfer({ ...base, account: { ...account, payouts_enabled: false } })
    expect(decision.status).toBe(TransferStatus.ON_HOLD)
  })

  it("ignores an ignored seller", () => {
    const decision = decideOrderTransfer({ ...base, account: { ...account, ignored: true } })
    expect(decision.status).toBe(TransferStatus.IGNORED)
    expect(decision.status_reason).toBe("Seller sel_1 is ignored")
  })

  it("aborts a canceled order", () => {
    const decision = decideOrderTransfer({ ...base, order: order({ status: "canceled" }) })
    expect(decision.status).toBe(TransferStatus.ABORTED)
    expect(decision.status_reason).toBe("Order cannot be processed, status is canceled")
  })

  it("holds an order below the required fulfillment status", () => {
    const decision = decideOrderTransfer({ ...base, order: order({ fulfillment_status: "partially_fulfilled" }) })
    expect(decision.status).toBe(TransferStatus.ON_HOLD)
    expect(decision.status_reason).toBe("Order is not ready yet, status is partially_fulfilled")
  })

  it("holds an authorized but uncaptured payment", () => {
    const decision = decideOrderTransfer({ ...base, payment: { ...payment, captured: false } })
    expect(decision.status).toBe(TransferStatus.ON_HOLD)
    expect(decision.status_reason).toBe("Payment pay_1 is not ready yet, status is authorized")
  })

  it("aborts a canceled or fully refunded payment", () => {
    expect(decideOrderTransfer({ ...base, payment: { ...payment, canceled: true } }).status).toBe(TransferStatus.ABORTED)
    expect(decideOrderTransfer({ ...base, payment: { ...payment, fully_refunded: true } }).status).toBe(TransferStatus.ABORTED)
  })

  it("aborts when total minus commission is not positive", () => {
    const decision = decideOrderTransfer({ ...base, commission_total: 180 })
    expect(decision.status).toBe(TransferStatus.ABORTED)
    expect(decision.status_reason).toBe("Amount must be positive, input was: 0")
  })

  it("is pending for total minus commission", () => {
    const decision = decideOrderTransfer(base)
    expect(decision.status).toBe(TransferStatus.PENDING)
    expect(Number(decision.amount)).toBe(162)
    expect(Number(decision.tax_amount)).toBe(0)
  })

  it("splits the tax total out when tax split is on", () => {
    const decision = decideOrderTransfer({ ...base, tax_split: true })
    expect(Number(decision.amount)).toBe(132)
    expect(Number(decision.tax_amount)).toBe(30)
  })
})

describe("fulfillmentReached", () => {
  it("walks the ordered scale and never counts canceled", () => {
    expect(fulfillmentReached("shipped", "fulfilled")).toBe(true)
    expect(fulfillmentReached("not_fulfilled", "fulfilled")).toBe(false)
    expect(fulfillmentReached("canceled", "not_fulfilled")).toBe(false)
  })
})

describe("decideReversal", () => {
  const transfer = { id: "trf_1", status: TransferStatus.CREATED, provider_transfer_id: "tr_1" }

  it("reverses the refund net of its commission share", () => {
    const decision = decideReversal({
      refund_id: "ref_1",
      refund_amount: 60,
      refund_canceled: false,
      order_total: 180,
      commission_total: 18,
      order_transfer: transfer,
    })
    expect(decision.status).toBe(TransferStatus.PENDING)
    expect(Number(decision.amount)).toBe(54)
  })

  it("holds until the order transfer is created", () => {
    const decision = decideReversal({
      refund_id: "ref_1",
      refund_amount: 60,
      refund_canceled: false,
      order_total: 180,
      commission_total: 18,
      order_transfer: { ...transfer, status: TransferStatus.ON_HOLD, provider_transfer_id: null },
    })
    expect(decision.status).toBe(TransferStatus.ON_HOLD)
  })

  it("aborts when the order transfer was aborted", () => {
    const decision = decideReversal({
      refund_id: "ref_1",
      refund_amount: 60,
      refund_canceled: false,
      order_total: 180,
      commission_total: 18,
      order_transfer: { ...transfer, status: TransferStatus.ABORTED },
    })
    expect(decision.status).toBe(TransferStatus.ABORTED)
    expect(decision.status_reason).toBe("Refund ref_1 has been aborted")
  })
})
