import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { getOrderDetailWorkflow } from "@medusajs/medusa/core-flows"
import { WorkflowData, WorkflowResponse, createWorkflow, transform } from "@medusajs/framework/workflows-sdk"
import { MathBN, MedusaError } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import { createPayoutStep } from "../steps"

type CreatePayoutWorkflowInput = {
  order_id: string
}

export const createPayoutWorkflowId = "create-payout"

export const createPayoutWorkflow = createWorkflow(
  createPayoutWorkflowId,
  function (input: WorkflowData<CreatePayoutWorkflowInput>) {
    const order = getOrderDetailWorkflow.runAsStep({
      input: {
        order_id: input.order_id,
        fields: [
          'id',
          'currency_code',
          'total',
          'seller.*',
          'seller.payout_account.*',
          'items.*',
          'items.commission_lines.*',
        ],
      }
    })

    const payoutInput = transform({ order }, ({ order }) => {
      const payoutAccountId = (order as any).seller?.payout_account?.id
      const sellerId = (order as any).seller?.id

      if (!payoutAccountId) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Seller does not have a payout account`
        )
      }

      const totalCommission = (order.items ?? []).reduce(
        (acc: number, item: any) => {
          const commissionAmount = item.commission_line?.amount ?? 0
          return MathBN.add(acc, commissionAmount) as unknown as number
        },
        0
      )

      const amount = MathBN.sub(order.total, totalCommission) as unknown as number

      return {
        account_id: payoutAccountId,
        seller_id: sellerId,
        amount,
        currency_code: order.currency_code,
        data: {
          order_id: order.id,
          seller_id: sellerId
        },
        context: {
          idempotency_key: order.id,
        },
      }
    })

    const payout = createPayoutStep({
      account_id: payoutInput.account_id,
      amount: payoutInput.amount,
      currency_code: payoutInput.currency_code,
      data: payoutInput.data,
      context: payoutInput.context,
    })

    createRemoteLinkStep([
      {
        [MercurModules.PAYOUT]: {
          payout_id: payout.id,
        },
        [MercurModules.SELLER]: {
          seller_id: payoutInput.seller_id,
        },
      },
    ])

    return new WorkflowResponse(payout)
  }
)
