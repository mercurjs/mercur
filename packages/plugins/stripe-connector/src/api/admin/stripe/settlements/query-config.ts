const settlementFields = [
  "id",
  "display_id",
  "currency_code",
  "period_start",
  "period_end",
  "payouts_total",
  "reversals_total",
  "adjustments_total",
  "amount",
  "payout_amount",
  "payout_currency_code",
  "status",
  "payout_status",
  "provider_payout_id",
  "status_reason",
  "created_at",
  "updated_at",
]

const lineFields = [
  "lines.id",
  "lines.type",
  "lines.amount",
  "lines.payout_id",
  "lines.payout_reversal_id",
  "lines.adjustment_id",
  "lines.payout.id",
  "lines.payout.status",
  "lines.payout.order_id",
  "lines.payout.data",
  "lines.payout.order.display_id",
  "lines.payout_reversal.id",
  "lines.payout_reversal.status",
  "lines.payout_reversal.refund_id",
  "lines.payout_reversal.data",
  "lines.payout_reversal.payout.order_id",
  "lines.payout_reversal.payout.order.display_id",
  "lines.adjustment.id",
  "lines.adjustment.type",
  "lines.adjustment.amount",
  "lines.adjustment.reason",
  "lines.adjustment.status",
  "lines.adjustment.provider_transfer_id",
]

const sellerFields = ["payout_account.id", "payout_account.seller.id", "payout_account.seller.name", "payout_account.seller.handle"]

export const adminSettlementQueryConfig = {
  list: {
    defaults: [...settlementFields, "account_id", ...sellerFields],
    isList: true,
    defaultLimit: 20,
    defaultOrder: { period_end: "DESC" },
  },
  retrieve: {
    defaults: [...settlementFields, "account_id", "data", ...sellerFields, ...lineFields, "lines.adjustment.created_by"],
    isList: false,
  },
}

export const vendorSettlementQueryConfig = {
  list: {
    defaults: settlementFields,
    allowed: settlementFields,
    isList: true,
    defaultLimit: 20,
    defaultOrder: { period_end: "DESC" },
  },
  retrieve: {
    defaults: [...settlementFields, ...lineFields],
    allowed: [...settlementFields, ...lineFields],
    isList: false,
  },
}
