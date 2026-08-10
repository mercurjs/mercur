import type { OrderDetailDTO } from "@medusajs/framework/types"
import { deduplicate } from "@medusajs/framework/utils"
import {
  createWorkflow,
  transform,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"

import {
  getLastFulfillmentStatus,
  getLastPaymentStatus,
} from "../utils/aggregate-status"

export type GetOrderGroupDetailWorkflowInput = {
  fields: string[]
  order_group_id: string
}

export const getOrderGroupDetailWorkflowId = "get-order-group-detail"

export const getOrderGroupDetailWorkflow = createWorkflow(
  getOrderGroupDetailWorkflowId,
  (input: WorkflowData<GetOrderGroupDetailWorkflowInput>) => {
    const fields = transform(input, ({ fields }) => {
      return deduplicate([
        ...fields,
        "id",
        "orders.id",
        "orders.status",
        "orders.version",
        "orders.currency_code",
        "orders.items.*",
        "orders.cart.payment_collection.status",
        "orders.cart.payment_collection.amount",
        "orders.cart.payment_collection.captured_amount",
        "orders.cart.payment_collection.refunded_amount",
        "orders.fulfillments.packed_at",
        "orders.fulfillments.shipped_at",
        "orders.fulfillments.delivered_at",
        "orders.fulfillments.canceled_at",
      ])
    })

    const variables = transform(input, ({ order_group_id }) => {
      return { id: order_group_id }
    })

    const { data: orderGroup } = useQueryGraphStep({
      entity: "order_group",
      filters: variables,
      fields,
      options: { throwIfKeyNotFound: true, isList: false },
    }).config({ name: "get-order-group" })

    const aggregatedOrderGroup = transform(
      { orderGroup, input },
      ({ orderGroup, input }) => {
        const fields = input.fields
        const requiredPaymentFields = fields.some((f) =>
          f.includes("payment_collections")
        )
        const requiredFulfillmentFields = fields.some((f) =>
          f.includes("fulfillments")
        )

        if (orderGroup.orders) {
          for (const order of orderGroup.orders) {
            const order_ = order as OrderDetailDTO & {
              cart?: { payment_collection?: unknown }
            }

            // The shared cart payment collection is fetched via
            // `cart.payment_collection`; expose it under `payment_collections`
            // so the status helper and API response keep the same shape.
            const cartPaymentCollection = order_.cart?.payment_collection
            order_.payment_collections = cartPaymentCollection
              ? [cartPaymentCollection as OrderDetailDTO["payment_collections"][number]]
              : []

            order_.payment_status = getLastPaymentStatus(
              order_
            ) as OrderDetailDTO["payment_status"]
            order_.fulfillment_status = getLastFulfillmentStatus(
              order_
            ) as OrderDetailDTO["fulfillment_status"]

            if (!input.fields.some((f) => f.startsWith("orders.cart"))) {
              // @ts-ignore
              delete order_.cart
            }

            if (!requiredPaymentFields) {
              // @ts-ignore
              delete order_.payment_collections
            }
            if (!requiredFulfillmentFields) {
              // @ts-ignore
              delete order_.fulfillments
            }
          }
        }

        return orderGroup
      }
    )

    return new WorkflowResponse(aggregatedOrderGroup)
  }
)
