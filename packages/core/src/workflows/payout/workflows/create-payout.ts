import { createRemoteLinkStep, useQueryGraphStep } from "@medusajs/medusa/core-flows"
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
    // Read the order via the query graph rather than getOrderDetailWorkflow:
    // the computed `total` only reflects the goods when the order item detail
    // (quantity) is loaded, otherwise items contribute 0 and the payout
    // collapses to (shipping − commission), which can go negative.
    const orderQuery = useQueryGraphStep({
      entity: "order",
      fields: [
        'id',
        'currency_code',
        'total',
        'seller.id',
        'seller.payout_account.id',
        'items.id',
        'items.detail.quantity',
        'items.raw_unit_price',
        'shipping_methods.id',
      ],
      filters: { id: input.order_id },
    }).config({ name: "fetch-order" })

    const order = transform(
      { orderQuery },
      ({ orderQuery }) => orderQuery.data?.[0]
    )

    const commissionFilters = transform({ order }, ({ order }) => ({
      $or: [
        { item_id: ((order as any)?.items ?? []).map((item: any) => item.id) },
        {
          shipping_method_id: ((order as any)?.shipping_methods ?? []).map(
            (method: any) => method.id
          ),
        },
      ],
    }))

    // The order→commission links resolve for items but not shipping methods,
    // so read the order's commission lines (item + shipping) straight from
    // the commission module via query.
    const { data: commissionLines } = useQueryGraphStep({
      entity: "commission_line",
      fields: ["amount"],
      filters: commissionFilters,
    }).config({ name: "fetch-commission-lines" })

    const payoutInput = transform(
      { order, commissionLines },
      ({ order, commissionLines }) => {
        if (!order) {
          throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            `Order was not found`
          )
        }

        const seller = Array.isArray((order as any).seller)
          ? (order as any).seller[0]
          : (order as any).seller
        const payoutAccountId = seller?.payout_account?.id
        const sellerId = seller?.id

        if (!payoutAccountId) {
          throw new MedusaError(
            MedusaError.Types.NOT_FOUND,
            `Seller does not have a payout account`
          )
        }

        const totalCommission = (commissionLines ?? []).reduce(
          (acc: number, line: any) =>
            MathBN.add(acc, line?.amount ?? 0) as unknown as number,
          0
        )

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
      }
    )

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
