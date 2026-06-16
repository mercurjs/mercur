import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { getOrderDetailWorkflow } from "@medusajs/medusa/core-flows"
import { WorkflowData, WorkflowResponse, createWorkflow, transform } from "@medusajs/framework/workflows-sdk"
import { MathBN, MedusaError } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import { createPayoutStep } from "../steps"
import { getOrderCommissionTotalStep } from "../../commission/steps"

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
          'items.id',
          'shipping_methods.id',
        ],
      }
    })

    const commissionIds = transform({ order }, ({ order }) => ({
      item_ids: (order.items ?? []).map((item: any) => item.id),
      shipping_method_ids: ((order as any).shipping_methods ?? []).map(
        (method: any) => method.id
      ),
    }))

    // Sum commission (item + shipping lines) straight from the commission
    // module rather than traversing the order→commission links.
    const totalCommission = getOrderCommissionTotalStep(commissionIds)

    const payoutInput = transform(
      { order, totalCommission },
      ({ order, totalCommission }) => {
        const payoutAccountId = (order as any).seller?.payout_account?.id
        const sellerId = (order as any).seller?.id

        if (!payoutAccountId) {
          throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            `Seller does not have a payout account`
          )
        }

        const amount = MathBN.sub(
          order.total,
          totalCommission
        ) as unknown as number

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
