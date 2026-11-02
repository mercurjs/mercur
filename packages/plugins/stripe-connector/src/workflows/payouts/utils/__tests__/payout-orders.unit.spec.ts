import { awaitingAccountCheckpoint, eligiblePayoutOrders, ordersWithoutPayout } from "../payout-orders"

const order = (id: string, ignored = false) => ({
  id,
  created_at: "2026-10-20T10:00:00.000Z",
  seller: { metadata: ignored ? { payout_ignored: "true" } : {} },
})

describe("payout order selection", () => {
  it("keeps each order once, in source order, without ignored sellers", () => {
    expect(eligiblePayoutOrders([order("a"), order("b")], [order("b"), order("c", true)], [order("d")])).toEqual({
      order_ids: ["a", "b", "d"],
      ignored: 1,
    })
  })

  it("picks the seller's orders that have no payout yet", () => {
    expect(ordersWithoutPayout(["o1", "o2", "o3"], ["o2", null])).toEqual(["o1", "o3"])
  })

  it("keys the awaiting-account queue per seller", () => {
    expect(awaitingAccountCheckpoint("sel_1")).toBe("transfers_awaiting_account:sel_1")
  })
})
