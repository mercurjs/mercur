import { PayoutStatus } from "@mercurjs/types"

import { INSUFFICIENT_BALANCE_REASON } from "../../../types/common"
import type { NotifyOperatorWorkflowInput } from "../workflows/notify-operator"

type Row = Record<string, unknown> & {
  id: string
  data?: Record<string, unknown> | null
  account?: { id?: string; seller?: { id: string } | null } | null
  payout?: {
    order_id?: string | null
    currency_code?: string
    account?: { id?: string; seller?: { id: string } | null } | null
  } | null
  payout_account?: { seller?: { id: string } | null } | null
}

export const FAILED_OPERATION_TYPE = {
  payout: "payout.failed",
  payout_reversal: "payout_reversal.failed",
  settlement: "settlement.payout_failed",
} as const

/** A settlement's bank payout can fail again after a retry Stripe accepted, which is a new failure. */
export const failedOperationNotificationKey = (notification: NotifyOperatorWorkflowInput) =>
  ["notified", notification.type, notification.payload.id, notification.payload.provider_payout_id]
    .filter((part) => part !== undefined && part !== null)
    .join(":")

const statusDetail = (data: Record<string, unknown> | null | undefined) =>
  typeof data?.status_detail === "string" ? data.status_detail : null

/** The operator notification for a failed record, or null when it is gone or no longer failed. */
export function failedOperationNotification(
  operation: keyof typeof FAILED_OPERATION_TYPE,
  row: Row | null
): NotifyOperatorWorkflowInput | null {
  if (!row) {
    return null
  }

  if (operation === "settlement") {
    // Held for an account that is not ready yet is expected; held because the
    // connected balance cannot cover the bank payout is not.
    const shortBalance = row.payout_status === PayoutStatus.ON_HOLD && row.status_reason === INSUFFICIENT_BALANCE_REASON
    if (row.payout_status !== PayoutStatus.FAILED && !shortBalance) {
      return null
    }
    return {
      type: FAILED_OPERATION_TYPE.settlement,
      payload: {
        id: row.id,
        display_id: row.display_id,
        account_id: row.account_id,
        seller_id: row.payout_account?.seller?.id ?? null,
        amount: row.amount,
        currency_code: row.currency_code,
        period_start: row.period_start,
        period_end: row.period_end,
        provider_payout_id: row.provider_payout_id,
        status_reason: row.status_reason,
      },
    }
  }

  if (row.status !== PayoutStatus.FAILED) {
    return null
  }

  if (operation === "payout_reversal") {
    return {
      type: FAILED_OPERATION_TYPE.payout_reversal,
      payload: {
        id: row.id,
        payout_id: row.payout_id,
        refund_id: row.refund_id,
        order_id: row.payout?.order_id ?? null,
        account_id: row.payout?.account?.id ?? null,
        seller_id: row.payout?.account?.seller?.id ?? null,
        amount: row.amount,
        currency_code: row.payout?.currency_code ?? null,
        status_reason: row.status_reason,
        status_detail: statusDetail(row.data),
      },
    }
  }

  return {
    type: FAILED_OPERATION_TYPE.payout,
    payload: {
      id: row.id,
      display_id: row.display_id,
      order_id: row.order_id,
      account_id: row.account?.id ?? null,
      seller_id: row.account?.seller?.id ?? null,
      amount: row.amount,
      currency_code: row.currency_code,
      status_reason: row.status_reason,
      status_detail: statusDetail(row.data),
    },
  }
}
