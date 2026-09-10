import {
  WorkflowData,
  WorkflowResponse,
  createHook,
  createWorkflow,
  transform,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import {
  CommissionCalculationContext,
  CommissionLineDTO,
} from "@mercurjs/types"

import { getCommissionLinesStep, upsertCommissionLinesStep } from "../steps"

const orderFields = [
  "id",
  "status",
  "version",
  "currency_code",
  "email",
  "canceled_at",
  "sales_channel_id",
  "region_id",
  "customer_id",
  "customer.*",
  "customer.groups.*",
  "promotions.*",
  "subtotal",
  "items.*",
  "items.subtotal",
  "items.tax_total",
  "items.total",
  "items.product.id",
  "items.product.collection_id",
  "items.product.categories.id",
  "items.product.tags.id",
  "items.product.type_id",
  "items.product.attribute_values.id",
  "items.offer.seller_id",
  "items.adjustments.*",
  "shipping_methods.*",
  "shipping_methods.total",
  "shipping_methods.subtotal",
  "shipping_methods.tax_total",
  "shipping_methods.adjustments.*",
  "shipping_methods.shipping_option_id",
  "shipping_address.*",
]

export type RefreshOrderCommissionLinesWorkflowInput = {
  order_ids: string[]
}

export const refreshOrderCommissionLinesWorkflowId = "refresh-order-commission-lines"

/**
 * `setCommissionContext` receives the contexts built from the orders. A
 * handler returns `new StepResponse(contexts)` with `additional_context`
 * filled in, or nothing to leave the contexts as they are.
 */
export type RefreshOrderCommissionLinesWorkflowHooks = [
  Hook<
    "setCommissionContext",
    { contexts: CommissionCalculationContext[] },
    CommissionCalculationContext[] | void
  >,
]

export const refreshOrderCommissionLinesWorkflow: ReturnWorkflow<
  RefreshOrderCommissionLinesWorkflowInput,
  CommissionLineDTO[],
  RefreshOrderCommissionLinesWorkflowHooks
> = createWorkflow(
  refreshOrderCommissionLinesWorkflowId,
  function (
    input: WorkflowData<RefreshOrderCommissionLinesWorkflowInput>
  ) {
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: orderFields,
      filters: { id: input.order_ids },
      options: {
        throwIfKeyNotFound: true,
      },
    }).config({ name: "fetch-orders" })

    const commissionContexts = transform({ orders }, ({ orders }) => {
      return orders.map((order: any): CommissionCalculationContext => ({
        currency_code: order.currency_code,
        order_id: order.id,
        seller_id: order.items?.[0]?.offer?.seller_id,
        items: (order.items ?? []).map((item: any) => ({
          id: item.id,
          subtotal: item.subtotal,
          tax_total: item.tax_total,
          total: item.total,
          product: item.product
            ? {
              id: item.product.id,
              collection_id: item.product.collection_id,
              categories: item.product.categories,
              tags: item.product.tags,
              type_id: item.product.type_id,
              seller: item.offer?.seller_id
                ? { id: item.offer.seller_id }
                : undefined,
              attribute_value_ids: (item.product.attribute_values ?? [])
                .map((value: { id: string }) => value.id),
            }
            : undefined,
        })),
        shipping_methods: (order.shipping_methods ?? []).map((method: any) => ({
          id: method.id,
          subtotal: method.subtotal,
          tax_total: method.tax_total,
        })),
      }))
    })

    const setCommissionContext = createHook("setCommissionContext", {
      contexts: commissionContexts,
    })

    const contexts = transform(
      { commissionContexts, hookResult: setCommissionContext.getResult() },
      ({ commissionContexts, hookResult }): CommissionCalculationContext[] =>
        (hookResult as CommissionCalculationContext[] | undefined) ??
        commissionContexts
    )

    const commissionLines = getCommissionLinesStep(contexts)

    const upsertedCommissionLines = upsertCommissionLinesStep({
      commission_lines: commissionLines,
    })

    return new WorkflowResponse(upsertedCommissionLines, {
      hooks: [setCommissionContext],
    })
  }
)
