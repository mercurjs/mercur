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
}

export const getOrderGroupsListWorkflowId = "get-order-groups-list"

export const getOrderGroupsListWorkflow = createWorkflow(
  getOrderGroupsListWorkflowId,
  (
    input: WorkflowData<GetOrderGroupsListWorkflowInput>
  ) => {
    const fields = transform(input, ({ fields }) => {
      return deduplicate([
        ...fields,
        "id",
        "orders.id",
        "orders.status",
        "orders.version",
        "orders.currency_code",
        "orders.items.*",
        "orders.payment_collections.status",
        "orders.payment_collections.amount",
        "orders.payment_collections.captured_amount",
        "orders.payment_collections.refunded_amount",
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

        for (const group of orderGroups) {
          if (!group.orders) continue

          for (const order of group.orders) {
            const order_ = order as OrderDetailDTO

            order_.payment_status = getLastPaymentStatus(
              order_
            ) as OrderDetailDTO["payment_status"]
            order_.fulfillment_status = getLastFulfillmentStatus(
              order_
            ) as OrderDetailDTO["fulfillment_status"]

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
