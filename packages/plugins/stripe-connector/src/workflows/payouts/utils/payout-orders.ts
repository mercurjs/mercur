import { PAYOUT_IGNORED_KEY } from "../../../types/common"

export const PAYOUTS_CHECKPOINT = "transfers"
export const PAYOUTS_BACKLOG_CHECKPOINT = "transfers_backlog"
export const AWAITING_ACCOUNT_CHECKPOINT_PREFIX = "transfers_awaiting_account:"

export const awaitingAccountCheckpoint = (sellerId: string) => `${AWAITING_ACCOUNT_CHECKPOINT_PREFIX}${sellerId}`

export type PayoutOrderRow = {
  id: string
  created_at: Date | string
  seller?: { metadata?: Record<string, unknown> | null } | null
}

export const isIgnoredSeller = (order: PayoutOrderRow) =>
  String(order.seller?.metadata?.[PAYOUT_IGNORED_KEY] ?? "") === "true"

export function eligiblePayoutOrders(...groups: PayoutOrderRow[][]): { order_ids: string[]; ignored: number } {
  const seen = new Set<string>()
  const unique = groups.flat().filter((order) => !seen.has(order.id) && !!seen.add(order.id))
  const eligible = unique.filter((order) => !isIgnoredSeller(order))
  return { order_ids: eligible.map((order) => order.id), ignored: unique.length - eligible.length }
}

export const ordersWithoutPayout = (orderIds: string[], paidOrderIds: (string | null)[]) => {
  const paid = new Set(paidOrderIds)
  return orderIds.filter((id) => !paid.has(id))
}
