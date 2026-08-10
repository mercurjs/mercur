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


export type GetOrderGroupsListWorkflowInput = {
  fields: string[]
  variables?: Record<string, any> & {
    skip?: number
    take?: number
    order?: Record<string, string>
  }
  sellerId?: string | string[]
}

export const getOrderGroupsListWorkflowId = "get-order-groups-list"

export const getOrderGroupsListWorkflow = createWorkflow(
  getOrderGroupsListWorkflowId,
  (
    input: WorkflowData<GetOrderGroupsListWorkflowInput>
  ) => {
    const fields = transform(input, ({ fields, sellerId }) => {
      return deduplicate([
        ...fields,
        "id",
        "orders.id",
        ...(sellerId ? ["orders.seller.id"] : []),
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

    const { data: orderGroups, metadata } = useQueryGraphStep({
      entity: "order_group",
      fields,
      filters: input.variables,
      pagination: {
        skip: input.variables?.skip,
        take: input.variables?.take,
        order: input.variables?.order,
      },
    })

    const aggregatedOrderGroups = transform(
      { orderGroups, metadata, input },
      ({ orderGroups, metadata, input }) => {
        const fields = input.fields
        const requiredPaymentFields = fields.some((f) =>
          f.includes("payment_collections")
        )
        const requiredFulfillmentFields = fields.some((f) =>
          f.includes("fulfillments")
        )

        const sellerIds = input.sellerId
          ? new Set(
              Array.isArray(input.sellerId)
                ? input.sellerId
                : [input.sellerId]
            )
          : undefined

        for (const group of orderGroups) {
          if (!group.orders) continue

          if (sellerIds) {
            group.orders = group.orders.filter((order: any) =>
              order.seller?.id ? sellerIds.has(order.seller.id) : false
            )
          }

          for (const order of group.orders) {
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

        return {
          rows: orderGroups,
          metadata,
        }
      }
    )

    return new WorkflowResponse(aggregatedOrderGroups as any)
  }
)
