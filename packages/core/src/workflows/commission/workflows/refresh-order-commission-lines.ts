import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { CommissionLineDTO } from "@mercurjs/types"

import { getCommissionLinesStep, upsertCommissionLinesStep } from "../steps"

const orderFields = [
  "id",
  "currency_code",
  "items.id",
  "items.subtotal",
  "items.tax_total",
  "items.product.id",
  "items.product.collection_id",
  "items.product.categories.id",
  "items.product.tags.id",
  "items.product.type_id",
  "items.product.seller.id",
  "shipping_methods.id",
  "shipping_methods.subtotal",
  "shipping_methods.tax_total",
  "shipping_methods.shipping_option.shipping_option_type_id",
]

export type RefreshOrderCommissionLinesWorkflowInput = {
  order_ids: string[]
}

export const refreshOrderCommissionLinesWorkflowId = "refresh-order-commission-lines"

export const refreshOrderCommissionLinesWorkflow = createWorkflow(
  refreshOrderCommissionLinesWorkflowId,
  function (
    input: WorkflowData<RefreshOrderCommissionLinesWorkflowInput>
  ): WorkflowResponse<CommissionLineDTO[]> {
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: orderFields,
      filters: { id: input.order_ids },
      options: {
        throwIfKeyNotFound: true,
      },
    }).config({ name: "fetch-orders" })

    const commissionContexts = transform({ orders }, ({ orders }) =>
      orders.map((order: any) => ({
        currency_code: order.currency_code,
        items: (order.items ?? []).map((item: any) => ({
          id: item.id,
          subtotal: item.subtotal,
          tax_total: item.tax_total,
          product: item.product
            ? {
                id: item.product.id,
                collection_id: item.product.collection_id,
                categories: item.product.categories,
                tags: item.product.tags,
                type_id: item.product.type_id,
                seller: item.product.seller,
              }
            : undefined,
        })),
        shipping_methods: (order.shipping_methods ?? []).map((method: any) => ({
          id: method.id,
          subtotal: method.subtotal,
          tax_total: method.tax_total,
          shipping_option: method.shipping_option
            ? {
                shipping_option_type_id:
                  method.shipping_option.shipping_option_type_id,
              }
            : undefined,
        })),
      }))
    )

    const commissionLines = getCommissionLinesStep(commissionContexts)

    const upsertedCommissionLines = upsertCommissionLinesStep({
      commission_lines: commissionLines,
    })

    return new WorkflowResponse(upsertedCommissionLines)
  }
)
