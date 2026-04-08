import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { ServiceFeeLineDTO } from "@mercurjs/types"

import { getServiceFeeLinesStep } from "../steps/get-service-fee-lines"
import { upsertServiceFeeLinesStep } from "../steps/upsert-service-fee-lines"

const orderFields = [
  "id",
  "status",
  "version",
  "currency_code",
  "items.*",
  "items.subtotal",
  "items.tax_total",
  "items.product.id",
  "items.product.collection_id",
  "items.product.categories.id",
  "items.product.tags.id",
  "items.product.type_id",
  "items.product.seller.id",
  "shipping_methods.*",
  "shipping_methods.subtotal",
  "shipping_methods.tax_total",
]

export type RefreshOrderServiceFeeLinesWorkflowInput = {
  order_ids: string[]
}

export const refreshOrderServiceFeeLinesWorkflowId =
  "refresh-order-service-fee-lines"

export const refreshOrderServiceFeeLinesWorkflow = createWorkflow(
  refreshOrderServiceFeeLinesWorkflowId,
  function (
    input: WorkflowData<RefreshOrderServiceFeeLinesWorkflowInput>
  ): WorkflowResponse<ServiceFeeLineDTO[]> {
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: orderFields,
      filters: { id: input.order_ids },
      options: {
        throwIfKeyNotFound: true,
      },
    }).config({ name: "fetch-orders-for-service-fees" })

    const feeContexts = transform({ orders }, ({ orders }) => {
      return orders.map((order: any) => ({
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
        shipping_methods: (order.shipping_methods ?? []).map(
          (method: any) => ({
            id: method.id,
            subtotal: method.subtotal,
            tax_total: method.tax_total,
          })
        ),
      }))
    })

    const feeLines = getServiceFeeLinesStep(feeContexts)

    const upsertedFeeLines = upsertServiceFeeLinesStep(feeLines)

    return new WorkflowResponse(upsertedFeeLines)
  }
)
