import { MedusaError } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import { EXTERNAL_PAYMENT_PROVIDER_ID, EXTERNAL_REFUND_SOURCE } from "../../../types"

type RefundRow = {
  id: string
  amount: unknown
  note?: string | null
  metadata?: Record<string, unknown> | null
  created_at?: string | Date | null
}

export type BuildRefundRequestedEventStepInput = {
  payment?: {
    id: string
    provider_id: string
    currency_code: string
    payment_collection_id?: string | null
    refunds?: (RefundRow | null)[] | null
  } | null
  order_id?: string | null
}

export type RefundRequestedEventData = {
  order_id: string
  payment_id: string
  refund_id: string
  amount: number
  currency_code: string
  note: string | null
}

export const buildRefundRequestedEventStepId = "build-refund-requested-event"

/**
 * Picks the newest refund on an external-provider payment that did not come
 * from Magento itself. Returns an empty list when there is nothing to forward.
 */
export const buildRefundRequestedEventStep = createStep(
  buildRefundRequestedEventStepId,
  async (input: BuildRefundRequestedEventStepInput) => {
    const payment = input.payment
    if (!payment || payment.provider_id !== EXTERNAL_PAYMENT_PROVIDER_ID) {
      return new StepResponse<RefundRequestedEventData[]>([])
    }
    if (!input.order_id) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Payment ${payment.id} is not attached to an order`
      )
    }

    const newest = (payment.refunds ?? [])
      .filter((r): r is RefundRow => !!r)
      .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())[0]

    if (!newest || newest.metadata?.source === EXTERNAL_REFUND_SOURCE) {
      return new StepResponse<RefundRequestedEventData[]>([])
    }

    return new StepResponse<RefundRequestedEventData[]>([
      {
        order_id: input.order_id,
        payment_id: payment.id,
        refund_id: newest.id,
        amount: Number(newest.amount),
        currency_code: payment.currency_code,
        note: newest.note ?? null,
      },
    ])
  }
)
